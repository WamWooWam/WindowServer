/**
 * @description Implements the registry
 */

import { InitializeObjectAttributes, OBJECT_ATTRIBUTES, OBJ_OPENIF, ObCloseHandle, ObGetObject, ObSetObject } from "./objects";

import { HANDLE } from "@window-server/sdk/types/types.js";

type NTRETURN<T> = ({ retVal: number } & Partial<T>);
type REG_VALUE_TYPE = "REG_SZ" | "REG_DWORD" | "REG_BINARY" | "REG_MULTI_SZ" | "REG_EXPAND_SZ";
type REG_VALUE = {
    type: REG_VALUE_TYPE,
    data: any,
};

type REG_KEY = {
    name: string,
    keys: { [key: string]: REG_KEY },
    values: { [key: string]: REG_VALUE },
    mounted?: true,
};

let MOUNTED_HIVES: Map<string, REG_KEY> = new Map();
let REGISTRY_ROOT: REG_KEY = {
    name: "",
    keys: {},
    values: {},
};

let REGISTRY_ROOT_HANDLE: HANDLE = 0;

export let HKEY_LOCAL_MACHINE: HANDLE = 0;
export let HKEY_CURRENT_USER: HANDLE = 0;
export let HKEY_CLASSES_ROOT: HANDLE = 0;
export let HKEY_CURRENT_CONFIG: HANDLE = 0;
export let HKEY_USERS: HANDLE = 0;

const REGISTRY_HIVES = [
    "HKEY_CLASSES_ROOT",
    "HKEY_LOCAL_MACHINE",
    "HKEY_CURRENT_CONFIG",
    "HKEY_USERS",
];

// each registry hive corresponds to a localStorage key
export function ZwInitializeRegistry(): NTRETURN<{}> {
    // initialize the root key
    REGISTRY_ROOT_HANDLE = ObSetObject<REG_KEY>(REGISTRY_ROOT, "KEY", 0)

    // load the registry from localStorage
    for (const hive of REGISTRY_HIVES) {
        const key = localStorage.getItem(hive);
        const parsedKey = (key && JSON.parse(key) as REG_KEY) || { name: hive, keys: {}, values: {} };
        const registryKey = ObSetObject<REG_KEY>(parsedKey, "KEY", 0);

        // mount the hive
        ZwMountHive(hive, REGISTRY_ROOT_HANDLE, registryKey);
        ObCloseHandle(registryKey);
    }

    // initialize the current user hive
    const defaultUserSID = ".DEFAULT";
    const pAttr: OBJECT_ATTRIBUTES = {} as OBJECT_ATTRIBUTES;
    let lpdwDisposition: number | undefined = 0;
    InitializeObjectAttributes(pAttr, "HKEY_USERS", OBJ_OPENIF, 0);
    let { retVal, keyHandle } = ZwOpenKey(0, pAttr);
    if (retVal && retVal != 0) return { retVal };

    // create the default user key
    InitializeObjectAttributes(pAttr, defaultUserSID, 0, keyHandle!);
    ({ retVal, keyHandle, lpdwDisposition } = ZwCreateKey(0, pAttr, "", 0));
    if (retVal && retVal != 0) return { retVal };

    // if the key was created, initialize it
    if (lpdwDisposition !== 1) {
        // create the environment key
        InitializeObjectAttributes(pAttr, "Environment", 0, keyHandle!);
        ({ retVal, keyHandle } = ZwCreateKey(0, pAttr, "", 0));
        if (retVal && retVal != 0) return { retVal };

        // set the path variable
        const path = "C:\\windows\\system32\\tests;C:\\windows\\system32;C:\\windows;C:\\windows\\system32\\wbem";
        ZwSetValueKey(keyHandle!, "Path", "REG_SZ", path, path.length);

        const temp = "C:\\windows\\temp";
        ZwSetValueKey(keyHandle!, "TEMP", "REG_SZ", temp, temp.length);
        ZwSetValueKey(keyHandle!, "TMP", "REG_SZ", temp, temp.length);
    }

    // mount the hive
    ZwMountHive("HKEY_CURRENT_USER", REGISTRY_ROOT_HANDLE, keyHandle!);

    // close the handle
    ObCloseHandle(keyHandle!);

    // save changes
    ZwSaveRegistry();

    // set the global handles
    HKEY_LOCAL_MACHINE = ObSetObject<REG_KEY>(REGISTRY_ROOT.keys["HKEY_LOCAL_MACHINE"], "KEY", 0);
    HKEY_CURRENT_USER = ObSetObject<REG_KEY>(REGISTRY_ROOT.keys["HKEY_CURRENT_USER"], "KEY", 0);
    HKEY_CLASSES_ROOT = ObSetObject<REG_KEY>(REGISTRY_ROOT.keys["HKEY_CLASSES_ROOT"], "KEY", 0);
    HKEY_CURRENT_CONFIG = ObSetObject<REG_KEY>(REGISTRY_ROOT.keys["HKEY_CURRENT_CONFIG"], "KEY", 0);
    HKEY_USERS = ObSetObject<REG_KEY>(REGISTRY_ROOT.keys["HKEY_USERS"], "KEY", 0);

    return { retVal: 0 };
}

