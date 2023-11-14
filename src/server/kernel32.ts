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
    READ_FILE,
    READ_FILE_REPLY,
    SET_FILE_POINTER,
    SET_FILE_POINTER_REPLY,
    WRITE_FILE,
    WRITE_FILE_REPLY
} from "../types/kernel32.types.js";
import { NtCreateDirectory, NtCreateFile, NtReadFile, NtSetFilePointer, NtWriteFile } from "../file.js";
import { ObCloseHandle, ObGetObject } from "../objects.js";

import { PEB } from "../types/types.js";
import { PsProcess } from "../process.js";

function GetModuleHandle(peb: PEB, { lpModuleName }: GET_MODULE_HANDLE): GET_MODULE_HANDLE_REPLY {
    if (lpModuleName == null) return { hModule: 0 };

    // TODO: implement
    return { hModule: 0 };
}

function GetProcessInfo(peb: PEB, data: GET_PROCESS_INFO): GET_PROCESS_INFO_REPLY {
    var hProcess = data.hProcess;
    if (hProcess == -1) hProcess = peb.hProcess;

    const process = ObGetObject<PsProcess>(hProcess);
    return {
        id: process.id
    };
}

function CloseHandle(peb: PEB, data: CLOSE_HANDLE) {
    var hObject = data.hObject;
    ObCloseHandle(hObject);
}

async function CreateFile(peb: PEB, data: CREATE_FILE): Promise<CREATE_FILE_REPLY> {
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

async function ReadFile(peb: PEB, data: READ_FILE): Promise<READ_FILE_REPLY> {
    const ret = await NtReadFile(
        peb,
        data.hFile,
        data.lpBuffer,
        data.nNumberOfBytesToRead
    );

    return ret;
}

async function WriteFile(peb: PEB, data: WRITE_FILE): Promise<WRITE_FILE_REPLY> {
    const ret = await NtWriteFile(
        data.hFile,
        data.lpBuffer,
        data.nNumberOfBytesToWrite
    );

    return ret;
}

async function SetFilePointer(peb: PEB, data: SET_FILE_POINTER): Promise<SET_FILE_POINTER_REPLY> {
    const ret = await NtSetFilePointer(
        peb,
        data.hFile,
        data.lDistanceToMove,
        data.dwMoveMethod
    );

    return { dwNewFilePointer: ret.retVal };
}

async function CreateDirectory(peb: PEB, data: CREATE_DIRECTORY): Promise<CREATE_DIRECTORY_REPLY> {
    const ret = await NtCreateDirectory(
        peb,
        data.lpPathName,
        data.lpSecurityAttributes
    );

    return { retVal: ret };
};

const KERNEL32_EXPORTS = {
    [KERNEL32.GetProcessInfo]: GetProcessInfo,
    [KERNEL32.CloseHandle]: CloseHandle,
    [KERNEL32.CreateFile]: CreateFile,
    [KERNEL32.ReadFile]: ReadFile,
    [KERNEL32.WriteFile]: WriteFile,
    [KERNEL32.SetFilePointer]: SetFilePointer,
    [KERNEL32.CreateDirectory]: CreateDirectory,
    [KERNEL32.GetModuleHandle]: GetModuleHandle
};

export default KERNEL32_EXPORTS;