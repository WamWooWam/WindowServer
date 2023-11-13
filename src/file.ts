import { ObGetObject, ObSetObject } from "./objects.js";
import { HANDLE, PEB } from "./types/types.js";

const Filer = window['Filer' as keyof typeof window];
const fs = new Filer.FileSystem();
const Buffer = Filer.Buffer;

// TODO: this entire interface is a mess and doesn't map to the real NT API at all
// fix it

// File handle backing object
abstract class NtFile {
    public hOwningProcess: HANDLE;
    public position: number;

    constructor(hOwner: HANDLE) {
        this.hOwningProcess = hOwner;
        this.position = 0;
    }

    abstract open(): Promise<void>;
    abstract read(buffer: Uint8Array, offset: number, length: number): Promise<number>;
    abstract write(buffer: Uint8Array, offset: number, length: number): Promise<number>;
    abstract seek(position: number, origin: 'begin' | 'current' | 'end'): Promise<void>;
    abstract setLength(length: number): Promise<void>;
    abstract close(): Promise<void>;
}

class FsFile extends NtFile {
    private fd: number;
    private length: number;

    constructor(private path: string, private mode: string, hOwner: HANDLE) { super(hOwner); }

    async open() {
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
        await new Promise<void>((resolve, reject) => {
            fs.ftruncate(this.fd, length, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });

        this.length = length;
    }

    async close() {
        await new Promise<void>((resolve, reject) => {
            fs.close(this.fd, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

class ConsoleFile extends NtFile {
    private stream: ReadableStream<string> | WritableStream<string>;

    constructor(private type: 'in' | 'out' | 'err', hOwner: HANDLE) {
        super(hOwner);
        if (type === 'in') {
            this.stream = new ReadableStream<string>({
                start(controller) {
                    const handler = (event: KeyboardEvent) => {
                        controller.enqueue(event.key);
                    };

                    window.addEventListener('keypress', handler);
                }
            });
        } else {
            this.stream = new WritableStream<string>({
                write(chunk) {
                    console.log(chunk);
                }
            });
        }
    }

    async open() { }

    async read(buffer: Uint8Array, offset: number, length: number) {
        if (this.type !== 'in') throw new Error('Cannot read from non-input console handle')

        const reader = (this.stream as ReadableStream<string>).getReader();
        const result = await reader.read();
        if (result.done) return 0;

        const encoder = new TextEncoder();
        const encoded = encoder.encode(result.value);
        buffer.set(encoded, offset);

        return encoded.length;
    }

    async write(buffer: Uint8Array, offset: number, length: number) {
        if (this.type === 'in') throw new Error('Cannot write to non-output console handle');

        const decoder = new TextDecoder();
        const decoded = decoder.decode(buffer.slice(offset, offset + length));

        const writer = (this.stream as WritableStream<string>).getWriter();
        writer.write(decoded);
        writer.releaseLock();

        return length;
    }

    async seek(position: number, origin: 'begin' | 'current' | 'end') {
        throw new Error('Cannot seek on console handle');
    }

    async setLength(length: number) {
        throw new Error('Cannot set length on console handle');
    }

    async close() { }
}


function mapWin32FlagsToUnix(dwDesiredAccess: number, dwCreationDisposition: number, dwFlagsAndAttributes: number) {
    // Map dwDesiredAccess
    let unixFlags = '';
    if (dwDesiredAccess & 0x40000000) {
        // GENERIC_WRITE is set
        unixFlags += 'w';
    }
    else if (dwDesiredAccess & 0x80000000) {
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
        if (dwCreationDisposition === 3 || dwDesiredAccess & 0x40000000) unixFlags += '+'; // OPEN_ALWAYS

    } else if (dwCreationDisposition === 4) {
        // OPEN_EXISTING
        unixFlags += '';
    } else if (dwCreationDisposition === 5) {
        // TRUNCATE_EXISTING
        unixFlags += 'w';
    }

    // Map dwFlagsAndAttributes
    if (dwFlagsAndAttributes & 0x02000000) {
        // FILE_ATTRIBUTE_DIRECTORY
        unixFlags += 'd';
    }

    // Append the '+' for read/write access
    if (unixFlags.includes('r') || unixFlags.includes('w')) {
        unixFlags += '+';
    }

    return unixFlags;
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

    const hFile = ObSetObject(file, () => file.close());
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


    const mode = mapWin32FlagsToUnix(dwDesiredAccess, dwCreationDisposition, dwFlagsAndAttributes);

    console.log(`Opening file ${lpFileName} with mode ${mode}`);
    const file = new FsFile(lpFileName, mode, hOwner);
    await file.open();

    return file;
}

