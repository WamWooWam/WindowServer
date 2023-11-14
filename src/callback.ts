import { PEB, Subsystem } from "./types/types.js";

import { CALLBACK_MESSAGE_TYPE } from "./types/ntdll.types.js";
import { ObGetObject } from "./objects.js";
import { PsProcess } from "./process.js";

export type HCALLBACK = number;

export function NtDoCallbackAsync(peb: PEB, subsys: Subsystem, callback: HCALLBACK, data: any[]): Promise<any> {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    
    const msg = {
        lpSubsystem: subsys,
        nType: CALLBACK_MESSAGE_TYPE,
        nChannel: callback,
        data,
    };

    return process.SendMessage(msg);
}