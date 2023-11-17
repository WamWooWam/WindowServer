import { HANDLE } from "./types/types.js";
import { ObSetObject } from "./objects.js";

export function NtAllocSharedMemory(cbSize: number, hOwner: HANDLE): HANDLE {
    const sharedArrayBuffer = new SharedArrayBuffer(cbSize);
    const hMem = ObSetObject(sharedArrayBuffer, "SHMEM", hOwner, () => { }); // weird there's no way to free this
    return hMem;
}