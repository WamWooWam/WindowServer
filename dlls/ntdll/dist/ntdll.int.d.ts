declare const CALLBACK_MESSAGE_TYPE = 2147483647;
type HANDLE$1 = number;

type Version = [major: number, minor: number, build: number, revision: number];
type HANDLE = number;//# sourceMappingURL=types.d.ts.map

interface Executable {
    file: string;
    type: "executable" | "dll";
    subsystem: "console" | "windows";
    arch: "js" | "wasm";
    entryPoint: string | Function | null;
    dependencies: string[];
    name: string;
    version: Version;
    rsrc: any;
}

declare const NTDLL: {
    ProcessCreate: number;
    LoadSubsystem: number;
    ProcessExit: number;
    ProcessCrash: number;
    LoadLibrary: number;
};

interface PROCESS_CREATE {
    hProcess: HANDLE;
    lpExecutable: Executable;
    lpCommandLine: string;
    lpCurrentDirectory: string;
    lpEnvironment: {
        [key: string]: string;
    };
    lpSharedMemory: SharedArrayBuffer;
}
interface PROCESS_EXIT {
    uExitCode: number;
}
interface LOAD_SUBSYSTEM {
    lpSubsystem: string;
    cbSharedMemory: number;
}
interface SUBSYSTEM_LOADED {
    lpSharedMemory?: SharedArrayBuffer;
}
interface PROCESS_CRASH {
    uExitCode: number;
    error: Error | string;
}
interface LOAD_LIBRARY {
    lpLibFileName: string;
}
interface LOAD_LIBRARY_REPLY {
    retVal: HANDLE;
    lpszLibFile: string;
}

export { CALLBACK_MESSAGE_TYPE, type HANDLE$1 as HANDLE, type LOAD_LIBRARY, type LOAD_LIBRARY_REPLY, type LOAD_SUBSYSTEM, type PROCESS_CRASH, type PROCESS_CREATE, type PROCESS_EXIT, type SUBSYSTEM_LOADED, NTDLL as default };
//# sourceMappingURL=ntdll.int.d.ts.map
