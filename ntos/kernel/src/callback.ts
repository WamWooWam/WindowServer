import { PEB, SubsystemId } from "@window-server/sdk/types/types.js";

import { CALLBACK_MESSAGE_TYPE } from "@window-server/ntdll/dist/ntdll.int.js"
import { ObGetObject } from "./objects.js";
import { PsProcess } from "./process.js";

export type HCALLBACK = number;

export async function NtDoCallbackAsync(peb: PEB, subsys: SubsystemId, callback: HCALLBACK, data: any[]): Promise<any> {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        return undefined;
    }

    const msg = {
        lpSubsystem: subsys,
        nType: CALLBACK_MESSAGE_TYPE,
        nChannel: callback,
        data,
    };

    return await process.SendMessage(msg);
}

export function NtCreateCallback(peb: PEB, handler: (...params: any[]) => any | Promise<any>): HCALLBACK {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        return 0;
    }

    const callback = process.RegisterCallback((msg) => handler(...msg.data), true);
    return callback;
}