import { GET_MESSAGE, GET_MESSAGE_REPLY, LRESULT, MSG, WM_QUIT, WNDPROC_PARAMS } from "../types/user32.types.js";
import { HANDLE, PEB } from "../types/types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";
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

export async function NtPostMessage(peb: PEB, lpMsg: MSG) {
    const state = GetW32ProcInfo(peb);
    state.lpMsgQueue.EnqueueMessage(lpMsg);
}

// export async function NtSendMessage(peb: PEB, lpMsg: MSG): Promise<LRESULT> {
//     const state = GetW32ProcInfo(peb);
//     const hWnd = state.hWnds.find(hWnd => hWnd === lpMsg.hWnd);
//     if (hWnd) {
//         const wnd = ObGetObject<WND>(hWnd);
//         return await wnd.WndProc(lpMsg.message, lpMsg.wParam, lpMsg.lParam);
//     }

//     return 0;
// }

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
        message: WM_QUIT,
        wParam: nExitCode,
        lParam: 0
    };

    state.lpMsgQueue.EnqueueMessage(msg);
}

export async function NtPostProcessMessage(hProcess: HANDLE, lpMsg: MSG) {
    const process = ObGetObject<PsProcess>(hProcess);
    NtPostMessage(process.peb, lpMsg);
}