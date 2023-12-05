/**
 * @module kernel32
 * @description Windows NT BASE API Client Library
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/winbase/}
 * @usermode
 */

import { CLOSE_HANDLE, CREATE_DIRECTORY, CREATE_DIRECTORY_REPLY, CREATE_FILE, CREATE_FILE_REPLY, GET_MODULE_HANDLE, GET_MODULE_HANDLE_REPLY, GET_PROCESS_INFO, GET_PROCESS_INFO_REPLY, READ_FILE, READ_FILE_REPLY, SET_FILE_POINTER, SET_FILE_POINTER_REPLY, WRITE_FILE, WRITE_FILE_REPLY } from "../types/kernel32.int.types.js";
import KERNEL32, { IDX_LAST_ERROR, IDX_PID, STD_ERROR_HANDLE, STD_INPUT_HANDLE, } from "../types/kernel32.types.js";

import Executable from "../types/Executable.js";
import { HANDLE } from "../types/types.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_KERNEL32 } from "../types/subsystems.js";

export * from "../types/kernel32.types.js";

function Kernel32_HandleMessage(msg: Message) {

}

const Kernel32 = await NtRegisterSubsystem(SUBSYS_KERNEL32, Kernel32_HandleMessage, 4096);
const K32Memory = new Uint32Array(Kernel32.memory!);

/**
 * Retrieves a module handle for the specified module. The module must have been loaded by the calling process.
 * @param lpModuleName The name of the loaded module (either a .dll or .exe file). If the file name extension is omitted,
 * the default library extension .dll is appended. The file name string can include a trailing point character (.) to 
 * indicate that the module name has no extension. The string does not have to specify a path. When specifying a path, be 
 * sure to use backslashes (\), not forward slashes (/). The name is compared (case independently) to the names of modules
 * currently mapped into the address space of the calling process.
 * @returns If the function succeeds, the return value is a handle to the specified module. If the function fails, the
 * return value is NULL. To get extended error information, call GetLastError.
 */
export async function GetModuleHandle(lpModuleName: string | null): Promise<HANDLE> {
    const msg = await Kernel32.SendMessage<GET_MODULE_HANDLE, GET_MODULE_HANDLE_REPLY>({
        nType: KERNEL32.GetModuleHandle,
        data: { lpModuleName }
    });

    return msg.data.hModule;
}

/**
 * Retrieves a pseudo handle for the current process.
 * @returns The return value is a pseudo handle to the current process.
 */
export function GetCurrentProcess(): HANDLE {
    return -1;
}

/**
 * Retrieves the calling thread's last-error code value. The last-error code is maintained on a per-thread basis. Multiple 
 * threads do not overwrite each other's last-error code.
 * @returns The return value is the calling thread's last-error code. 
 */
export function GetLastError(): number {
    const lastError = Atomics.load(K32Memory, IDX_LAST_ERROR);
    return lastError;
}

/**
 * Sets the last-error code for the calling thread.
 * @param dwErrorCode The last-error code for the thread.
 */
export function SetLastError(dwErrorCode: number): void {
    console.debug(`SetLastError pid:${GetCurrentProcessId()} ${dwErrorCode}`);
    Atomics.store(K32Memory, IDX_LAST_ERROR, dwErrorCode);
}

/**
 * Retrieves the process identifier of the calling process.
 * @returns The return value is the process identifier of the calling process.
 */
function GetCurrentProcessId(): number {
    return Atomics.load(K32Memory, IDX_PID);
}

/**
 * Retrieves the process identifier of the specified process.
 * @param hProcess A handle to the process. The handle must have the PROCESS_QUERY_INFORMATION or PROCESS_QUERY_LIMITED_INFORMATION access right.
 * @returns If the function succeeds, the return value is a process identifier. If the function fails, the return value is zero.
 */
export async function GetProcessId(hProcess: HANDLE): Promise<number> {
    if (hProcess === -1) return GetCurrentProcessId();

    const msg = await Kernel32.SendMessage<GET_PROCESS_INFO, GET_PROCESS_INFO_REPLY>({
        nType: KERNEL32.GetProcessInfo,
        data: { hProcess }
    });

    return msg.data.id;
}

