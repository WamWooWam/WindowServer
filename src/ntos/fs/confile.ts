import { HANDLE } from "../../types/types.js";
import NtFile from "./ntfile.js";

export default class ConsoleFile extends NtFile {

    constructor(private type: 'in' | 'out' | 'err', hOwner: HANDLE) {
        super(hOwner, null, null, null, null, null);

    }

    async open() { }

    async read(buffer: Uint8Array, offset: number, length: number) {
        return 0;
    }

    async write(buffer: Uint8Array, offset: number, length: number) {
        return 0;
    }

    async seek(position: number, origin: 'begin' | 'current' | 'end') {
        throw new Error('Cannot seek on console handle');
    }

    async setLength(length: number) {
        throw new Error('Cannot set length on console handle');
    }

    async close() {
    }
}
