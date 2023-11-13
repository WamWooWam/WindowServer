import { HANDLE, PEB, Subsystem, SubsystemHandlers, Version } from "./types/types.js";
import { ObDestroyHandle, ObSetObject } from "./objects.js";

import Executable from "./types/Executable.js";
import Message from "./types/Message.js";
import NTDLL from "./types/ntdll.types.js";
import NTDLL_EXPORTS from "./server/ntdll.js";
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

    private sharedMemory: SharedArrayBuffer;

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

        if (typeof SharedArrayBuffer !== 'undefined') {
            this.sharedMemory = new SharedArrayBuffer(16 * 1024); // 16kb
        }

        this.peb = {
            hProcess: this.handle,
            hThread: 0,
            dwProcessId: this.id,
            dwThreadId: 0,
            lpHandlers: new Map(),
            lpOwnedHandles: []
        };

        this.loadSubsystem(SUBSYS_NTDLL, NTDLL_EXPORTS);
    }

    start() {
        this.worker = new Worker('/client/ntdll.js', { type: "module", name: this.name });
        this.worker.onmessage = (event) => this.recieve(event.data as Message);
        this.send({ subsys: SUBSYS_NTDLL, type: NTDLL.ProcessCreate, data: { mem: this.sharedMemory, ...this.exec } });
    }

    terminate() {
        this.worker.terminate();
        for (const handle of [...this.peb.lpOwnedHandles]) {
            ObDestroyHandle(handle);
        }
    }

    send(msg: Message) {
        this.worker.postMessage(msg);
    }

    async recieve(msg: Message) {
        const handler = this.peb.lpHandlers.get(msg.subsys)?.[msg.type];
        const errorHandler = (e: Error) => {
            this.send({ subsys: msg.subsys, type: msg.type | 0x80000000, data: e });
            console.error(`error while handling message ${msg.subsys}:${msg.type}`);
            console.error(e);
        }

        try {
            if (handler) {
                console.log(`recieved message %s:%d, %O, calling %O`, msg.subsys, msg.type, msg.data, handler);
                let resp = handler(this.peb, msg.data);
                if (resp !== undefined && 'then' in resp && typeof resp.then === 'function') {
                    resp = await resp;
                }

                this.send({ subsys: msg.subsys, type: msg.type, data: resp });
            } else {
                console.error(`unknown message ${msg.subsys}:${msg.type}`);
                this.send({ subsys: msg.subsys, type: msg.type | 0x80000000, data: null });
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

    ownHandle(handle: HANDLE) {
        this.peb.lpOwnedHandles.push(handle);
    }

    disownHandle(handle: HANDLE) {
        const index = this.peb.lpOwnedHandles.indexOf(handle);
        if (index >= 0) {
            this.peb.lpOwnedHandles.splice(index, 1);
        }
    }
}
