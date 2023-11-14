// env: worker

import NTDLL, { PROCESS_CREATE } from "../types/ntdll.types.js";

import Executable from "../types/Executable.js";
import Message from "../types/Message.js";
import { SUBSYS_NTDLL } from "../types/subsystems.js";
import { Subsystem } from "../types/types.js";

// all worker events should be handled by this subsystem
const __addEventListener = globalThis.addEventListener;
const __removeEventListener = globalThis.removeEventListener;
const __postMessage = globalThis.postMessage;

globalThis.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined) => {
    console.warn(`ignoring addEventListener(${type})`);
}

globalThis.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined) => {
    console.warn(`ignoring removeEventListener(${type})`);
}

globalThis.postMessage = () => {
    console.warn(`ignoring postMessage()`);
}

delete globalThis.onmessage;
delete globalThis.onerror;
delete globalThis.onmessageerror;
delete globalThis.onunhandledrejection;

class SubsystemClass {
    public readonly name: string;

    private handler: (msg: Omit<Message, "subsys">) => void;
    private callbackMap = new Map<number, (msg: Message) => void>();
    private callbackId = 0;

    constructor(name: string, handler: (msg: Omit<Message, "subsys">) => void) {
        this.name = name;
        this.handler = handler;

        __addEventListener('message', (event) => this.HandleMessage(event.data as Message));
    }

    public async SendMessage({ type, data }: Omit<Message, "subsys">): Promise<Message> {
        console.debug(`${this.name}:client sending message %s:%d, %O`, this.name, type, data);
        return new Promise((resolve, reject) => {
            const id = this.RegisterCallback((msg) => {
                if (msg.type & 0x80000000) {
                    reject(msg.data);
                }
                else {
                    resolve(msg);
                }
            });

            const msg: Message = {
                subsys: this.name,
                type: type,
                reply: id,
                data: data,
            }
            __postMessage(msg);
        });
    }

    public async PostMessage(msg: Omit<Message, "subsys">): Promise<void> {
        console.debug(`${this.name}:client sending message %s:%d, %O`, this.name, msg.type, msg.data);
        __postMessage({ subsys: this.name, ...msg });
    }

    public RegisterCallback(callback: (msg: Message) => void): number {
        const id = this.callbackId++;
        this.callbackMap.set(id, callback);
        return id;
    }

    private async HandleMessage(msg: Message): Promise<void> {
        if (msg.subsys !== this.name) return;

        console.debug(`${this.name}:client recieved message %s:%d -> %d, %O`, msg.subsys, msg.type, msg.reply, msg.data);

        const callback = this.callbackMap.get(msg.reply);
        if (callback) {
            callback(msg);
        } else {
            this.handler(msg);
        }
    }
}

let sharedMemory: SharedArrayBuffer; // todo: move this somewhere else
const loadedModules: string[] = [];

// const subsystems = new Map<Subsystem, SubsystemClass>();

// __addEventListener('message', (event) => {
//     console.debug(`ntclient recieved message %s:%d, %O`, event.data.subsys, event.data.type, event.data.data);
//     // const handler = subsystems.get(event.data.subsys);
//     // if (handler) {
//     //     handler.ProcessMessage(event.data);
//     // } else {
//     //     console.error(`unknown subsystem ${event.data.subsys}`);
//     // }
// });

__addEventListener('error', (event) => {
    console.error(event); // TODO: send error to parent
});

__addEventListener('messageerror', (event) => {
    console.error(event); // TODO: send error to parent
});

__addEventListener('unhandledrejection', (event) => {
    console.error(event); // TODO: send error to parent
});

const Ntdll = new SubsystemClass(SUBSYS_NTDLL, NTDLL_HandleMessage);

async function NtRegisterSubsystem(subsys: Subsystem, handler: (msg: Omit<Message, "subsys">) => void): Promise<SubsystemClass> {
    await Ntdll.SendMessage({
        type: NTDLL.LoadSubsystem,
        data: {
            lpSubsystem: subsys,
        }
    });

    return new SubsystemClass(subsys, handler);
}

async function LdrInitializeThunk(pPC: PROCESS_CREATE) {
    sharedMemory = pPC.lpSharedMemory;

    const exec = pPC.lpExecutable;
    for (const lpDependencies of exec.dependencies) {
        await LdrLoadDll(lpDependencies, pPC);
    }

    await BaseThreadInitThunk(pPC);
}

async function LdrLoadDll(lpLibFileName: string, pPC: PROCESS_CREATE) {
    if (loadedModules.includes(lpLibFileName)) return;

    console.debug(`LdrLoadDll:${lpLibFileName}...`);

    // TODO: search for dll in search path
    const module = await import("/client/" + lpLibFileName);
    if (!module.default) {
        throw new Error(`invalid module ${lpLibFileName}`);
    }

    loadedModules.push(lpLibFileName);

    const exec = module.default as Executable;
    if (exec.type !== "dll") {
        throw new Error(`invalid module ${lpLibFileName}`);
    }

    for (const lpDependency of exec.dependencies) {
        await LdrLoadDll(lpDependency, pPC);
    }

    if (module[exec.entryPoint]) {
        let retVal = module[exec.entryPoint]();
        if (retVal && retVal.then) {
            retVal = await retVal;
        }
    }
}

async function BaseThreadInitThunk(pPC: PROCESS_CREATE) {
    const exec = pPC.lpExecutable;
    const module = await import("/" + exec.file);
    if (module[exec.entryPoint]) {
        let retVal = module[exec.entryPoint]();
        if (retVal && retVal.then) {
            retVal = await retVal;
        }

        await Ntdll.SendMessage({
            type: NTDLL.ProcessExit,
            data: {
                uExitCode: retVal ?? 0,
            }
        });
    }
}

function NTDLL_HandleMessage(msg: Message) {
    switch (msg.type) {
        case NTDLL.ProcessCreate: // load executable
            LdrInitializeThunk(msg.data);
            break;
    }
};

const ntdll: Executable = {
    file: "ntdll.js",
    type: "dll",
    subsystem: "console",
    arch: "js",
    entryPoint: null,
    dependencies: [],

    name: "ntdll",
    version: [1, 0, 0, 0],
    rsrc: {}
}

export default ntdll;

export { NtRegisterSubsystem };