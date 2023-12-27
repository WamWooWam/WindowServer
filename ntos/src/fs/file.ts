import { Buffer, FileSystem, Path } from "../extern/filer.js";
import { HANDLE, PEB } from "ntos-sdk/types/types.js";
import { ObDestroyHandle, ObGetObject, ObSetObject } from "../objects.js";

import ConsoleFile from "./confile.js";
import FsFile from "./fsfile.js";
import { KeBugCheckEx } from "../bugcheck.js";
import NtFile from "./ntfile.js";
import { NtSetLastError } from "../error.js";
import { PsProcess } from "../process.js";

interface NT_FILESYSTEM_GLOBAL {
    fs: typeof import('node:fs');
    path: typeof import('node:path');
    Buffer: typeof import('node:buffer').Buffer;
}

let _global: NT_FILESYSTEM_GLOBAL;

function NtPathIsRooted(lpFileName: string) {
    return lpFileName[1] === ':';
}

export async function NtInitFileSystem() {
    await new Promise<void>((resolve, reject) => {
        const fs = new FileSystem({ flags: [] }, () => resolve());
        const path = Path;
        _global = { fs, path, Buffer } as NT_FILESYSTEM_GLOBAL;
    });
}


export function NtGetFileSystemGlobal(): NT_FILESYSTEM_GLOBAL {
    return _global;
}

export function NtRootPath(lpFileName: string, hOwner: HANDLE = 0) {
    const process = hOwner && ObGetObject<PsProcess>(hOwner);
    const cwd = process ? process.cwd : "C:\\Windows\\System32";

    if (lpFileName.startsWith('\\\\')) {
        // UNC path
        return lpFileName;
    } else if (NtPathIsRooted(lpFileName)) {
        // Rooted path
        return lpFileName;
    }
    else if (lpFileName[0] === '\\') {
        // Relative path
        return `${cwd[0]}:${lpFileName}`;
    } else {
        // Relative path
        return `${cwd}\\${lpFileName}`;
    }
}

export function NtFileNameToUnix(lpFileName: string, hOwner: HANDLE = 0) {
    const rootPath = NtRootPath(lpFileName, hOwner);
    // console.log(`Root path: ${rootPath}`)

    const driveLetter = rootPath[0].toLowerCase();
    const drivePath = driveLetter === 'c' ? '' : `/mnt/${driveLetter}`;
    const path = rootPath.slice(2).replace(/\\/g, '/');
    let retVal = `${drivePath}${path}`.toLowerCase(); // hack for case-insensitive file systems

    console.log(`Root path: ${rootPath} -> ${retVal}`)

    return retVal;
}

export function NtGetFileName(lpFileName: string) {
    const { path } = NtGetFileSystemGlobal();
    return path.basename(lpFileName);
}

export function NtGetDirectoryName(lpFileName: string) {
    const { path } = NtGetFileSystemGlobal();
    return path.dirname(lpFileName);
}

export async function NtCreateFile(
    peb: PEB,
    lpFileName: string,
    dwDesiredAccess: number,
    dwShareMode: number,
    lpSecurityAttributes: number,
    dwCreationDisposition: number,
    dwFlagsAndAttributes: number,
    hTemplateFile: HANDLE
): Promise<HANDLE> {
    const file = await NtCreateFileObject(peb.hProcess, lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
    if (file === null) return -1;

    const hFile = ObSetObject(file, "FILE", peb.hProcess, () => file.close());
    return hFile;
}

export async function NtReadFile(
    peb: PEB,
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToRead: number
): Promise<{ retVal: boolean, lpNumberOfBytesRead: number, lpBuffer?: Uint8Array }> {
    const file = ObGetObject<NtFile>(hFile);
    if (!file) return { retVal: false, lpNumberOfBytesRead: 0 };

    if (file.hOwningProcess !== peb.hProcess)
        throw new Error('Cannot read from file owned by another process');

    if (nNumberOfBytesToRead === 0) return { retVal: true, lpNumberOfBytesRead: 0 };

    const bytesRead = await file.read(lpBuffer, 0, nNumberOfBytesToRead);
    return { retVal: true, lpNumberOfBytesRead: bytesRead, lpBuffer: lpBuffer };
}

export async function NtWriteFile(
    hFile: HANDLE,
    lpBuffer: Uint8Array,
    nNumberOfBytesToWrite: number,
): Promise<{ retVal: boolean, lpNumberOfBytesWritten: number }> {
    const file = ObGetObject<NtFile>(hFile);
    if (!file) return { retVal: false, lpNumberOfBytesWritten: 0 };

    const bytesWritten = await file.write(lpBuffer, 0, nNumberOfBytesToWrite);
    return { retVal: true, lpNumberOfBytesWritten: bytesWritten };
}

export async function NtSetFilePointer(
    peb: PEB,
    hFile: HANDLE,
    lDistanceToMove: number,
    dwMoveMethod: number
): Promise<{ retVal: number }> {
    const file = ObGetObject<NtFile>(hFile);
    if (!file) return { retVal: -1 };

    if (file.hOwningProcess !== peb.hProcess)
        throw new Error('Cannot read from file owned by another process');

    let origin: 'begin' | 'current' | 'end';
    switch (dwMoveMethod) {
        case 0:
            origin = 'begin';
            break;
        case 1:
            origin = 'current';
            break;
        case 2:
            origin = 'end';
            break;
        default:
            throw new Error('Invalid move method');
    }

    await file.seek(lDistanceToMove, origin);
    return { retVal: file.position };
}

export async function NtCreateDirectory(
    peb: PEB,
    lpPathName: string,
    lpSecurityAttributes: number
): Promise<boolean> {
    const { fs } = NtGetFileSystemGlobal();
    const path = NtFileNameToUnix(lpPathName, peb.hProcess);

    await new Promise<void>((resolve, reject) => {
        fs.mkdir(path, { recursive: true }, (err: any) => {
            if (err && err.name !== 'EEXIST') reject(err);
            else resolve();
        });
    });

    return true;
}

export async function NtGetFileSizeEx(
    peb: PEB,
    hFile: HANDLE,
): Promise<{ retVal: boolean, lpFileSize: number }> {
    const file = ObGetObject<NtFile>(hFile);
    if (!file) return { retVal: false, lpFileSize: 0 };

    if (file.hOwningProcess !== peb.hProcess) {
        NtSetLastError(peb, 0x00000005); // ERROR_ACCESS_DENIED
        return { retVal: false, lpFileSize: 0 };
    }

    return { retVal: true, lpFileSize: file.dwLength };
}

async function NtCreateFileObject(
    hOwner: HANDLE,
    lpFileName: string,
    dwDesiredAccess: number,
    dwShareMode: number,
    lpSecurityAttributes: number,
    dwCreationDisposition: number,
    dwFlagsAndAttributes: number,
    hTemplateFile: HANDLE
): Promise<NtFile | null> {
    switch (lpFileName) {
        case "CONIN$":
            return new ConsoleFile('in', hOwner);
        case "CONOUT$":
            return new ConsoleFile('out', hOwner);
        case "CONERR$":
            return new ConsoleFile('err', hOwner);
        default:
            break;
    }

    const file = new FsFile(
        hOwner,
        lpFileName,
        dwDesiredAccess,
        dwShareMode,
        dwCreationDisposition,
        dwFlagsAndAttributes
    );

    try {
        await file.open();
    }
    catch(e) {
        // console.error(e);
        return null;
    }

    return file;
}
