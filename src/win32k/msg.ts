import { GET_MESSAGE, GET_MESSAGE_REPLY, HWND_BROADCAST, LRESULT, MSG, WM, WNDPROC_PARAMS } from "../types/user32.types.js";
import { GetW32ProcInfo, HWNDS } from "./shared.js";
import { HANDLE, PEB } from "../types/types.js";

import { ObGetObject } from "../objects.js";
import { PsListProcesses } from "../loader.js";
import { PsProcess } from "../process.js";
import { WND } from "./wnd.js";

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

export async function NtPostMessage(peb: PEB, msg: MSG | WNDPROC_PARAMS) {
    let _msg: MSG = msg as MSG;
    if (msg instanceof Array) {
        _msg = {
            hWnd: msg[0],
            message: msg[1],
            wParam: msg[2],
            lParam: msg[3]
        };
    }

    if (_msg.hWnd === HWND_BROADCAST) {
        for (const hWnd of HWNDS) {
            const wnd = ObGetObject<WND>(hWnd);
            if (wnd) {
                const state = GetW32ProcInfo(wnd.peb);
                state.lpMsgQueue.EnqueueMessage({ ..._msg, hWnd });
            }
        }
    }
    else {
        const wnd = ObGetObject<WND>(_msg.hWnd);
        if (!wnd) {
            const state = GetW32ProcInfo(peb);
            state.lpMsgQueue.EnqueueMessage(_msg);
        }
        else {
            const state = GetW32ProcInfo(wnd.peb);
            state.lpMsgQueue.EnqueueMessage(_msg);
        }
    }
}

export async function NtSendMessage(peb: PEB, msg: MSG | WNDPROC_PARAMS): Promise<LRESULT> {
    let _msg: MSG = msg as MSG;
    if (msg instanceof Array) {
        _msg = {
            hWnd: msg[0],
            message: msg[1],
            wParam: msg[2],
            lParam: msg[3]
        };
    }

    const wnd = ObGetObject<WND>(_msg.hWnd);
    if (wnd) {
        const state = GetW32ProcInfo(wnd.peb);
        return await state.lpMsgQueue.DispatchMessage(_msg);
    }
    else if (!_msg.hWnd) {
        const state = GetW32ProcInfo(peb);
        return await state.lpMsgQueue.DispatchMessage(_msg);
    }
}

export async function NtSendMessageCurrentProcess(peb: PEB, msg: MSG | WNDPROC_PARAMS): Promise<LRESULT> {
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