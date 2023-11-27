import { HANDLE, PEB, SUBSYSTEM, SUBSYSTEM_DEF, Version } from "./types/types.js";
import NTDLL, { PROCESS_CREATE } from "./types/ntdll.types.js";
import { ObDestroyHandle, ObGetObject, ObSetObject } from "./objects.js";

import Executable from "./types/Executable.js";
import Message from "./types/Message.js";
import NTDLL_SUBSYSTEM from "./server/ntdll.js";
import { NtAllocSharedMemory } from "./sharedmem.js";
import { NtGetDefaultDesktop } from "./win32k/desktop.js";
import { SUBSYS_NTDLL } from "./types/subsystems.js";

export class PsProcess {
    id: number;
    name: string;
    version: Version;
    executable: string;
    args: string;
    cwd: string;
    env: { [key: string]: string; };

    handle: HANDLE;

    hIn: HANDLE;
    hOut: HANDLE;
    hErr: HANDLE;

    exitCode?: number;

    onTerminating?: () => void;
    onTerminate?: (exitCode: number) => void;

    private worker: Worker;
    private exec: Executable;
    peb: PEB;

    private hSharedMemory: HANDLE;

    private callbackMap = new Map<number, (msg: Message) => any | Promise<any>>();
    private callbackId = 0x7FFFFFFF;

    private state: 'running' | 'terminating' | 'terminated' = 'running';

    constructor(exec: Executable, args: string, cwd: string = "C:\\Windows\\System32", env: { [key: string]: string; } = {}) {
        this.handle = ObSetObject<PsProcess>(this, "PROC", null, this.Quit.bind(this));
        this.id = this.handle;
        this.name = exec.name;
        this.version = exec.version;
        this.executable = exec.file;
        this.args = args;
        this.cwd = cwd;
        this.env = env;
        this.exec = exec;

        this.hSharedMemory = NtAllocSharedMemory(16 * 1024, this.handle)

        this.peb = {
            hProcess: this.handle,
            hThread: 0,
            dwProcessId: this.id,
            dwThreadId: 0,
            hDesktop: NtGetDefaultDesktop(),
            lpSubsystems: new Map()
        };

        this.CreateSubsystem(NTDLL_SUBSYSTEM);
    }

    Start() {
        this.worker = new Worker('/client/ntdll.js', { type: "module", name: this.name });
        this.worker.onmessage = (event) => this.HandleMessage(event.data as Message);
        this.worker.onerror = (event) => console.error(event);
        this.worker.onmessageerror = (event) => console.error(event);

        const create: PROCESS_CREATE = {
            hProcess: this.handle,
            lpExecutable: this.exec,
            lpCommandLine: this.args,
            lpCurrentDirectory: this.cwd,
            lpEnvironment: this.env,
            lpSharedMemory: ObGetObject<SharedArrayBuffer>(this.hSharedMemory),
        }

        this.PostMessage({
            lpSubsystem: SUBSYS_NTDLL,
            nType: NTDLL.ProcessCreate,
            data: create
        });
    }

    /**
     * Semi-gracefully terminates the process by calling exit handlers and then terminating the worker.
     */
    async Quit() {
        if (this.state === 'terminating' || this.state === 'terminated') {
            return;
        }

        this.state = 'terminating';

        for (const [_, subsys] of this.peb.lpSubsystems) {
            await subsys.lpfnExit?.(this.peb, subsys);
        }

        this.worker.terminate();
        this.worker = null;

        this.onTerminate?.(0);
        this.state = 'terminated';

        ObDestroyHandle(this.handle);
    }

    /**
     * Forcefully terminates the process without calling any exit handlers, attempts
     * to destroy all objects owned by the process.
     * @internal
     */
    Terminate() {
        this.worker.terminate();
        this.worker = null;

        try {
            this.onTerminate?.(0);
            this.state = 'terminated';

            ObDestroyHandle(this.handle);
        }
        catch (e) {
            console.error(e);
        }
    }

    SendMessage<S = any, R = any>(msg: Message<S>): Promise<Message<R>> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                console.warn(`worker is null, is the process terminated? dropping message %s:%d, %O`, msg.lpSubsystem, msg.nType, msg);
                return;
            }

            const mark = performance.mark(`Server_SendMessage:${msg.lpSubsystem}:${msg.nType}`);
            const channel = this.RegisterCallback((msg) => {
                if (msg.nType & 0x80000000) {
                    reject(msg.data);
                }
                else {
                    resolve(msg);
                }

                performance.measure(`SendMessage:${msg.lpSubsystem}:${msg.nType}`, { start: mark.startTime, end: performance.now() });
            });

            this.worker.postMessage({
                lpSubsystem: msg.lpSubsystem,
                nType: msg.nType,
                nChannel: msg.nChannel ?? channel,
                nReplyChannel: channel,
                data: msg.data
            });
        });
    }

    private PostMessage<S = any>(msg: Message<S>) {
        if (!this.worker) {
            console.warn(`worker is null, is the process terminated? dropping message %s:%d, %O`, msg.lpSubsystem, msg.nType, msg);
            return;
        }

        performance.mark(`Server_PostMessage:${msg.lpSubsystem}:${msg.nType}`);
        this.worker.postMessage(msg);
    }

    private RegisterCallback(callback: (msg: Message) => any | Promise<any>) {
        const id = --this.callbackId;
        const handler = (msg: Message) => {
            this.callbackMap.delete(id);
            return callback(msg);
        };

        this.callbackMap.set(id, handler);
        return id;
    }

    private async HandleMessage(msg: Message) {
        const callback = this.callbackMap.get(msg.nChannel);
        if (callback) {
            callback(msg);
            this.callbackMap.delete(msg.nChannel);
        }
        else {
            await this.HandleSyscall(msg);
        }
    }

    private async HandleSyscall(msg: Message) {
        const handler = this.peb.lpSubsystems.get(msg.lpSubsystem)?.lpExports[msg.nType];
        if (handler) {
            try {
                const mark = performance.now();

                let resp = await handler(this.peb, msg.data);
                this.PostMessage({ lpSubsystem: msg.lpSubsystem, nType: msg.nType, nChannel: msg.nChannel, data: resp });

                performance.measure(`HandleSyscall:${msg.lpSubsystem}:${msg.nType}`, { start: mark, end: performance.now() });
            } catch (e) {
                this.PostMessage({ lpSubsystem: msg.lpSubsystem, nType: msg.nType | 0x80000000, nChannel: msg.nChannel, data: e });
                console.error(`error while handling message ${msg.lpSubsystem}:${msg.nType}`);
                console.error(e);
            }
        } else {
            console.error(`unknown message ${msg.lpSubsystem}:${msg.nType}`);
            this.PostMessage({ lpSubsystem: msg.lpSubsystem, nType: msg.nType | 0x80000000, nChannel: msg.nChannel, data: null });
        }
    }


    async CreateSubsystem(subsystem: SUBSYSTEM_DEF, sharedMemory: SharedArrayBuffer = null) {
        if (!this.peb.lpSubsystems.has(subsystem.lpszName)) {
            const data: SUBSYSTEM = {
                lpSubsystem: subsystem.lpszName,
                lpSharedMemory: sharedMemory,
                lpExports: subsystem.lpExports,
                lpfnInit: subsystem.lpfnInit,
                lpfnExit: subsystem.lpfnExit,
            }

            this.peb.lpSubsystems.set(subsystem.lpszName, data);

            await subsystem.lpfnInit?.(this.peb, data);
        }
    }
}
