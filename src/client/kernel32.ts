import KERNEL32, {
    CLOSE_HANDLE,
    CREATE_DIRECTORY,
    CREATE_DIRECTORY_REPLY,
    CREATE_FILE,
    CREATE_FILE_REPLY,
    GET_MODULE_HANDLE,
    GET_MODULE_HANDLE_REPLY,
    GET_PROCESS_INFO,
    GET_PROCESS_INFO_REPLY,
    IDX_LAST_ERROR,
    IDX_PID,
    READ_FILE,
    READ_FILE_REPLY,
    SET_FILE_POINTER,
    SET_FILE_POINTER_REPLY,
    WRITE_FILE,
    WRITE_FILE_REPLY
} from "../types/kernel32.types.js";

import Executable from "../types/Executable.js";
import { HANDLE } from "../types/types.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_KERNEL32 } from "../types/subsystems.js";

export const STD_INPUT_HANDLE = -10;
export const STD_OUTPUT_HANDLE = -11;
export const STD_ERROR_HANDLE = -12;

export const GENERIC_ALL = 0x10000000;
export const GENERIC_EXECUTE = 0x20000000;
export const GENERIC_WRITE = 0x40000000;
export const GENERIC_READ = 0x80000000;

export const CREATE_NEW = 1;
export const CREATE_ALWAYS = 2;
export const OPEN_EXISTING = 3;
export const OPEN_ALWAYS = 4;
export const TRUNCATE_EXISTING = 5;

export const FILE_ATTRIBUTE_READONLY = 0x00000001;
export const FILE_ATTRIBUTE_HIDDEN = 0x00000002;
export const FILE_ATTRIBUTE_SYSTEM = 0x00000004;
export const FILE_ATTRIBUTE_DIRECTORY = 0x00000010;
export const FILE_ATTRIBUTE_ARCHIVE = 0x00000020;
export const FILE_ATTRIBUTE_DEVICE = 0x00000040;
export const FILE_ATTRIBUTE_NORMAL = 0x00000080;
export const FILE_ATTRIBUTE_TEMPORARY = 0x00000100;

export const FILE_FLAG_WRITE_THROUGH = 0x80000000;
export const FILE_FLAG_OVERLAPPED = 0x40000000;
export const FILE_FLAG_NO_BUFFERING = 0x20000000;
export const FILE_FLAG_RANDOM_ACCESS = 0x10000000;
export const FILE_FLAG_DELETE_ON_CLOSE = 0x04000000;

export const FILE_SHARE_READ = 0x00000001;
export const FILE_SHARE_WRITE = 0x00000002;
export const FILE_SHARE_DELETE = 0x00000004;
export const FILE_SHARE_VALID_FLAGS = 0x00000007;

export const FILE_BEGIN = 0;
export const FILE_CURRENT = 1;
export const FILE_END = 2;

export const FILE_GENERIC_READ = 0x80000000;
export const FILE_GENERIC_WRITE = 0x40000000;
export const FILE_GENERIC_EXECUTE = 0x20000000;

function Kernel32_HandleMessage(msg: Message) {

}

const Kernel32 = await NtRegisterSubsystem(SUBSYS_KERNEL32, Kernel32_HandleMessage, 4096);
const K32Memory = new Uint32Array(Kernel32.memory);

export async function GetModuleHandle(lpModuleName: string): Promise<HANDLE> {
    const msg = await Kernel32.SendMessage<GET_MODULE_HANDLE, GET_MODULE_HANDLE_REPLY>({
        nType: KERNEL32.GetModuleHandle,
        data: { lpModuleName }
    });

    return msg.data.hModule;
}

export function GetCurrentProcess(): HANDLE {
    return -1;
}

export function GetLastError(): number {
    const lastError = Atomics.load(K32Memory, IDX_LAST_ERROR);
    return lastError;
}

export function SetLastError(dwErrorCode: number): void {
    console.debug(`SetLastError pid:${GetCurrentProcessId()} ${dwErrorCode}`);
    Atomics.store(K32Memory, IDX_LAST_ERROR, dwErrorCode);
}

function GetCurrentProcessId(): number {
    return Atomics.load(K32Memory, IDX_PID);
}

export async function GetProcessId(hProcess: HANDLE): Promise<number> {
    if(hProcess === -1) return GetCurrentProcessId();

    const msg = await Kernel32.SendMessage<GET_PROCESS_INFO, GET_PROCESS_INFO_REPLY>({
        nType: KERNEL32.GetProcessInfo,
        data: { hProcess }
    });

    return msg.data.id;
}

