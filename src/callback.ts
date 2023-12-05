import { PEB, SubsystemId } from "./types/types.js";

import { CALLBACK_MESSAGE_TYPE } from "./types/ntdll.types.js";
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