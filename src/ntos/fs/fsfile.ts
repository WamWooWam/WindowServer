import { NtFileNameToUnix, NtGetFileSystemGlobal, NtRootPath } from "./file.js";

import { HANDLE } from "../../types/types.js";
import NtFile from "./ntfile.js";

export default class FsFile extends NtFile {
    private fd: number;
    private length: number;
    private mode: string;
    private path: string;
    

    constructor(
        hOwner: HANDLE,
        lpFileName: string,
        dwDesiredAccess: number,
        dwShareMode: number,
        dwCreationDisposition: number,
        dwFlagsAndAttributes: number) {
        super(hOwner, lpFileName, dwDesiredAccess, dwShareMode, dwCreationDisposition, dwFlagsAndAttributes);

        const rootedPath = NtRootPath(hOwner, lpFileName);
        console.log(`Opening file ${rootedPath}`);

        this.fd = -1;
        this.length = 0;
        this.mode = this.FlagsToUnix(dwDesiredAccess, dwCreationDisposition, dwFlagsAndAttributes);
        this.path = NtFileNameToUnix(hOwner, lpFileName);
    }

    async open() {
        const { fs } = NtGetFileSystemGlobal();

        this.fd = await new Promise((resolve, reject) => {
            fs.open(this.path, this.mode, (err: any, fd: number) => {
                if (err) reject(err);
                else resolve(fd);
            });
        });

        this.length = await new Promise((resolve, reject) => {
            fs.stat(this.path, (err: any, stats: any) => {
                if (err) reject(err);
                else resolve(stats.size);
            });
        });
    }

    async read(buffer: Uint8Array, offset: number, length: number) {
        const { fs } = NtGetFileSystemGlobal();

        const newBuffer = Buffer.from(buffer);
        const bytesRead = await new Promise<number>((resolve, reject) => {
            fs.read(this.fd, newBuffer, offset, length, this.position, (err: any, bytesRead: number) => {
                if (err) reject(err);
                else resolve(bytesRead);
            });
        });

        buffer.set(newBuffer);

        this.position += bytesRead;
        return bytesRead;
    }

    async write(buffer: Uint8Array, offset: number, length: number) {
        const { fs } = NtGetFileSystemGlobal();
        
        const bytesWritten = await new Promise<number>((resolve, reject) => {
            fs.write(this.fd, Buffer.from(buffer), offset, length, this.position, (err: any, bytesWritten: number) => {
                if (err) reject(err);
                else resolve(bytesWritten);
            });
        });

        this.position += bytesWritten;
        return bytesWritten;
    }

    async seek(position: number, origin: 'begin' | 'current' | 'end') {
        switch (origin) {
            case 'begin':
                this.position = position;
                break;
            case 'current':
                this.position += position;
                break;
            case 'end':
                this.position = this.length + position;
                break;
        }
    }

    async setLength(length: number) {
        const { fs } = NtGetFileSystemGlobal();

        await new Promise<void>((resolve, reject) => {
            fs.ftruncate(this.fd, length, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });

        this.length = length;
    }

    async close() {
        const { fs } = NtGetFileSystemGlobal();
        
        await new Promise<void>((resolve, reject) => {
            fs.close(this.fd, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }


    private FlagsToUnix(dwDesiredAccess: number, dwCreationDisposition: number, dwFlagsAndAttributes: number) {
        // Map dwDesiredAccess
        let unixFlags = '';
        if (dwDesiredAccess & 1073741824) {
            // GENERIC_WRITE is set
            unixFlags += 'w';
        }
        else if (dwDesiredAccess & 2147483648) {
            // GENERIC_READ is set
            unixFlags += 'r';
        }

        // Map dwCreationDisposition
        if (dwCreationDisposition === 1) {
            // CREATE_NEW
            unixFlags += 'x';
        } else if (dwCreationDisposition === 2 || dwCreationDisposition === 3) {
            // CREATE_ALWAYS or OPEN_ALWAYS
            unixFlags = 'a';
            if (dwCreationDisposition === 3 || dwDesiredAccess & 1073741824) unixFlags += '+'; // OPEN_ALWAYS

        } else if (dwCreationDisposition === 4) {
            // OPEN_EXISTING
            unixFlags += '';
        } else if (dwCreationDisposition === 5) {
            // TRUNCATE_EXISTING
            unixFlags += 'w';
        }

        // Map dwFlagsAndAttributes
        if (dwFlagsAndAttributes & 33554432) {
            // FILE_ATTRIBUTE_DIRECTORY
            unixFlags += 'd';
        }

        // Append the '+' for read/write access
        if (unixFlags.includes('r') || unixFlags.includes('w')) {
            unixFlags += '+';
        }

        return unixFlags;
    }
}
