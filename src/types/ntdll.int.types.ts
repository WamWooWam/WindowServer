import Executable from "./Executable.js";
import { HANDLE } from "./types.js";

export interface PROCESS_CREATE {
    hProcess: HANDLE;
    lpExecutable: Executable;
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