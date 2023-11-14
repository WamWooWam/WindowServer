import { HANDLE } from "./types.js";

const KERNEL32 = {
    GetProcessInfo: 0x00000001,
    CloseHandle: 0x00000002,
    CreateFile: 0x00000003,
    ReadFile: 0x00000004,
    WriteFile: 0x00000005,
    SetFilePointer: 0x00000006,
    CreateDirectory: 0x00000007,
    GetModuleHandle: 0x00000008
}

export interface GET_PROCESS_INFO {
    hProcess: HANDLE;
}

export interface GET_PROCESS_INFO_REPLY {
    id: number;
}

export interface GET_MODULE_HANDLE {
    lpModuleName: string;
}

export interface GET_MODULE_HANDLE_REPLY {
    hModule: HANDLE;
}

export interface CREATE_FILE {
    lpFileName: string;
    dwDesiredAccess: number;
    dwShareMode: number;
    lpSecurityAttributes: number;
    dwCreationDisposition: number;
    dwFlagsAndAttributes: number;
    hTemplateFile: HANDLE;
}

export interface CREATE_FILE_REPLY {
    hFile: HANDLE;
}

export interface READ_FILE {
    hFile: HANDLE;
    lpBuffer: Uint8Array;
    nNumberOfBytesToRead: number;
}

export interface READ_FILE_REPLY {
    retVal: boolean;
    lpNumberOfBytesRead: number;
    lpBuffer?: Uint8Array;
}

export interface WRITE_FILE {
    hFile: HANDLE;
    lpBuffer: Uint8Array;
    nNumberOfBytesToWrite: number;
}

export interface WRITE_FILE_REPLY {
    retVal: boolean;
    lpNumberOfBytesWritten: number;
}

export interface SET_FILE_POINTER {
    hFile: HANDLE;
    lDistanceToMove: number;
    dwMoveMethod: number;
}

export interface SET_FILE_POINTER_REPLY {
    dwNewFilePointer: number;
}

export interface CREATE_DIRECTORY {
    lpPathName: string;
    lpSecurityAttributes: number;
}

export interface CREATE_DIRECTORY_REPLY {
    retVal: boolean;
}

export interface CLOSE_HANDLE {
    hObject: HANDLE;
}

export default KERNEL32;