// env: worker

import NTDLL, {
    CALLBACK_MESSAGE_TYPE,
    LOAD_SUBSYSTEM,
    PROCESS_CREATE,
    PROCESS_EXIT,
    SUBSYSTEM_LOADED
} from "../types/ntdll.types.js";

import Executable from "../types/Executable.js";
import Message from "../types/Message.js";
import { SUBSYS_NTDLL } from "../types/subsystems.js";
import { SubsystemId } from "../types/types.js";

// all worker events should be handled by this subsystem
const __addEventListener = globalThis.addEventListener;
const __removeEventListener = globalThis.removeEventListener;
const __postMessage = globalThis.postMessage;

// detouring these breaks the functions in safari :D

// globalThis.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined) => {
//     console.warn(`ignoring addEventListener(${type})`);
// }

// globalThis.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined) => {
//     console.warn(`ignoring removeEventListener(${type})`);
// }

// globalThis.postMessage = () => {
//     console.warn(`ignoring postMessage()`);
// }

// delete globalThis.onmessage;
// delete globalThis.onerror;
// delete globalThis.onmessageerror;
// delete globalThis.onunhandledrejection;

class SubsystemClass {
    public readonly name: string;

    private handler: (msg: Omit<Message, "lpSubsystem">) => void;
    private sharedMemory: SharedArrayBuffer;
    private callbackMap = new Map<number, (msg: Message) => any | Promise<any>>();
    private callbackId = 0x4000;

    public get memory(): SharedArrayBuffer {
        return this.sharedMemory;
    }

    constructor(name: string, handler: (msg: Omit<Message, "lpSubsystem">) => void, sharedMemory?: SharedArrayBuffer) {
        this.name = name;
        this.handler = handler;
        this.sharedMemory = sharedMemory;

        __addEventListener('message', (event) => this.HandleMessage(event.data as Message));
    }

    public async SendMessage<S = any, R = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<Message<R>> {
        // console.debug(`${this.name}:client sending message %s:%d, %O`, this.name, msg.nType, msg);

        return new Promise((resolve, reject) => {
            const channel = this.RegisterCallback((msg) => {
                if (msg.nType & 0x80000000) {
                    reject(msg.data);
                }
                else {
                    resolve(msg);
                }
            });

            __postMessage({
                lpSubsystem: this.name,
                nType: msg.nType,
                nChannel: msg.nReplyChannel ?? channel,
                nReplyChannel: channel,
                data: msg.data
            });
        });
    }

    public async PostMessage<S = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<void> {
        // console.debug(`${this.name}:client sending message %s:%d, %O`, this.name, msg.nType, msg);

        __postMessage({
            lpSubsystem: this.name,
            nType: msg.nType,
            nChannel: msg.nChannel,
            nReplyChannel: msg.nReplyChannel,
            data: msg.data
        });
    }

    public RegisterCallback(callback: (msg: Message) => void, persist: boolean = false): number {
        const id = this.callbackId++;
        const handler = async (msg: Message) => {
            if (!persist)
                this.callbackMap.delete(id);
            return await callback(msg);
        };

        this.callbackMap.set(id, handler);
        return id;
    }

    private async HandleMessage(msg: Message): Promise<void> {
        if (msg.lpSubsystem !== this.name) return;

        // console.log(`${this.name}:client recieved message %s:%d -> %d, %O`, msg.lpSubsystem, msg.nType, msg.nChannel, msg);

        const callback = this.callbackMap.get(msg.nChannel);
        if (callback) {
            let ret = await callback(msg);
            if (ret !== undefined && msg.nReplyChannel) {
                await this.PostMessage({ nType: msg.nType, nChannel: msg.nReplyChannel, data: ret });
            }
        } else {
            return this.handler(msg);
        }
    }
}

const loadedModules: string[] = [];

__addEventListener('message', (event) => {
    // console.debug(`client recieved message %s:%d, %O`, event.data.lpSubsystem, event.data.nType, event.data);
});

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

async function NtRegisterSubsystem(subsys: SubsystemId, handler: (msg: Omit<Message, "subsys">) => void, cbSharedMemory: number = 0): Promise<SubsystemClass> {
    const retVal = await Ntdll.SendMessage<LOAD_SUBSYSTEM, SUBSYSTEM_LOADED>({
        nType: NTDLL.LoadSubsystem,
        data: {
            lpSubsystem: subsys,
            cbSharedMemory
        }
    });

    return new SubsystemClass(subsys, handler, retVal.data.lpSharedMemory);
}

async function LdrInitializeThunk(pPC: PROCESS_CREATE) {
    const exec = pPC.lpExecutable;
    for (const lpDependencies of exec.dependencies) {
        await LdrLoadDll(lpDependencies, pPC);
    }

    await BaseThreadInitThunk(pPC);
}

async function LdrLoadDll(lpLibFileName: string, pPC: PROCESS_CREATE) {
    if (loadedModules.includes(lpLibFileName)) return;

    console.log(`LdrLoadDll:${lpLibFileName}...`);

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
        let retVal = await module[exec.entryPoint]();
    }
}

async function BaseThreadInitThunk(pPC: PROCESS_CREATE) {
    const exec = pPC.lpExecutable;
    const module = await import("/" + exec.file);
    if (module[exec.entryPoint]) {
        let retVal = await module[exec.entryPoint]();

        await Ntdll.SendMessage<PROCESS_EXIT>({
            nType: NTDLL.ProcessExit,
            data: {
                uExitCode: retVal ?? 0,
            }
        });
    }
}

function NTDLL_HandleMessage(msg: Message) {
    switch (msg.nType) {
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