import { GET_MESSAGE, GET_MESSAGE_REPLY, MSG, WM_QUIT } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

export async function NtGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const state = GetW32ProcInfo(peb);

    let msg: MSG = null;
    let retVal = false;

    msg = await state.lpMsgQueue.GetMessage(data.hWnd, data.wMsgFilterMin, data.wMsgFilterMax);
    
    retVal = msg.message !== WM_QUIT;

    return {
        retVal: retVal,
        lpMsg: msg
    };
}

export async function NtDispatchMessage(peb: PEB, msg: MSG) {
    const state = GetW32ProcInfo(peb);
    await state.lpMsgQueue.DispatchMessage(msg);
}

export async function NtPostQuitMessage(peb: PEB, nExitCode: number) {
    const state = GetW32ProcInfo(peb);

}