export async function CreateFile(
    lpFileName: string,
    dwDesiredAccess: number,
    dwShareMode: number,
    lpSecurityAttributes: number,
    dwCreationDisposition: number,
    dwFlagsAndAttributes: number,
    hTemplateFile: HANDLE
): Promise<HANDLE> {
    const msg = await Kernel32.SendMessage<CREATE_FILE, CREATE_FILE_REPLY>({
        nType: KERNEL32.CreateFile,
        data: {
            lpFileName,
            dwDesiredAccess,
            dwShareMode,
            lpSecurityAttributes,
            dwCreationDisposition,
            dwFlagsAndAttributes,
            hTemplateFile
        }
    });

    return msg.data.hFile;
}

export async function ReadFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToRead: number,
): Promise<{ retVal: boolean, lpNumberOfBytesRead: number }> {
    const msg = await Kernel32.SendMessage<READ_FILE, READ_FILE_REPLY>({
        nType: KERNEL32.ReadFile,
        data: { hFile, lpBuffer, nNumberOfBytesToRead }
    });

    if (msg.data.retVal) {
        lpBuffer.set(msg.data.lpBuffer);
    }

    return { retVal: msg.data.retVal, lpNumberOfBytesRead: msg.data.lpNumberOfBytesRead };
}

export async function WriteFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToWrite: number,
): Promise<{ retVal: boolean, lpNumberOfBytesWritten: number }> {
    const msg = await Kernel32.SendMessage<WRITE_FILE, WRITE_FILE_REPLY>({
        nType: KERNEL32.WriteFile,
        data: { hFile, lpBuffer, nNumberOfBytesToWrite }
    });

    return { retVal: msg.data.retVal, lpNumberOfBytesWritten: msg.data.lpNumberOfBytesWritten };
}

export async function SetFilePointer(
    hFile: HANDLE,
    lDistanceToMove: number,
    dwMoveMethod: number,
): Promise<number> {
    const msg = await Kernel32.SendMessage<SET_FILE_POINTER, SET_FILE_POINTER_REPLY>({
        nType: KERNEL32.SetFilePointer,
        data: { hFile, lDistanceToMove, dwMoveMethod }
    });

    return msg.data.dwNewFilePointer;
}

export async function CreateDirectory(
    lpPathName: string,
    lpSecurityAttributes: number
): Promise<boolean> {
    const msg = await Kernel32.SendMessage<CREATE_DIRECTORY, CREATE_DIRECTORY_REPLY>({
        nType: KERNEL32.CreateDirectory,
        data: { lpPathName, lpSecurityAttributes }
    });

    return msg.data.retVal;
}


export function GetStdHandle(nStdHandle: number): HANDLE {
    if (nStdHandle > STD_ERROR_HANDLE && nStdHandle < STD_INPUT_HANDLE)
        return -1; // TODO: implement
    else
        return -1;
}


export function CloseHandle(hObject: HANDLE): boolean {
    Kernel32.PostMessage<CLOSE_HANDLE>({
        nType: KERNEL32.CloseHandle,
        data: { hObject }
    });

    return true;
}

// consoleapi.h

export async function AllocConsole(): Promise<boolean> {
    return false; // TODO: implement
}

export async function WriteConsole(hConsoleOutput: HANDLE, lpBuffer: string): Promise<boolean> {
    return WriteFile(hConsoleOutput, new TextEncoder().encode(lpBuffer), lpBuffer.length)
        .then((ret) => ret.retVal);
}

export async function ReadConsole(hConsoleInput: HANDLE, nNumberOfCharsToRead: number): Promise<string> {
    const buffer = new Uint8Array(nNumberOfCharsToRead);
    const ret = await ReadFile(hConsoleInput, buffer, buffer.length);
    return new TextDecoder().decode(buffer.slice(0, ret.lpNumberOfBytesRead));
}

export async function GetConsoleTitle(): Promise<string> {
    return "";
}

export async function SetConsoleTitle(lpConsoleTitle: string): Promise<boolean> {
    return false;
}

// debugapi.h

export function OutputDebugString(lpOutputString: string): void {
    console.debug(lpOutputString);
}

const kernel32: Executable = {
    file: "kernel32.js",
    type: "dll",
    subsystem: "console",
    arch: "js",
    entryPoint: null,
    dependencies: ["ntdll.js"],

    name: "kernel32",
    version: [1, 0, 0, 0],
    rsrc: {}
}

export default kernel32;