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

declare const IDX_PID = 0;
declare const IDX_HMODULE = 1;
declare const IDX_LAST_ERROR = 2;
declare const STD_INPUT_HANDLE = -10;
declare const STD_OUTPUT_HANDLE = -11;
declare const STD_ERROR_HANDLE = -12;
declare const GENERIC_ALL = 268435456;
declare const GENERIC_EXECUTE = 536870912;
declare const GENERIC_WRITE = 1073741824;
declare const GENERIC_READ = 2147483648;
declare const CREATE_NEW = 1;
declare const CREATE_ALWAYS = 2;
declare const OPEN_EXISTING = 3;
declare const OPEN_ALWAYS = 4;
declare const TRUNCATE_EXISTING = 5;
declare const FILE_ATTRIBUTE_READONLY = 1;
declare const FILE_ATTRIBUTE_HIDDEN = 2;
declare const FILE_ATTRIBUTE_SYSTEM = 4;
declare const FILE_ATTRIBUTE_DIRECTORY = 16;
declare const FILE_ATTRIBUTE_ARCHIVE = 32;
declare const FILE_ATTRIBUTE_DEVICE = 64;
declare const FILE_ATTRIBUTE_NORMAL = 128;
declare const FILE_ATTRIBUTE_TEMPORARY = 256;
declare const FILE_FLAG_WRITE_THROUGH = 2147483648;
declare const FILE_FLAG_OVERLAPPED = 1073741824;
declare const FILE_FLAG_NO_BUFFERING = 536870912;
declare const FILE_FLAG_RANDOM_ACCESS = 268435456;
declare const FILE_FLAG_DELETE_ON_CLOSE = 67108864;
declare const FILE_SHARE_READ = 1;
declare const FILE_SHARE_WRITE = 2;
declare const FILE_SHARE_DELETE = 4;
declare const FILE_SHARE_VALID_FLAGS = 7;
declare const FILE_BEGIN = 0;
declare const FILE_CURRENT = 1;
declare const FILE_END = 2;
declare const FILE_GENERIC_READ = 2147483648;
declare const FILE_GENERIC_WRITE = 1073741824;
declare const FILE_GENERIC_EXECUTE = 536870912;

/**
 * @module kernel32
 * @description Windows NT BASE API Client Library
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/winbase/}
 * @usermode
 */

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
declare function GetModuleHandle(lpModuleName: string | null): Promise<HANDLE>;
/**
 * Retrieves a pseudo handle for the current process.
 * @returns The return value is a pseudo handle to the current process.
 */
declare function GetCurrentProcess(): HANDLE;
/**
 * Retrieves the calling thread's last-error code value. The last-error code is maintained on a per-thread basis. Multiple
 * threads do not overwrite each other's last-error code.
 * @returns The return value is the calling thread's last-error code.
 */
declare function GetLastError(): number;
/**
 * Sets the last-error code for the calling thread.
 * @param dwErrorCode The last-error code for the thread.
 */
declare function SetLastError(dwErrorCode: number): void;
/**
 * Retrieves the process identifier of the specified process.
 * @param hProcess A handle to the process. The handle must have the PROCESS_QUERY_INFORMATION or PROCESS_QUERY_LIMITED_INFORMATION access right.
 * @returns If the function succeeds, the return value is a process identifier. If the function fails, the return value is zero.
 */
