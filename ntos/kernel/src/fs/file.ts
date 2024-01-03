import { Buffer, FileSystem, Path } from "filer";
import { HANDLE, PEB } from "@window-server/sdk/types/types.js";
import { ObDestroyHandle, ObGetObject, ObSetObject } from "../objects.js";

import ConsoleFile from "./confile.js";
import FsFile from "./fsfile.js";
import { KeBugCheckEx } from "../bugcheck.js";
import NtFile from "./ntfile.js";
import { NtSetLastError } from "../error.js";
import { PsProcess } from "../process.js";

const CHAR_COLON = ':'.charCodeAt(0);
const CHAR_FORWARD_SLASH = '/'.charCodeAt(0);
const CHAR_BACKWARD_SLASH = '\\'.charCodeAt(0);
const CHAR_UPPERCASE_A = 'A'.charCodeAt(0);
const CHAR_LOWERCASE_A = 'a'.charCodeAt(0);
const CHAR_UPPERCASE_Z = 'Z'.charCodeAt(0);
const CHAR_LOWERCASE_Z = 'z'.charCodeAt(0);
const CHAR_DOT = '.'.charCodeAt(0);

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

function isPathSeparator(code: number) {
    return code === CHAR_BACKWARD_SLASH || code === CHAR_FORWARD_SLASH;
}

function isPosixPathSeparator(code: number) {
    return code === CHAR_FORWARD_SLASH;
}

function isWindowsDeviceRoot(code: number) {
    return (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
        (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z);
}

function normalizeString(path: string, allowAboveRoot: boolean, separator: string) {
    let res = '';
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code = 0;
    for (let i = 0; i <= path.length; ++i) {
        if (i < path.length)
            code = path.charCodeAt(i);
        else if (isPathSeparator(code))
            break;
        else
            code = CHAR_FORWARD_SLASH;

        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
                // NOOP
            } else if (dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 ||
                    res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                    res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = '';
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength =
                                res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length !== 0) {
                        res = '';
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    res += res.length > 0 ? `${separator}..` : '..';
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0)
                    res += `${separator}${path.slice(lastSlash + 1, i)}`;
                else
                    res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === CHAR_DOT && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}

export function NtPathNormalize(path: string) {
    // validateString(path, 'path');
    const len = path.length;
    if (len === 0)
        return '.';
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);

    // Try to match a root
    if (len === 1) {
        // `path` contains just a single char, exit early to avoid
        // unnecessary work
        return isPosixPathSeparator(code) ? '\\' : path;
    }
    if (isPathSeparator(code)) {
        // Possible UNC root

        // If we started with a separator, we know we at least have an absolute
        // path of some kind (UNC or otherwise)
        isAbsolute = true;

        if (isPathSeparator(path.charCodeAt(1))) {
            // Matched double path separator at beginning
            let j = 2;
            let last = j;
            // Match 1 or more non-path separators
            while (j < len &&
                !isPathSeparator(path.charCodeAt(j))) {
                j++;
            }
            if (j < len && j !== last) {
                const firstPart = path.slice(last, j);
                // Matched!
                last = j;
                // Match 1 or more path separators
                while (j < len &&
                    isPathSeparator(path.charCodeAt(j))) {
                    j++;
                }
                if (j < len && j !== last) {
                    // Matched!
                    last = j;
                    // Match 1 or more non-path separators
                    while (j < len &&
                        !isPathSeparator(path.charCodeAt(j))) {
                        j++;
                    }
                    if (j === len) {
                        // We matched a UNC root only
                        // Return the normalized version of the UNC root since there
                        // is nothing left to process
                        return `\\\\${firstPart}\\${path.slice(last)}\\`;
                    }
                    if (j !== last) {
                        // We matched a UNC root with leftovers
                        device =
                            `\\\\${firstPart}\\${path.slice(last, j)}`;
                        rootEnd = j;
                    }
                }
            }
        } else {
            rootEnd = 1;
        }
    } else if (isWindowsDeviceRoot(code) &&
        path.charCodeAt(1) === CHAR_COLON) {
        // Possible device root
        device = path.slice(0, 2);
        rootEnd = 2;
        if (len > 2 && isPathSeparator(path.charCodeAt(2))) {
            // Treat separator following drive name as an absolute path
            // indicator
            isAbsolute = true;
            rootEnd = 3;
        }
    }

    let tail = rootEnd < len ?
        normalizeString(path.slice(rootEnd), !isAbsolute, '\\') :
        '';
    if (tail.length === 0 && !isAbsolute)
        tail = '.';
    if (tail.length > 0 &&
        isPathSeparator(path.charCodeAt(len - 1)))
        tail += '\\';
    if (device === undefined) {
        return isAbsolute ? `\\${tail}` : tail;
    }
    // return (isAbsolute ? `${device}\\${tail}` : `${device}${tail}`);
    let ret = (isAbsolute ? `${device}\\${tail}` : `${device}${tail}`);
    return ret
}

export function NtPathJoin(...args: string[]) {
    if (args.length === 0)
        return '.';

    let joined;
    let firstPart;
    for (let i = 0; i < args.length; ++i) {
        const arg = args[i];
        if (arg.length > 0) {
            if (joined === undefined)
                joined = firstPart = arg;
            else
                joined += `\\${arg}`;
        }
    }

    if (joined === undefined)
        return '.';

    firstPart = firstPart!;

    // Make sure that the joined path doesn't start with two slashes, because
    // normalize() will mistake it for a UNC path then.
    //
    // This step is skipped when it is very clear that the user actually
    // intended to point at a UNC path. This is assumed when the first
    // non-empty string arguments starts with exactly two slashes followed by
    // at least one more non-slash character.
    //
    // Note that for normalize() to treat a path as a UNC path it needs to
    // have at least 2 components, so we don't filter for that here.
    // This means that the user can use join to construct UNC paths from
    // a server name and a share name; for example:
    //   path.join('//server', 'share') -> '\\\\server\\share\\')
    let needsReplace = true;
    let slashCount = 0;
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1 &&
            isPathSeparator(firstPart.charCodeAt(1))) {
            ++slashCount;
            if (firstLen > 2) {
                if (isPathSeparator(firstPart.charCodeAt(2)))
                    ++slashCount;
                else {
                    // We matched a UNC path in the first part
                    needsReplace = false;
                }
            }
        }
    }
    if (needsReplace) {
        // Find any more consecutive slashes we need to replace
        while (slashCount < joined.length &&
            isPathSeparator(joined.charCodeAt(slashCount))) {
            slashCount++;
        }

        // Replace the slashes if needed
        if (slashCount >= 2)
            joined = `\\${joined.charCodeAt(slashCount)}`;
    }

    return NtPathNormalize(joined);
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
    catch (e) {
        // console.error(e);
        return null;
    }

    return file;
}
