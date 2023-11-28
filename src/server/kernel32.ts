import {
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
} from "../types/kernel32.int.types.js";
import KERNEL32, {
    IDX_HMODULE,
    IDX_LAST_ERROR,
    IDX_PID,
} from "../types/kernel32.types.js";
import { NtCreateDirectory, NtCreateFile, NtReadFile, NtSetFilePointer, NtWriteFile } from "../ntos/fs/file.js";
import { ObCloseHandle, ObGetObject } from "../ntos/objects.js";
import { PEB, SUBSYSTEM, SUBSYSTEM_DEF } from "../types/types.js";

import { PsProcess } from "../ntos/process.js";
import { SUBSYS_KERNEL32 } from "../types/subsystems.js";

function NtK32Initialize(peb: PEB, lpSubsystem: SUBSYSTEM) {
    console.debug("KERNEL32 initialized");

    const memory = new Uint32Array(lpSubsystem.lpSharedMemory);
    Atomics.store(memory, IDX_PID, peb.dwProcessId);
    Atomics.store(memory, IDX_HMODULE, peb.hProcess);
    Atomics.store(memory, IDX_LAST_ERROR, 0);
}

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

const KERNEL32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_KERNEL32,
    lpfnInit: NtK32Initialize,
    lpExports: {
        [KERNEL32.GetProcessInfo]: GetProcessInfo,
        [KERNEL32.CloseHandle]: CloseHandle,
        [KERNEL32.CreateFile]: CreateFile,
        [KERNEL32.ReadFile]: ReadFile,
        [KERNEL32.WriteFile]: WriteFile,
        [KERNEL32.SetFilePointer]: SetFilePointer,
        [KERNEL32.CreateDirectory]: CreateDirectory,
        [KERNEL32.GetModuleHandle]: GetModuleHandle
    }
};

export default KERNEL32_SUBSYSTEM;