/**
 * Creates or opens a file or I/O device. The most commonly used I/O devices are as follows: file, file stream, directory, physical disk, volume,
 * console buffer, tape drive, communications resource, mailslot, and pipe. The function returns a handle that can be used to access the file or 
 * device for various types of I/O depending on the file or device and the flags and attributes specified.
 * @param lpFileName The name of the file or device to be created or opened. You may use either forward slashes (/) or backslashes (\) in this name.
 * @param dwDesiredAccess The requested access to the file or device, which can be summarized as read, write, both or neither zero).
 * @param dwShareMode The requested sharing mode of the file or device, which can be read, write, both, delete, all of these, or none (refer to the
 * following table). Access requests to attributes or extended attributes are not affected by this flag.
 * @param lpSecurityAttributes A pointer to a SECURITY_ATTRIBUTES structure that contains two separate but related data members: an optional security
 * descriptor, and a Boolean value that determines whether the returned handle can be inherited by child processes. This parameter can be NULL.
 * @param dwCreationDisposition An action to take on a file or device that exists or does not exist.
 * @param dwFlagsAndAttributes The file or device attributes and flags, FILE_ATTRIBUTE_NORMAL being the most common default value for files.
 * @param hTemplateFile A valid handle to a template file with the GENERIC_READ access right. The template file supplies file attributes and extended
 * attributes for the file that is being created. This parameter can be NULL.
 * @returns If the function succeeds, the return value is an open handle to the specified file, device, named pipe, or mail slot. If the function fails,
 * the return value is INVALID_HANDLE_VALUE. To get extended error information, call GetLastError.
 * @async
 * @category Kernel32
 * @example
 * ```ts
 * const hFile = await CreateFile("test.txt", GENERIC_READ, 0, 0, OPEN_EXISTING, 0, 0);
 * CloseHandle(hFile);
 * ```
 */
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

/**
 * Reads data from the specified file or input/output (I/O) device. Reads occur at the position specified by the file pointer if supported by the device.
 * @param hFile A handle to the device (for example, a file, file stream, physical disk, volume, console buffer, tape drive, socket, communications resource,
 * mailslot, or pipe).
 * @param lpBuffer A pointer to the buffer that receives the data read from a file or device.
 * @param nNumberOfBytesToRead The maximum number of bytes to be read.
 * @returns If the function succeeds, the return value is nonzero (TRUE). If the function fails, or is completing asynchronously, the return value is zero
 * (FALSE). To get extended error information, call the GetLastError function.
 * @async
 * @category Kernel32
 * @example
 * ```ts
 * const hFile = await CreateFile("test.txt", GENERIC_READ, 0, 0, OPEN_EXISTING, 0, 0);
 * const buffer = new Uint8Array(1024);
 * const { retVal, lpNumberOfBytesRead } = await ReadFile(hFile, buffer, buffer.length);
 * CloseHandle(hFile);
 * ```
 * @see https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile
 */
export async function ReadFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToRead: number,
): Promise<{ retVal: boolean, lpNumberOfBytesRead: number }> {
    const msg = await Kernel32.SendMessage<READ_FILE, READ_FILE_REPLY>({
        nType: KERNEL32.ReadFile,
        data: { hFile, lpBuffer, nNumberOfBytesToRead }
    });

    if (msg.data.retVal && msg.data.lpBuffer) {
        lpBuffer.set(msg.data.lpBuffer);
    }

    return { retVal: msg.data.retVal, lpNumberOfBytesRead: msg.data.lpNumberOfBytesRead };
}

