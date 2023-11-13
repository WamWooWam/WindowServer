import { HANDLE } from "./types/types.js";
import { PsProcess } from "./process.js";

type tagHANDLE = {
    refCount: number;
    value: any;
    owner: HANDLE;
    dtor?: () => void;
}

const INVALID_HANDLE_VALUE = -1;
const handleTable: Map<HANDLE, tagHANDLE> = new Map();

let handleCounter = 0;
function GenHandle(): HANDLE {
    const handleBase = 0x80000000;
    handleCounter += 4;

    return handleBase + handleCounter;
}

export function ObGetObject<T>(handle: HANDLE): T {
    const tag = handleTable.get(handle);
    if (!tag) {
        return null;
    }

    return tag.value;
}

export function ObSetObject<T>(value: T, owner: HANDLE, dtor?: () => void): HANDLE {
    const handle = GenHandle();
    handleTable.set(handle, {
        refCount: 1,
        value: value,
        owner: owner,
        dtor: dtor
    });

    const hProcess = ObGetObject<PsProcess>(owner);
    if (hProcess) {
        hProcess.ownHandle(handle);
    }

    return handle;
}

export function ObCloseHandle(handle: HANDLE): boolean {
    const tag = handleTable.get(handle);
    if (!tag) {
        return false;
    }

    tag.refCount--;
    if (tag.refCount <= 0) {
        ObDestroyHandle(handle);
    }

    return true;
}

export function ObDestroyHandle(handle: HANDLE): boolean {
    const tag = handleTable.get(handle);
    if (!tag) {
        return false;
    }

    handleTable.delete(handle);
    if (tag.dtor) {
        tag.dtor();
    }

    const hProcess = ObGetObject<PsProcess>(tag.owner);
    if (hProcess) {
        hProcess.disownHandle(handle);
    }

    return true;
}

export function ObDuplicateHandle(handle: HANDLE): HANDLE {
    const tag = handleTable.get(handle);
    if (!tag) {
        return INVALID_HANDLE_VALUE;
    }

    tag.refCount++;
    return handle;
}