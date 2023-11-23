import { GET_MESSAGE, GET_MESSAGE_REPLY, LRESULT, MSG, WM, WNDPROC_PARAMS } from "../types/user32.types.js";
import { HANDLE, PEB } from "../types/types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";

export async function NtGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const state = GetW32ProcInfo(peb);

    let msg: MSG = null;
    let retVal = false;

    msg = await state.lpMsgQueue.GetMessage(data.hWnd, data.wMsgFilterMin, data.wMsgFilterMax);

    retVal = msg.message !== WM.QUIT;

    return {
        retVal: retVal,
        lpMsg: msg
    };
}

export async function NtPostMessage(peb: PEB, lpMsg: MSG | WNDPROC_PARAMS) {
    const state = GetW32ProcInfo(peb);
    if (lpMsg instanceof Array) {
        state.lpMsgQueue.EnqueueMessage({
            hWnd: lpMsg[0],
            message: lpMsg[1],
            wParam: lpMsg[2],
            lParam: lpMsg[3]
        });
    }
    else {
        state.lpMsgQueue.EnqueueMessage(lpMsg);
    }
}

export async function NtSendMessage(peb: PEB, msg: MSG | WNDPROC_PARAMS): Promise<LRESULT> {
    const state = GetW32ProcInfo(peb);
    if (msg instanceof Array) {
        return await state.lpMsgQueue.DispatchMessage({
            hWnd: msg[0],
            message: msg[1],
            wParam: msg[2],
            lParam: msg[3]
        });
    }
    else {
        return await state.lpMsgQueue.DispatchMessage(msg);
    }
}

export async function NtPostQuitMessage(peb: PEB, nExitCode: number) {
    const state = GetW32ProcInfo(peb);
    const msg: MSG = {
        hWnd: null,
        message: WM.QUIT,
        wParam: nExitCode,
        lParam: 0
    };

    state.lpMsgQueue.EnqueueMessage(msg);
}

export async function NtPostProcessMessage(hProcess: HANDLE, lpMsg: MSG) {
    const process = ObGetObject<PsProcess>(hProcess);
    NtPostMessage(process.peb, lpMsg);
}