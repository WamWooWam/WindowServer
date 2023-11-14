import { HANDLE, PEB, Subsystem, SubsystemHandlers, Version } from "./types/types.js";
import NTDLL, { PROCESS_CREATE } from "./types/ntdll.types.js";
import { ObDestroyHandle, ObGetObject, ObSetObject } from "./objects.js";

import Executable from "./types/Executable.js";
import Message from "./types/Message.js";
import NTDLL_EXPORTS from "./server/ntdll.js";
import { NtAllocSharedMemory } from "./sharedmem.js";
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

    constructor(exec: Executable, args: string, cwd: string = "C:\\Windows\\System32", env: { [key: string]: string; } = {}) {
        this.id = assignId();
        this.handle = ObSetObject<PsProcess>(this, null, this.terminate.bind(this));
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
            lpHandlers: new Map(),
        };

        this.loadSubsystem(SUBSYS_NTDLL, NTDLL_EXPORTS);
    }

    start() {
        this.worker = new Worker('/client/ntdll.js', { type: "module", name: this.name });
        this.worker.onmessage = (event) => this.recieve(event.data as Message);
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

        this.send({
            subsys: SUBSYS_NTDLL,
            type: NTDLL.ProcessCreate,
            data: create
        });
    }

    terminate() {
        this.worker.terminate();

        ObDestroyHandle(this.handle);
    }

    send(msg: Message) {
        this.worker.postMessage(msg);
    }

    async recieve(msg: Message) {
        const handler = this.peb.lpHandlers.get(msg.subsys)?.[msg.type];
        const errorHandler = (e: Error) => {
            this.send({ subsys: msg.subsys, type: msg.type | 0x80000000, reply: msg.reply, data: e });
            console.error(`error while handling message ${msg.subsys}:${msg.type}`);
            console.error(e);
        }

        try {
            if (handler) {
                console.log(`recieved message %s:%d, %O, calling %O`, msg.subsys, msg.type, msg, handler);

                let resp = handler(this.peb, msg.data);
                if (resp !== undefined && 'then' in resp && typeof resp.then === 'function') {
                    resp = await resp;
                }

                this.send({ subsys: msg.subsys, type: msg.type, reply: msg.reply, data: resp });
            } else {
                console.error(`unknown message ${msg.subsys}:${msg.type}`);
                this.send({ subsys: msg.subsys, type: msg.type | 0x80000000, reply: msg.reply, data: null });
            }
        } catch (error) {
            errorHandler(error);
        }
    }

    loadSubsystem(subsys: Subsystem, handler: SubsystemHandlers) {
        if (!this.peb.lpHandlers.has(subsys)) {
            this.peb.lpHandlers.set(subsys, handler);
        }
    }
}
