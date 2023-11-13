import {
    CreateFile,
    ReadConsole,
    WriteConsole,
    SetFilePointer,
    CloseHandle,
    FILE_SHARE_READ,
    GENERIC_READ,
    GENERIC_WRITE,
    FILE_ATTRIBUTE_NORMAL,
    CREATE_ALWAYS,
} from "./client/kernel32.js";
import { SHCreateDirectoryEx } from "./client/shell32.js";
import { HANDLE } from "./types/types.js";

async function main() {

    await SHCreateDirectoryEx(0, "Test", 0);

    let hFile: HANDLE = await CreateFile(
        "Test\\test.txt",
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ,
        0,
        CREATE_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        0
    );

    console.log(hFile);

    await WriteConsole(hFile, "Hello, world!\n");
    await SetFilePointer(hFile, 0, 0);

    const buf = await ReadConsole(hFile, 13);
    console.log(buf);

    CloseHandle(hFile);
}

export { main };