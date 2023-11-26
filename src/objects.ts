import { HANDLE } from "./types/types.js";
import { PsProcess } from "./process.js";

type tagHANDLE<T> = {
    refCount: number;
    value: T;
    type: string;
    owner: HANDLE;
    ownedHandles: HANDLE[];
    dtor?: (val: T) => void;
}

const INVALID_HANDLE_VALUE = -1;
const handleTable: Map<HANDLE, tagHANDLE<any>> = new Map();

let handleCounter = 0;
function GenHandle(): HANDLE {
    const handleBase = 0x0;
    handleCounter += 1;

    return handleBase + (handleCounter * 4);
}

export function ObGetObject<T>(handle: HANDLE): T {
    const tag = handleTable.get(handle);
    if (!tag) {
        return null;
    }

    return tag.value;
}

export function ObSetObject<T>(value: T, type: string, owner: HANDLE, dtor?: (val: T) => void): HANDLE {
    const handle = GenHandle();
    handleTable.set(handle, {
        refCount: 1,
        value: value,
        type: type,
        owner: owner,
        ownedHandles: [],
        dtor: dtor
    });

    const owningHandle = handleTable.get(owner);
    if (owningHandle) {
        owningHandle.ownedHandles.push(handle);
    }

    // console.debug(`created handle ${handle}, %s %O %O`, type, handleTable.get(handle), value);

    return handle;
}

export function ObGetHandleType(handle: HANDLE): string {
    const tag = handleTable.get(handle);
    if (!tag) {
        return null;
    }

    return tag.type;
}

export function ObGetChildHandles(handle: HANDLE): HANDLE[] {
    const tag = handleTable.get(handle);
    if (!tag) {
        return [];
    }

    return tag.ownedHandles;
}

export function ObGetChildHandlesByType(handle: HANDLE, type: string): HANDLE[] {
    const tag = handleTable.get(handle);
    if (!tag) {
        return [];
    }

    return tag.ownedHandles.filter(h => ObGetHandleType(h) === type);
}

export function ObGetParentHandle(handle: HANDLE): HANDLE {
    const tag = handleTable.get(handle);
    if (!tag) {
        return INVALID_HANDLE_VALUE;
    }

    return tag.owner;
}

export function ObSetHandleOwner(handle: HANDLE, owner: HANDLE): boolean {
    const tag = handleTable.get(handle);
    if (!tag) {
        return false;
    }

    const oldOwner = tag.owner;
    tag.owner = owner;

    const oldOwnerTag = handleTable.get(oldOwner);
    if (oldOwnerTag) {
        oldOwnerTag.ownedHandles = oldOwnerTag.ownedHandles.filter(h => h !== handle);
    }

    const newOwnerTag = handleTable.get(owner);
    if (newOwnerTag) {
        newOwnerTag.ownedHandles.push(handle);
    }

    return true;
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

    for (const ownedHandle of tag.ownedHandles) {
        ObDestroyHandle(ownedHandle);
    }

    // console.debug(`destroyed handle ${handle}, %s %O %O`, tag.type, tag, tag.value)

    handleTable.delete(handle);
    if (tag.dtor) {
        tag.dtor(tag.value);
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

export function ObCreateObject<T>(type: string, value: (hObj: HANDLE) => T, owner: HANDLE, dtor?: (val: T) => void): T {
    const handle = GenHandle();
    const tag: tagHANDLE<T> = {
        refCount: 1,
        value: value(handle),
        type: type,
        owner: owner,
        ownedHandles: [],
        dtor: dtor
    };
    handleTable.set(handle, tag);

    const owningHandle = handleTable.get(owner);
    if (owningHandle) {
        owningHandle.ownedHandles.push(handle);
    }

    // console.debug(`created handle ${handle}, %s %O %O`, type, handleTable.get(handle), tag.value);

    return tag.value;
}

export function ObGetOwnedHandleCount(handle: HANDLE): number {
    const tag = handleTable.get(handle);
    if (!tag) {
        return 0;
    }

    return tag.ownedHandles.length + tag.ownedHandles.reduce((acc, h) => acc + ObGetOwnedHandleCount(h), 0);
}

export function* ObEnumObjects() {
    for (const [handle, tag] of handleTable.entries()) {
        yield handle;
    }
}

export function* ObEnumObjectsByType(type: string) {
    for (const [handle, tag] of handleTable.entries()) {
        if (tag.type === type) {
            yield handle;
        }
    }
}

export function ObDumpHandles() {
    // console.log("handleTable", handleTable);
}