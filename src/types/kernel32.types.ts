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

export const IDX_PID = 0;
export const IDX_HMODULE = 1;
export const IDX_LAST_ERROR = 2;

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

export default KERNEL32;