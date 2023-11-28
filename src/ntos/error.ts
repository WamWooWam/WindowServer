import { IDX_LAST_ERROR } from "../types/kernel32.types.js";
import { PEB } from "../types/types.js";
import { SUBSYS_KERNEL32 } from "../types/subsystems.js";

export function NtGetLastError(peb: PEB) {
    const subsystem = peb.lpSubsystems.get(SUBSYS_KERNEL32);
    if (!subsystem) throw new Error("Kernel32 subsystem not loaded");

    const view = new Uint32Array(subsystem.lpSharedMemory);
    return Atomics.load(view, IDX_LAST_ERROR);
}

export function NtSetLastError(peb: PEB, dwErrorCode: number) {
    const subsystem = peb.lpSubsystems.get(SUBSYS_KERNEL32);
    if (!subsystem) throw new Error("Kernel32 subsystem not loaded");

    console.debug(`NtSetLastError pid:${peb.dwProcessId} ${dwErrorCode}`);

    const view = new Uint32Array(subsystem.lpSharedMemory);
    Atomics.store(view, IDX_LAST_ERROR, dwErrorCode);
}