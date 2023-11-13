import Message from "../types/Message.js";
import KERNEL32 from "../types/kernel32.types.js";
import { SUBSYS_KERNEL32 } from "../types/subsystems.js";
import { HANDLE } from "../types/types.js";
import { NtRegisterSubsystem } from "./ntdll.js";

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

const [Kernel32_SendMessage, Kernel32_PostMessage] = await NtRegisterSubsystem(SUBSYS_KERNEL32, Kernel32_HandleMessage);

export function GetCurrentProcess(): HANDLE {
    return -1;
}

export async function GetProcessId(hProcess: HANDLE): Promise<number> {
    const msg = await Kernel32_SendMessage({
        type: KERNEL32.GetProcessInfo,
        data: {
            hProcess: hProcess
        }
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
    const msg = await Kernel32_SendMessage({
        type: KERNEL32.CreateFile,
        data: {
            lpFileName: lpFileName,
            dwDesiredAccess: dwDesiredAccess,
            dwShareMode: dwShareMode,
            lpSecurityAttributes: lpSecurityAttributes,
            dwCreationDisposition: dwCreationDisposition,
            dwFlagsAndAttributes: dwFlagsAndAttributes,
            hTemplateFile: hTemplateFile
        }
    });

    return msg.data.hFile;
}

export async function ReadFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToRead: number,
): Promise<{ retVal: boolean, lpNumberOfBytesRead: number }> {
    const msg = await Kernel32_SendMessage({
        type: KERNEL32.ReadFile,
        data: {
            hFile: hFile,
            lpBuffer: lpBuffer,
            nNumberOfBytesToRead: nNumberOfBytesToRead,
        }
    });

    if (msg.data.retVal) {
        lpBuffer.set(msg.data.lpBuffer);        
    }

    return { retVal: msg.data.retVal, lpNumberOfBytesRead: msg.data.nNumberOfBytesRead };
}

export async function WriteFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToWrite: number,
): Promise<{ retVal: boolean, lpNumberOfBytesWritten: number }> {
    const msg = await Kernel32_SendMessage({
        type: KERNEL32.WriteFile,
        data: {
            hFile: hFile,
            lpBuffer: lpBuffer,
            nNumberOfBytesToWrite: nNumberOfBytesToWrite,
        }
    });

    return { retVal: msg.data.bSuccess, lpNumberOfBytesWritten: msg.data.nNumberOfBytesWritten };
}

export async function SetFilePointer(
    hFile: HANDLE,
    lDistanceToMove: number,
    dwMoveMethod: number,
): Promise<number> {
    const msg = await Kernel32_SendMessage({
        type: KERNEL32.SetFilePointer,
        data: {
            hFile: hFile,
            lDistanceToMove: lDistanceToMove,
            dwMoveMethod: dwMoveMethod,
        }
    });

    return msg.data.dwNewFilePointer;
}


export function GetStdHandle(nStdHandle: number): HANDLE {
    if (nStdHandle > STD_ERROR_HANDLE && nStdHandle < STD_INPUT_HANDLE)
        return -1; // TODO: implement
    else
        return -1;
}


export function CloseHandle(hObject: HANDLE): boolean {
    Kernel32_PostMessage({
        type: KERNEL32.CloseHandle,
        data: {
            hObject: hObject
        }
    });

    return true;
}

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

export function OutputDebugString(lpOutputString: string): void {
    console.debug(lpOutputString);
}