import { GET_MESSAGE, GET_MESSAGE_REPLY, MSG } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

export async function NtGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const state = GetW32ProcInfo(peb);

    const msg = await Promise.any([
        ...state.hWnds.map(async hWnd => {
            const wnd = ObGetObject<WND>(hWnd);
            return await wnd.GetMessage();
        })
    ]);

    return {
        retVal: true,
        lpMsg: msg
    };

}

export async function NtDispatchMessage(peb: PEB, msg: MSG) {
    const wnd = ObGetObject<WND>(msg.hWnd);
    if (wnd) {
        await wnd.WndProc(msg.message, msg.wParam, msg.lParam);
    }
}