/**
 * Writes data to the specified file or input/output (I/O) device.
 * @param hFile A handle to the device (for example, a file, file stream, physical disk, volume, console buffer, tape drive, socket, communications resource,
 * mailslot, or pipe).
 * @param lpBuffer A pointer to the buffer containing the data to be written to the file or device.
 * @param nNumberOfBytesToWrite The number of bytes to be written to the file or device.
 * @returns If the function succeeds, the return value is nonzero (TRUE). If the function fails, or is completing asynchronously, the return value is zero
 * (FALSE). To get extended error information, call the GetLastError function.
 * @async
 * @category Kernel32
 * @example
 * ```ts
 * const hFile = await CreateFile("test.txt", GENERIC_WRITE, 0, 0, CREATE_ALWAYS, 0, 0);
 * const buffer = new TextEncoder().encode("Hello World!");
 * const { retVal, lpNumberOfBytesWritten } = await WriteFile(hFile, buffer, buffer.length);
 * CloseHandle(hFile);
 * ```
 * @see https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile
 */
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

/**
 * Moves the file pointer of the specified file.
 * @param hFile A handle to the file.
 * The file handle must have been created with GENERIC_READ or GENERIC_WRITE access to the file.
 * @param lDistanceToMove The value that is added to the location specified by the dwMoveMethod parameter.
 * @param dwMoveMethod The starting point for the file pointer move.
 * @returns The return value is the new value of the file pointer, from the beginning of the file.
 * @async
 * @category Kernel32
 * @example
 * ```ts
 * const hFile = await CreateFile("test.txt", GENERIC_READ, 0, 0, OPEN_EXISTING, 0, 0);
 * const retVal = await SetFilePointer(hFile, 0, FILE_END);
 * CloseHandle(hFile);
 * ```
 */
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

/**
 * Creates a new directory. If the underlying file system supports security on files and directories, the function applies a specified security descriptor
 * to the new directory.
 * @param lpPathName The path of the directory to be created. For more information, see File Names, Paths, and Namespaces.
 * @param lpSecurityAttributes A pointer to a SECURITY_ATTRIBUTES structure. The lpSecurityDescriptor member of the structure specifies a security descriptor
 * for the new directory. If lpSecurityAttributes is NULL, the directory gets a default security descriptor. The ACLs in the default security descriptor for a
 * directory are inherited from its parent directory.
 * @returns If the function succeeds, the return value is nonzero (TRUE). If the function fails, the return value is zero (FALSE). To get extended error
 */
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

/**
 * 
 * @param nStdHandle 
 * @returns 
 */
export function GetStdHandle(nStdHandle: number): HANDLE {
    if (nStdHandle > STD_ERROR_HANDLE && nStdHandle < STD_INPUT_HANDLE)
        return -1; // TODO: implement
    else
        return -1;
}

/**
 * 
 * @param hObject 
 * @returns 
 */
export function CloseHandle(hObject: HANDLE): boolean {
    Kernel32.PostMessage<CLOSE_HANDLE>({
        nType: KERNEL32.CloseHandle,
        data: { hObject }
    });

    return true;
}

// consoleapi.h

/**
 * 
 * @returns 
 */
export async function AllocConsole(): Promise<boolean> {
    return false; // TODO: implement
}

/**
 * 
 * @param hConsoleOutput 
 * @param lpBuffer 
 * @returns 
 */
export async function WriteConsole(hConsoleOutput: HANDLE, lpBuffer: string): Promise<boolean> {
    return WriteFile(hConsoleOutput, new TextEncoder().encode(lpBuffer), lpBuffer.length)
        .then((ret) => ret.retVal);
}

/**
 * 
 * @param hConsoleInput 
 * @param nNumberOfCharsToRead 
 * @returns 
 */
export async function ReadConsole(hConsoleInput: HANDLE, nNumberOfCharsToRead: number): Promise<string> {
    const buffer = new Uint8Array(nNumberOfCharsToRead);
    const ret = await ReadFile(hConsoleInput, buffer, buffer.length);
    return new TextDecoder().decode(buffer.slice(0, ret.lpNumberOfBytesRead));
}

/**
 * 
 * @returns 
 */
export async function GetConsoleTitle(): Promise<string> {
    return "";
}

/**
 * 
 * @param lpConsoleTitle 
 * @returns 
 */
export async function SetConsoleTitle(lpConsoleTitle: string): Promise<boolean> {
    return false;
}

// debugapi.h

/**
 * 
 * @param lpOutputString 
 */
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