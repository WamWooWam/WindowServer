type HANDLE = number;//# sourceMappingURL=types.d.ts.map

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

interface GET_PROCESS_INFO {
    hProcess: HANDLE;
}
interface GET_PROCESS_INFO_REPLY {
    id: number;
}
interface GET_MODULE_HANDLE {
    lpModuleName: string | null;
}
interface GET_MODULE_HANDLE_REPLY {
    hModule: HANDLE;
}
interface CREATE_FILE {
    lpFileName: string;
    dwDesiredAccess: number;
    dwShareMode: number;
    lpSecurityAttributes: number;
    dwCreationDisposition: number;
    dwFlagsAndAttributes: number;
    hTemplateFile: HANDLE;
}
interface CREATE_FILE_REPLY {
    hFile: HANDLE;
}
interface READ_FILE {
    hFile: HANDLE;
    lpBuffer: Uint8Array;
    nNumberOfBytesToRead: number;
}
interface READ_FILE_REPLY {
    retVal: boolean;
    lpNumberOfBytesRead: number;
    lpBuffer?: Uint8Array;
}
interface WRITE_FILE {
    hFile: HANDLE;
    lpBuffer: Uint8Array;
    nNumberOfBytesToWrite: number;
}
interface WRITE_FILE_REPLY {
    retVal: boolean;
    lpNumberOfBytesWritten: number;
}
interface SET_FILE_POINTER {
    hFile: HANDLE;
    lDistanceToMove: number;
    dwMoveMethod: number;
}
interface SET_FILE_POINTER_REPLY {
    dwNewFilePointer: number;
}
interface CREATE_DIRECTORY {
    lpPathName: string;
    lpSecurityAttributes: number;
}
interface CREATE_DIRECTORY_REPLY {
    retVal: boolean;
}
interface CLOSE_HANDLE {
    hObject: HANDLE;
}
declare const KERNEL32: {
    GetProcessInfo: number;
    CloseHandle: number;
    CreateFile: number;
    ReadFile: number;
    WriteFile: number;
    SetFilePointer: number;
    CreateDirectory: number;
    GetModuleHandle: number;
};

export { type CLOSE_HANDLE, CREATE_ALWAYS, type CREATE_DIRECTORY, type CREATE_DIRECTORY_REPLY, type CREATE_FILE, type CREATE_FILE_REPLY, CREATE_NEW, FILE_ATTRIBUTE_ARCHIVE, FILE_ATTRIBUTE_DEVICE, FILE_ATTRIBUTE_DIRECTORY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_NORMAL, FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_TEMPORARY, FILE_BEGIN, FILE_CURRENT, FILE_END, FILE_FLAG_DELETE_ON_CLOSE, FILE_FLAG_NO_BUFFERING, FILE_FLAG_OVERLAPPED, FILE_FLAG_RANDOM_ACCESS, FILE_FLAG_WRITE_THROUGH, FILE_GENERIC_EXECUTE, FILE_GENERIC_READ, FILE_GENERIC_WRITE, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_VALID_FLAGS, FILE_SHARE_WRITE, GENERIC_ALL, GENERIC_EXECUTE, GENERIC_READ, GENERIC_WRITE, type GET_MODULE_HANDLE, type GET_MODULE_HANDLE_REPLY, type GET_PROCESS_INFO, type GET_PROCESS_INFO_REPLY, IDX_HMODULE, IDX_LAST_ERROR, IDX_PID, OPEN_ALWAYS, OPEN_EXISTING, type READ_FILE, type READ_FILE_REPLY, type SET_FILE_POINTER, type SET_FILE_POINTER_REPLY, STD_ERROR_HANDLE, STD_INPUT_HANDLE, STD_OUTPUT_HANDLE, TRUNCATE_EXISTING, type WRITE_FILE, type WRITE_FILE_REPLY, KERNEL32 as default };
//# sourceMappingURL=kernel32.int.d.ts.map