export function ZwSaveRegistry(): NTRETURN<{}> {
    // debugger;
    for (const [key, value] of MOUNTED_HIVES.entries()) {
        const { retVal, key: regKey } = ZwIntCloneKey(value);

        if (retVal && retVal != 0) return { retVal };

        localStorage.setItem(key, JSON.stringify(regKey));
    }
    return { retVal: 0 };
}

export function ZwCreateKey(dwDesiredAccess: number, lpObjectAttributes: OBJECT_ATTRIBUTES, lpszClass: string, dwCreateOptions: number): NTRETURN<{ keyHandle: HANDLE, lpdwDisposition: number }> {
    // get the parent key
    const parent = ObGetObject<REG_KEY>(lpObjectAttributes.hRootDirectory) ?? REGISTRY_ROOT;
    const parts = lpObjectAttributes.lpObjectName.split("\\");
    // find the key if it already exists
    let key = parent;
    let remainingParts = parts.length;
    for (const part of parts) {
        key = key.keys[part];
        if (!key) break;
        remainingParts--;
    }

    if (key) return { retVal: 0, keyHandle: ObSetObject<REG_KEY>(key, "KEY", 0), lpdwDisposition: 1 };
    if ((dwCreateOptions & OBJ_OPENIF)) return { retVal: -1 };

    // create the keys recursively, from the parent to the key
    key = parent;
    for (const part of parts.slice(0, remainingParts)) {
        const newKey: REG_KEY = {
            name: part,
            keys: {},
            values: {},
        };

        ZwInsertKey(key, newKey);
        key = newKey;
    }

    // return the handle
    return { retVal: 0, keyHandle: ObSetObject<REG_KEY>(key, "KEY", 0), lpdwDisposition: 0 };
}

export function ZwOpenKey(dwDesiredAccess: number, lpObjectAttributes: OBJECT_ATTRIBUTES): NTRETURN<{ keyHandle: HANDLE }> {
    // use ZwCreateKey to open the key, copy lpObjectAttributes and set OBJ_OPENIF
    const pAttr: OBJECT_ATTRIBUTES = {} as OBJECT_ATTRIBUTES;
    InitializeObjectAttributes(pAttr, lpObjectAttributes.lpObjectName, lpObjectAttributes.dwAttributes | OBJ_OPENIF, lpObjectAttributes.hRootDirectory);

    const { retVal, keyHandle } = ZwCreateKey(dwDesiredAccess, pAttr, "", 0);
    if (retVal && retVal != 0) return { retVal };

    return { retVal: 0, keyHandle };
}

export function ZwSetValueKey(hKey: HANDLE, lpValueName: string, dwType: REG_VALUE_TYPE, lpData: any, cbData: number): NTRETURN<{}> {
    const key = ObGetObject<REG_KEY>(hKey);
    if (!key) return { retVal: -1 };

    key.values[lpValueName] = {
        type: dwType,
        data: lpData,
    };

    return { retVal: 0 };
}

export function ZwEnumerateValueKey(hKey: HANDLE, dwIndex: number): NTRETURN<{ lpValueName: string, lpType: REG_VALUE_TYPE, lpData: any }> {
    const key = ObGetObject<REG_KEY>(hKey);
    if (!key) return { retVal: -1 };

    const values = Object.entries(key.values);
    if (dwIndex >= values.length) return { retVal: -1 };

    const [lpValueName, { type: lpType, data: lpData }] = values[dwIndex];
    return { retVal: 0, lpValueName, lpType, lpData };
}

function ZwMountHive(hive: string, hKeyParent: HANDLE, hKey: HANDLE): NTRETURN<{}> {
    const parent = ObGetObject<REG_KEY>(hKeyParent);
    if (!parent) return { retVal: -1 };

    const key = ObGetObject<REG_KEY>(hKey);
    if (!key) return { retVal: -1 };

    // mount the hive
    ZwIntMountKey(hive, parent, key);

    return { retVal: 0 };
}

function ZwIntCloneKey(key: REG_KEY): NTRETURN<{ key: REG_KEY }> {
    // clone the key recursively, skip if a mounted flag is encountered
    let clone: REG_KEY = {
        name: key.name,
        keys: {},
        values: {},
    };

    for (const [keyName, keyValue] of Object.entries(key.keys)) {
        if (keyValue.mounted) continue;

        const { retVal, key: clonedKey } = ZwIntCloneKey(keyValue);
        if (retVal && retVal != 0) return { retVal };

        if (clonedKey)
            clone.keys[keyName] = clonedKey;
    }

    for (const [valueName, valueValue] of Object.entries(key.values)) {
        clone.values[valueName] = valueValue;
    }

    delete clone.mounted;

    return { retVal: 0, key: clone };
}

function ZwIntMountKey(hive: string, parent: REG_KEY, key: REG_KEY): NTRETURN<{}> {
    // mount the key to the parent
    parent.keys[hive] = { ...key, mounted: true };

    // add the hive to the mounted hives list
    MOUNTED_HIVES.set(hive, key);

    return { retVal: 0 };
}

function ZwInsertKey(parent: REG_KEY, key: REG_KEY): NTRETURN<{}> {
    // insert the key to the parent
    parent.keys[key.name] = key;

    return { retVal: 0 };
}