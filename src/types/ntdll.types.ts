import { HANDLE, PEB } from "./types.js";

import Executable from "./Executable.js";

const NTDLL = {
    ProcessCreate: 0x00000001,
    LoadSubsystem: 0x00000002,
    ProcessExit: 0x00000003,
}

export interface PROCESS_CREATE {
    hProcess: HANDLE;
    lpExecutable: Executable;
    lpCommandLine: string;
    lpCurrentDirectory: string;
    lpEnvironment: { [key: string]: string };
    lpSharedMemory: SharedArrayBuffer;
}

export interface PROCESS_EXIT {
    hProcess: HANDLE;
    uExitCode: number;
}

export interface LOAD_SUBSYSTEM {
    lpSubsystem: string;
}

export default NTDLL;
