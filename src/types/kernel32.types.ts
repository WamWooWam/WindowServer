const KERNEL32 = {
    GetProcessInfo: 0x00000001,
    CloseHandle: 0x00000002,
    CreateFile: 0x00000003,
    ReadFile: 0x00000004,
    WriteFile: 0x00000005,
    SetFilePointer: 0x00000006,
    CreateDirectory: 0x00000007
}

export default KERNEL32;