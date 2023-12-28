/**
 * @module ntdll
 * @description NT Layer DLL
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/winbase/}
 * @usermode
 */

import NTDLL, {
    LOAD_LIBRARY,
    LOAD_LIBRARY_REPLY,
    LOAD_SUBSYSTEM,
    PROCESS_CREATE,
    PROCESS_EXIT,
    SUBSYSTEM_LOADED
} from "./types/ntdll.int.types.js";

import Executable from "ntos-sdk/types/Executable.js";
import Message from "ntos-sdk/types/Message.js";
import { PROCESS_CRASH } from "./types/ntdll.int.types.js";
import { SUBSYS_NTDLL } from "ntos-sdk/types/subsystems.js";
import { SubsystemId } from "ntos-sdk/types/types.js";

export * from "./types/ntdll.types.js";

console.warn("ntdll.js");

// all worker events should be handled by this subsystem
const __addEventListener = globalThis.addEventListener;
const __removeEventListener = globalThis.removeEventListener;
const __postMessage = globalThis.postMessage;

export interface Subsystem {
    name: string;
    memory: SharedArrayBuffer | null;
    SendMessage<S = any, R = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<Message<R>>;
    PostMessage<S = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<void>;
    RegisterCallback(callback: (msg: Message) => any | Promise<any>, persist?: boolean): number;
    GetCallback(id: number): ((msg: Message) => void) | undefined;
}

class SubsystemClass implements Subsystem {
    public readonly name: string;

    private handler: (msg: Omit<Message, "lpSubsystem">) => void;
    private sharedMemory: SharedArrayBuffer | null;
    private callbackMap = new Map<number, (msg: Message) => any | Promise<any>>();
    private callbackId = 0x4000;

    public get memory(): SharedArrayBuffer | null {
        return this.sharedMemory;
    }

    constructor(name: string, handler: (msg: Omit<Message, "lpSubsystem">) => void, sharedMemory: SharedArrayBuffer | null = null) {
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

            globalThis.postMessage({
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

    public RegisterCallback(callback: (msg: Message) => any | Promise<any>, persist: boolean = false): number {
        const id = this.callbackId++;
        const handler = async (msg: Message) => {
            if (!persist)
                this.callbackMap.delete(id);
            return await callback(msg);
        };

        this.callbackMap.set(id, handler);
        return id;
    }

    public GetCallback(id: number): ((msg: Message) => void) | undefined {
        return this.callbackMap.get(id);
    }

    private async HandleMessage(msg: Message): Promise<void> {
        if (msg.lpSubsystem !== this.name) return;

        // console.log(`${this.name}:client recieved message %s:%d -> %d, %O`, msg.lpSubsystem, msg.nType, msg.nChannel, msg);

        const callback = msg.nChannel && this.callbackMap.get(msg.nChannel);
        if (callback) {
            let ret = await callback(msg);
            if (msg.nReplyChannel) {
                await this.PostMessage({ nType: msg.nType, nChannel: msg.nReplyChannel, data: ret });
            }
        } else {
            return this.handler(msg);
        }
    }
}

const loadedModules: string[] = ["ntdll.js"];
const loadedModuleExports = new Map<string, any>();
loadedModuleExports.set("ntdll", {
    NtRegisterSubsystem
});

const __oldRequire = globalThis.require;
const NtRequire = (module: string) => {
    if (!loadedModuleExports.has(module)) {
        if (__oldRequire) {
            return __oldRequire(module);
        }
        else {
            throw new Error(`module ${module} not found`);
        }
    }

    return loadedModuleExports.get(module);
}

(<any>globalThis.require) = NtRequire;

__addEventListener('message', (event) => {
    // console.debug(`client recieved message %s:%d, %O`, event.data.lpSubsystem, event.data.nType, event.data);
});

__addEventListener('error', (event) => {
    // console.error(event); // TODO: send error to parent
    Ntdll.SendMessage<PROCESS_CRASH>({
        nType: NTDLL.ProcessCrash,
        data: {
            uExitCode: 0xC0000144,
            error: event.error ?? event.message ?? event
        }
    });
});

__addEventListener('messageerror', (event) => {
    console.error(event); // TODO: send error to parent
});

__addEventListener('unhandledrejection', (event) => {
    Ntdll.SendMessage<PROCESS_CRASH>({
        nType: NTDLL.ProcessCrash,
        data: {
            uExitCode: 0xC0000409,
            error: event.reason
        }
    });
});

const Ntdll = new SubsystemClass(SUBSYS_NTDLL, NTDLL_HandleMessage);

async function NtRegisterSubsystem(subsys: SubsystemId, handler: (msg: Omit<Message, "subsys">) => void, cbSharedMemory: number = 0): Promise<Subsystem> {
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


async function LdrSearchPath(lpLibFileName: string, pPC: PROCESS_CREATE) {
    try {
        let libLibraryName = lpLibFileName.split('.')[0]; // kernel32.js -> kernel32
        if (loadedModules.includes(lpLibFileName)) {
            return loadedModuleExports.get(libLibraryName);
        }

        const retVal = await Ntdll.SendMessage<LOAD_LIBRARY, LOAD_LIBRARY_REPLY>({
            nType: NTDLL.LoadLibrary,
            data: {
                lpLibFileName
            }
        });

        const module = await fetch(retVal.data.lpszLibFile);
        const exec = await module.text();

        const func = new Function("exports", exec);
        const exports = {};
        func(exports); // TODO: use a sandbox

        console.log(`LdrSearchPath:${lpLibFileName} -> ${retVal.data.lpszLibFile}`);
        console.log(exports);

        loadedModules.push(lpLibFileName);
        loadedModuleExports.set(libLibraryName, exports);

        return exports as any;
    }
    catch (e) {
        console.error(`LdrSearchPath:${lpLibFileName} -> ${e}`);
        debugger;
        throw e;
    }
}

async function LdrLoadDll(lpLibFileName: string, pPC: PROCESS_CREATE) {
    if (loadedModules.includes(lpLibFileName)) return;

    console.log(`LdrLoadDll:${lpLibFileName}...`);

    // TODO: search for dll in search path
    const module = await LdrSearchPath(lpLibFileName, pPC);
    if (!module?.default) {
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

    console.log(`LdrLoadDll:${lpLibFileName} -> ${exec.entryPoint}`)

    let retVal = 0;
    if (exec.entryPoint) {
        if (typeof exec.entryPoint === "string" && module[exec.entryPoint]) {
            retVal = await module[exec.entryPoint]();
        }
        else if (typeof exec.entryPoint === "function") {
            retVal = await exec.entryPoint();
        }
        else {
            retVal = 0x800700C1;
        }
    }

    return retVal ?? 0;
}

async function BaseThreadInitThunk(pPC: PROCESS_CREATE) {
    const exec = pPC.lpExecutable;
    const module = await LdrSearchPath(exec.file, pPC);

    let retVal = 0;
    if (exec.entryPoint) {
        if (typeof exec.entryPoint === "string" && module[exec.entryPoint]) {
            retVal = await module[exec.entryPoint]();
        }
        else if (typeof exec.entryPoint === "function") {
            retVal = await exec.entryPoint();
        }
        else {
            retVal = 0x800700C1;
        }
    }

    await Ntdll.SendMessage<PROCESS_EXIT>({
        nType: NTDLL.ProcessExit,
        data: {
            uExitCode: retVal ?? 0
        }
    });
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