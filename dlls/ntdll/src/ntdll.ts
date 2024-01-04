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

import Executable from "@window-server/sdk/types/Executable.js";
import Message from "@window-server/sdk/types/Message.js";
import { PROCESS_CRASH } from "./types/ntdll.int.types.js";
import { SUBSYS_NTDLL } from "@window-server/sdk/types/subsystems.js";
import { SubsystemId } from "@window-server/sdk/types/types.js";

export * from "./types/ntdll.types.js";

const ERROR_BAD_EXE_FORMAT = 0x000000C1;
const ERROR_MOD_NOT_FOUND = 0x0000007E;
const ERROR_PROC_NOT_FOUND = 0x0000007F;
const ERROR_APP_INIT_FAILURE = 0x0000023F;

function FAILED(hr: number) {
    return hr < 0;
}

function HRESULT_FROM_WIN32(x: number) {
    return x <= 0 ? x : ((x & 0x0000FFFF) | (7 << 16) | 0x80000000);
}

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

const loadedModules: string[] = ["ntdll"];
const loadedModuleExports = new Map<string, any>();
loadedModuleExports.set("ntdll", {
    NtRegisterSubsystem,
    default: ntdll
});

const __oldRequire = (<any>globalThis).require;
const NtRequire = (module: string) => {
    if (module.startsWith("@window-server/")) {
        module = module.replace("@window-server/", "");
    }

    console.debug(`NtRequire:${module}...`, loadedModules, loadedModuleExports)

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

((<any>globalThis).require) = NtRequire;

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

async function NtTerminateProcess(uExitCode: number): Promise<never> {
    await Ntdll.SendMessage<PROCESS_EXIT>({
        nType: NTDLL.ProcessExit,
        data: {
            uExitCode
        }
    });

    throw null;
}

async function LdrInitializeThunk(pPC: PROCESS_CREATE) {
    await BaseThreadInitThunk(pPC);
}

async function LdrSearchPath(lpLibFileName: string, skipExports: boolean = false) {
    // debugger;
    try {
        let dotIdx = lpLibFileName.lastIndexOf('.');
        let libLibraryName = lpLibFileName;
        if (dotIdx !== -1 && lpLibFileName.substring(dotIdx) === '.js') {
            libLibraryName = lpLibFileName.substring(0, dotIdx) + '.dll';
        }
        else if (dotIdx === -1) {
            libLibraryName += '.dll';
        }

        console.log(`LdrSearchPath:${libLibraryName}...`);

        const retVal = await Ntdll.SendMessage<LOAD_LIBRARY, LOAD_LIBRARY_REPLY>({
            nType: NTDLL.LoadLibrary,
            data: {
                lpLibFileName: libLibraryName
            }
        });

        if (!retVal) {
            return { execInfo: null, exports: null, hModule: 0 };
        }

        const execInfo = retVal.data.lpExecInfo;
        if (skipExports) return { execInfo, exports: null, hModule: retVal.data.retVal };

        const module = await fetch(retVal.data.lpszLibFile);
        const exec = await module.text();

        const func = new Function("exports", "module", exec);
        const exports = {} as any;
        const moduleObj = { exports: {} } as any;
        func(exports, moduleObj); // TODO: use a sandbox

        // handle commonjs modules
        if (moduleObj.exports) {
            if (typeof moduleObj.exports === "function") {
                exports.default = moduleObj.exports;
            }
            else {
                Object.assign(exports, moduleObj.exports);
            }
        }

        console.log(`LdrSearchPath:${lpLibFileName} -> ${retVal.data.lpszLibFile}`);
        console.log(exports);

        return { execInfo, exports: exports as any, hModule: retVal.data.retVal };
    }
    catch (e) {
        console.error(`LdrSearchPath:${lpLibFileName} -> ${e}`);
        // debugger;
        throw e;
    }
}

async function LdrLoadDll(lpLibFileName: string): Promise<number> {
    if (lpLibFileName.startsWith("@window-server/")) {
        lpLibFileName = lpLibFileName.replace("@window-server/", "");
    }

    if (loadedModules.includes(lpLibFileName)) return 0;

    console.log(`LdrLoadDll:${lpLibFileName}...`);

    const module = await LdrSearchPath(lpLibFileName);
    if (!(module && module.execInfo && module.hModule)) {
        return HRESULT_FROM_WIN32(ERROR_MOD_NOT_FOUND);
    }

    const exec = module.execInfo;
    if (exec.type !== "dll") {
        return HRESULT_FROM_WIN32(ERROR_BAD_EXE_FORMAT);
    }

    loadedModules.push(lpLibFileName);
    loadedModuleExports.set(exec.name, module.exports);

    for (const lpDependency of exec.dependencies) {
        let hr = await LdrLoadDll(lpDependency);
        if (FAILED(hr)) return hr;
    }

    let retVal = 0;
    if (exec.entryPoint) {
        try {
            if (typeof exec.entryPoint === "string" && module.exports[exec.entryPoint]) {
                retVal = await module.exports[exec.entryPoint]();
            }
            else if (typeof exec.entryPoint === "function") {
                retVal = await exec.entryPoint();
            }
            else {
                retVal = HRESULT_FROM_WIN32(ERROR_PROC_NOT_FOUND);
            }
        }
        catch {
            retVal = HRESULT_FROM_WIN32(ERROR_APP_INIT_FAILURE);
        }
    }

    console.debug(`LdrLoadDll:${lpLibFileName} -> ${exec.entryPoint}`)
    console.debug(`LdrLoadDll:${lpLibFileName} -> ${retVal}`)

    return retVal ?? 0;
}

async function BaseThreadInitThunk(pPC: PROCESS_CREATE) {
    // load the executable, but don't run it yet
    let module = await LdrSearchPath(pPC.lpExecutable, true);
    let exec = module.execInfo;
    if (!exec || exec.type !== "executable") {
        await NtTerminateProcess(HRESULT_FROM_WIN32(ERROR_BAD_EXE_FORMAT));
        return;
    }

    for (const lpDependencies of exec.dependencies) {
        let hr = await LdrLoadDll(lpDependencies);
        if (FAILED(hr)) {
            await NtTerminateProcess(hr);
            return;
        }
    }

    // load and run the executable
    module = await LdrSearchPath(pPC.lpExecutable);
    if (!(module && module.execInfo && module.hModule)) {
        await NtTerminateProcess(HRESULT_FROM_WIN32(ERROR_MOD_NOT_FOUND));
        return;
    }

    let retVal = 0;
    if (exec.entryPoint) {
        if (typeof exec.entryPoint === "string" && module.exports[exec.entryPoint]) {
            retVal = await module.exports[exec.entryPoint]();
        }
        else if (typeof exec.entryPoint === "function") {
            retVal = await exec.entryPoint();
        }
        else {
            await NtTerminateProcess(HRESULT_FROM_WIN32(ERROR_PROC_NOT_FOUND));
            return;
        }
    }
    else {
        await NtTerminateProcess(HRESULT_FROM_WIN32(ERROR_PROC_NOT_FOUND));
        return;
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

export default ntdll;

export { NtRegisterSubsystem };