import { Buffer, FileSystem, Path } from "../extern/filer.js";
import { HANDLE, PEB } from "../types/types.js";
import { ObGetObject, ObSetObject } from "../objects.js";

import ConsoleFile from "./confile.js";
import FsFile from "./fsfile.js";
import { KeBugCheckEx } from "../bugcheck.js";
import NtFile from "./ntfile.js";
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
        const fs = new FileSystem({ flags: ['FORMAT'] }, () => resolve());
        const path = Path;
        _global = { fs, path, Buffer } as NT_FILESYSTEM_GLOBAL;
    });
}


export function NtGetFileSystemGlobal(): NT_FILESYSTEM_GLOBAL {
    return _global;
}

export function NtRootPath(hOwner: HANDLE, lpFileName: string) {
    const process = ObGetObject<PsProcess>(hOwner);
    if (!process) {
        throw KeBugCheckEx(0x69, "NtRootPath: process not found");
    }

    const cwd = process.cwd;

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

export function NtFileNameToUnix(hOwner: HANDLE, lpFileName: string) {
    const rootPath = NtRootPath(hOwner, lpFileName);
    console.log(`Root path: ${rootPath}`)

    const driveLetter = rootPath[0].toLowerCase();
    const drivePath = driveLetter === 'c' ? '/' : `/mnt/${driveLetter}`;
    const path = rootPath.slice(2).replace(/\\/g, '/');
    return `${drivePath}/${path}`.toLowerCase(); // hack for case-insensitive file systems
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
    if (!file) return -1;

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
    const path = NtFileNameToUnix(peb.hProcess, lpPathName);

    await new Promise<void>((resolve, reject) => {
        fs.mkdir(path, { recursive: true }, (err: any) => {
            if (err && err.name !== 'EEXIST') reject(err);
            else resolve();
        });
    });

    return true;
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
): Promise<NtFile> {
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

    await file.open();

    return file;
}
