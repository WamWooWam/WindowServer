import { HANDLE } from "../types/types.js";

// TODO: this entire interface is a mess and doesn't map to the real NT API at all
// fix it
// File handle backing object


export default abstract class NtFile {
    public hOwningProcess: HANDLE;
    public position: number;

    public lpFileName: string;
    public dwAccess: number;
    public dwShareMode: number;
    public lpSecurityAttributes: number;
    public dwCreationDisposition: number;
    public dwFlagsAndAttributes: number;

    constructor(
        hOwner: HANDLE,
        lpFileName: string,
        dwDesiredAccess: number,
        dwShareMode: number,
        dwCreationDisposition: number,
        dwFlagsAndAttributes: number) {
        this.hOwningProcess = hOwner;
        this.position = 0;
        this.lpFileName = lpFileName;
        this.dwAccess = dwDesiredAccess;
        this.dwShareMode = dwShareMode;
        this.dwCreationDisposition = dwCreationDisposition;
        this.dwFlagsAndAttributes = dwFlagsAndAttributes;
    }

    abstract open(): Promise<void>;
    abstract read(buffer: Uint8Array, offset: number, length: number): Promise<number>;
    abstract write(buffer: Uint8Array, offset: number, length: number): Promise<number>;
    abstract seek(position: number, origin: 'begin' | 'current' | 'end'): Promise<void>;
    abstract setLength(length: number): Promise<void>;
    abstract close(): Promise<void>;
}
