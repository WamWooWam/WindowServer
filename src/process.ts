import { HANDLE, PEB, SUBSYSTEM, SUBSYSTEM_DEF, SubsystemHandlers, SubsystemId, Version } from "./types/types.js";
import NTDLL, { CALLBACK_MESSAGE_TYPE, PROCESS_CREATE } from "./types/ntdll.types.js";
import { ObDestroyHandle, ObGetObject, ObSetObject } from "./objects.js";

import Executable from "./types/Executable.js";
import Message from "./types/Message.js";
import NTDLL_SUBSYSTEM from "./server/ntdll.js";
import { NtAllocSharedMemory } from "./sharedmem.js";
import { NtAwait } from "./util.js";
import { SUBSYS_NTDLL } from "./types/subsystems.js";

let __procId = 0;
const assignId = () => {
    const id = __procId;
    __procId += 3;
    return id;
}

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

    private worker: Worker;
    private exec: Executable;
    private peb: PEB;

    private hSharedMemory: HANDLE;

    private callbackMap = new Map<number, (msg: Message) => any | Promise<any>>();
    private callbackId = 0x7FFFFFFF;

    constructor(exec: Executable, args: string, cwd: string = "C:\\Windows\\System32", env: { [key: string]: string; } = {}) {
        this.id = assignId();
        this.handle = ObSetObject<PsProcess>(this, "PROC", null, this.terminate.bind(this));
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
            lpSubsystems: new Map()
        };

        this.CreateSubsystem(NTDLL_SUBSYSTEM);
    }

    start() {
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

    terminate() {
        this.worker.terminate();

        for (const [_, subsys] of this.peb.lpSubsystems) {
            subsys.lpfnExit?.(this.peb, subsys);
        }

        ObDestroyHandle(this.handle);
    }

    // send(msg: Message) {
    //     this.worker.postMessage(msg);
    // }

    async SendMessage<S = any, R = any>(msg: Message<S>): Promise<Message<R>> {
        console.debug(`server sending message %s:%d, %O`, msg.lpSubsystem, msg.nType, msg);

        return new Promise((resolve, reject) => {
            const channel = this.RegisterCallback((msg) => {
                if (msg.nType & 0x80000000) {
                    reject(msg.data);
                }
                else {
                    resolve(msg);
                }
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
        console.debug(`server posting message %s:%d, %O`, msg.lpSubsystem, msg.nType, msg);
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

    private HandleMessage(msg: Message) {
        const callback = this.callbackMap.get(msg.nChannel);
        if (callback) {
            callback(msg);
            this.callbackMap.delete(msg.nChannel);
        }
        else {
            this.recieve(msg);
        }
    }

    async recieve(msg: Message) {
        const handler = this.peb.lpSubsystems.get(msg.lpSubsystem)?.lpExports[msg.nType];
        if (handler) {
            try {
                console.log(`%s:server recieved message %s:%d, %O, calling %O`, msg.lpSubsystem, msg.lpSubsystem, msg.nType, msg, handler);

                let resp = await NtAwait(handler(this.peb, msg.data));

                this.PostMessage({ lpSubsystem: msg.lpSubsystem, nType: msg.nType, nChannel: msg.nChannel, data: resp });
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

            await NtAwait(subsystem.lpfnInit?.(this.peb, data));
        }
    }
}
