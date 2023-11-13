import { NtCreateFile, NtReadFile, NtSetFilePointer, NtWriteFile } from "../file.js";
import { ObCloseHandle, ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";
import { HANDLE, PEB } from "../types/types.js";
import KERNEL32 from "../types/kernel32.types.js";

function GetProcessInfo(peb: PEB, data: { hProcess: HANDLE }) {
    var hProcess = data.hProcess;
    if (hProcess == -1) hProcess = peb.hProcess;

    const process = ObGetObject<PsProcess>(hProcess);
    return {
        id: process.id
    };
}

function CloseHandle(peb: PEB, data: { hObject: HANDLE }) {
    var hObject = data.hObject;
    ObCloseHandle(hObject);
}

async function CreateFile(peb: PEB, data: {
    lpFileName: string,
    dwDesiredAccess: number,
    dwShareMode: number,
    lpSecurityAttributes: number,
    dwCreationDisposition: number,
    dwFlagsAndAttributes: number,
    hTemplateFile: HANDLE
}) {
    const ret = await NtCreateFile(
        peb,
        data.lpFileName,
        data.dwDesiredAccess,
        data.dwShareMode,
        data.lpSecurityAttributes,
        data.dwCreationDisposition,
        data.dwFlagsAndAttributes,
        data.hTemplateFile
    );

    return {
        hFile: ret
    };
}

async function ReadFile(peb: PEB, data: {
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToRead: number,
}) {
    const ret = await NtReadFile(
        peb,
        data.hFile,
        data.lpBuffer,
        data.nNumberOfBytesToRead
    );

    return ret;
}

async function WriteFile(peb: PEB, data: {
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToWrite: number,
}) {
    const ret = await NtWriteFile(
        data.hFile,
        data.lpBuffer,
        data.nNumberOfBytesToWrite
    );

    return ret;
}

async function SetFilePointer(peb: PEB, data: {
    hFile: HANDLE,
    lDistanceToMove: number,
    dwMoveMethod: number
}) {
    const ret = await NtSetFilePointer(
        peb,
        data.hFile,
        data.lDistanceToMove,
        data.dwMoveMethod
    );

    return ret;
}


const KERNEL32_EXPORTS = {
    [KERNEL32.GetProcessInfo]: GetProcessInfo,
    [KERNEL32.CloseHandle]: CloseHandle,
    [KERNEL32.CreateFile]: CreateFile,
    [KERNEL32.ReadFile]: ReadFile,
    [KERNEL32.WriteFile]: WriteFile,
    [KERNEL32.SetFilePointer]: SetFilePointer,
};

export default KERNEL32_EXPORTS;