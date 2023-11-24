import DESKTOP, { NtUserSetActiveWindow } from "./desktop.js";
import { GET_MESSAGE, GET_MESSAGE_REPLY, HWND_BROADCAST, LRESULT, MSG, WM, WNDPROC_PARAMS } from "../types/user32.types.js";
import { GetW32ProcInfo, HWNDS } from "./shared.js";
import { HANDLE, PEB } from "../types/types.js";
import { ObEnumObjectsByType, ObGetObject } from "../objects.js";

import { PsProcess } from "../process.js";
import { WMP } from "../types/user32.int.types.js";
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

export function NtPostMessage(peb: PEB, msg: MSG | WNDPROC_PARAMS) {
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
        // sending WM_USER messages to all windows is a bad idea
        if (_msg.message > WM.USER && _msg.message < WMP.CREATEELEMENT) {
            return;
        }

        for (const hWnd of ObEnumObjectsByType("WND")) {
            const wnd = ObGetObject<WND>(hWnd);
            if (wnd) {
                const state = GetW32ProcInfo(wnd.peb);
                state.lpMsgQueue.EnqueueMessage({ ..._msg, hWnd });
            }
        }
        return;
    }

    if (_msg.hWnd && _msg.message === WM.LBUTTONDOWN || _msg.message === WM.MBUTTONDOWN || _msg.message === WM.RBUTTONDOWN) {
        NtUserSetActiveWindow(peb, _msg.hWnd);
        NtPostMessage(peb, [_msg.hWnd, WM.ACTIVATE, _msg.hWnd, 0]);
    }

    const wnd = ObGetObject<WND>(_msg.hWnd);
    if (wnd) {
        const state = GetW32ProcInfo(wnd.peb);
        state.lpMsgQueue.EnqueueMessage(_msg);
    }
    else {
        const state = GetW32ProcInfo(peb);
        state.lpMsgQueue.EnqueueMessage(_msg);
    }
}

export async function NtDispatchMessage(peb: PEB, msg: MSG | WNDPROC_PARAMS): Promise<LRESULT> {
    let _msg: MSG = msg as MSG;
    if (msg instanceof Array) {
        _msg = {
            hWnd: msg[0],
            message: msg[1],
            wParam: msg[2],
            lParam: msg[3]
        };
    }

    if (_msg.hWnd && _msg.message === WM.LBUTTONDOWN || _msg.message === WM.MBUTTONDOWN || _msg.message === WM.RBUTTONDOWN) {
        NtUserSetActiveWindow(peb, _msg.hWnd);
        NtPostMessage(peb, [_msg.hWnd, WM.ACTIVATE, _msg.hWnd, 0]);
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

export async function NtSendMessageTimeout(peb: PEB, msg: MSG | WNDPROC_PARAMS, dwTimeout: number): Promise<{ status: LRESULT, result: LRESULT }> {
    return new Promise<{ status: LRESULT, result: LRESULT }>((resolve, reject) => {
        let resolved = false;
        let timeout: any = null;
        const _resolve = (result: { status: LRESULT, result: LRESULT }) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(result);
            }
        };

        NtDispatchMessage(peb, msg).then((result) => {
            _resolve({ status: 0, result: result });
        });

        timeout = setTimeout(() => {
            console.warn("NtSendMessageTimeout timed out");
            _resolve({ status: -1, result: null });
        }, dwTimeout);
    });
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