declare function GetProcessId(hProcess: HANDLE): Promise<number>;
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
declare function CreateFile(lpFileName: string, dwDesiredAccess: number, dwShareMode: number, lpSecurityAttributes: number, dwCreationDisposition: number, dwFlagsAndAttributes: number, hTemplateFile: HANDLE): Promise<HANDLE>;
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
declare function ReadFile(hFile: HANDLE, lpBuffer: Uint8Array, nNumberOfBytesToRead: number): Promise<{
    retVal: boolean;
    lpNumberOfBytesRead: number;
}>;
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
declare function WriteFile(hFile: HANDLE, lpBuffer: Uint8Array, nNumberOfBytesToWrite: number): Promise<{
    retVal: boolean;
    lpNumberOfBytesWritten: number;
}>;
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
declare function SetFilePointer(hFile: HANDLE, lDistanceToMove: number, dwMoveMethod: number): Promise<number>;
/**
 * Creates a new directory. If the underlying file system supports security on files and directories, the function applies a specified security descriptor
 * to the new directory.
 * @param lpPathName The path of the directory to be created. For more information, see File Names, Paths, and Namespaces.
 * @param lpSecurityAttributes A pointer to a SECURITY_ATTRIBUTES structure. The lpSecurityDescriptor member of the structure specifies a security descriptor
 * for the new directory. If lpSecurityAttributes is NULL, the directory gets a default security descriptor. The ACLs in the default security descriptor for a
 * directory are inherited from its parent directory.
 * @returns If the function succeeds, the return value is nonzero (TRUE). If the function fails, the return value is zero (FALSE). To get extended error
 */
declare function CreateDirectory(lpPathName: string, lpSecurityAttributes: number): Promise<boolean>;
/**
 *
 * @param nStdHandle
 * @returns
 */
declare function GetStdHandle(nStdHandle: number): HANDLE;
/**
 *
 * @param hObject
 * @returns
 */
declare function CloseHandle(hObject: HANDLE): boolean;
/**
 *
 * @returns
 */
declare function AllocConsole(): Promise<boolean>;
/**
 *
 * @param hConsoleOutput
 * @param lpBuffer
 * @returns
 */
declare function WriteConsole(hConsoleOutput: HANDLE, lpBuffer: string): Promise<boolean>;
/**
 *
 * @param hConsoleInput
 * @param nNumberOfCharsToRead
 * @returns
 */
declare function ReadConsole(hConsoleInput: HANDLE, nNumberOfCharsToRead: number): Promise<string>;
/**
 *
 * @returns
 */
declare function GetConsoleTitle(): Promise<string>;
/**
 *
 * @param lpConsoleTitle
 * @returns
 */
declare function SetConsoleTitle(lpConsoleTitle: string): Promise<boolean>;
/**
 *
 * @param lpOutputString
 */
declare function OutputDebugString(lpOutputString: string): void;
declare function MulDiv(nNumber: number, nNumerator: number, nDenominator: number): number;
declare function Kernel32Initialize(): Promise<void>;
declare const kernel32: Executable;

export { AllocConsole, CREATE_ALWAYS, CREATE_NEW, CloseHandle, CreateDirectory, CreateFile, FILE_ATTRIBUTE_ARCHIVE, FILE_ATTRIBUTE_DEVICE, FILE_ATTRIBUTE_DIRECTORY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_NORMAL, FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_TEMPORARY, FILE_BEGIN, FILE_CURRENT, FILE_END, FILE_FLAG_DELETE_ON_CLOSE, FILE_FLAG_NO_BUFFERING, FILE_FLAG_OVERLAPPED, FILE_FLAG_RANDOM_ACCESS, FILE_FLAG_WRITE_THROUGH, FILE_GENERIC_EXECUTE, FILE_GENERIC_READ, FILE_GENERIC_WRITE, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_VALID_FLAGS, FILE_SHARE_WRITE, GENERIC_ALL, GENERIC_EXECUTE, GENERIC_READ, GENERIC_WRITE, GetConsoleTitle, GetCurrentProcess, GetLastError, GetModuleHandle, GetProcessId, GetStdHandle, IDX_HMODULE, IDX_LAST_ERROR, IDX_PID, Kernel32Initialize, MulDiv, OPEN_ALWAYS, OPEN_EXISTING, OutputDebugString, ReadConsole, ReadFile, STD_ERROR_HANDLE, STD_INPUT_HANDLE, STD_OUTPUT_HANDLE, SetConsoleTitle, SetFilePointer, SetLastError, TRUNCATE_EXISTING, WriteConsole, WriteFile, kernel32 as default };
//# sourceMappingURL=kernel32.d.ts.map
