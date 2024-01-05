export * from "./ntdll.types.js";

import Executable from "@window-server/sdk/types/Executable.js";
import { HANDLE } from "@window-server/sdk/types/types.js";

const NTDLL = {
    ProcessCreate: 0x00000001,
    LoadSubsystem: 0x00000002,
    ProcessExit: 0x00000003,
    ProcessCrash: 0x00000004,
    LoadLibrary: 0x00000005,
}
export default NTDLL;

export interface PROCESS_CREATE {
    hProcess: HANDLE;
    lpExecutable: string;
    lpCommandLine: string;
    lpCurrentDirectory: string;
    lpEnvironment: { [key: string]: string };
    lpSharedMemory: SharedArrayBuffer;
}

export interface PROCESS_EXIT {
    uExitCode: number;
}

export interface LOAD_SUBSYSTEM {
    lpSubsystem: string;
    cbSharedMemory: number;
}

export interface SUBSYSTEM_LOADED {
    lpSharedMemory?: SharedArrayBuffer;
}

export interface PROCESS_CRASH {
    uExitCode: number;
    error: Error | string;
}

export interface LOAD_LIBRARY {
    lpLibFileName: string;
}

export interface LOAD_LIBRARY_REPLY {
    retVal: HANDLE;
    lpExecInfo: Executable;
    lpszLibFile: string; // a data URI to the library file
}