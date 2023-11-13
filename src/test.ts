import {
    CreateFile,
    CREATE_NEW,
    FILE_SHARE_READ,
    GENERIC_READ,
    GENERIC_WRITE,
    FILE_ATTRIBUTE_NORMAL,
    WriteConsole,
    SetFilePointer,
    ReadFile,
    CREATE_ALWAYS,
    CloseHandle,
    ReadConsole,
} from "./client/kernel32.js";
import { HANDLE } from "./types/types.js";

async function main() {
    let hFile: HANDLE = await CreateFile(
        "/test.txt",
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

    CloseHandle(hFile)
}

export { main };