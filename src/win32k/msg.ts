import { GET_MESSAGE, GET_MESSAGE_REPLY, PEEK_MESSAGE, WMP, WNDPROC_PARAMS } from "../types/user32.int.types.js";
import { HANDLE, PEB } from "../types/types.js";
import { HWND_BROADCAST, LRESULT, MSG, WM } from "../types/user32.types.js";
import { ObEnumHandlesByType, ObGetObject } from "../objects.js";

import { NtUserGetProcInfo, } from "./shared.js";
import { PsProcess } from "../process.js";
import WND from "./wnd.js";

export async function NtGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const state = NtUserGetProcInfo(peb);
    if (!state) {
        console.warn("User32 not initialized");
        return { retVal: false, lpMsg: null };
    }

    let msg: MSG | null = null;
    let retVal = false;

    msg = await state.lpMsgQueue.GetMessage(data.hWnd, data.wMsgFilterMin, data.wMsgFilterMax);

    retVal = !msg || msg.message !== WM.QUIT;

    return {
        retVal: retVal,
        lpMsg: msg
    };
}

export async function NtPeekMessage(peb: PEB, data: PEEK_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const state = NtUserGetProcInfo(peb);
    if (!state) {
        console.warn("User32 not initialized");
        return { retVal: false, lpMsg: null };
    }

    let msg = await state.lpMsgQueue.PeekMessage(data.hWnd, data.wMsgFilterMin, data.wMsgFilterMax, data.wRemoveMsg);
    return {
        retVal: msg !== null,
        lpMsg: msg
    };
}

export async function NtPostMessage(peb: PEB | null, msg: MSG | WNDPROC_PARAMS) {
    let _msg: MSG = msg as MSG;
    if (msg instanceof Array) { // WNDPROC_PARAMS
        _msg = { hWnd: msg[0], message: msg[1], wParam: msg[2], lParam: msg[3] };
    }

    if (_msg.hWnd === HWND_BROADCAST) {
        // sending WM_USER messages to all windows is a bad idea
        if (_msg.message > WM.USER && _msg.message < WMP.CREATEELEMENT)
            return;

        for (const hWnd of ObEnumHandlesByType("WND")) {
            const wnd = ObGetObject<WND>(hWnd);
            if (!wnd) continue;

            const state = NtUserGetProcInfo(wnd.peb);
            if (!state) continue;

            state.lpMsgQueue.EnqueueMessage({ ..._msg, hWnd });
        }

        return;
    }

    const wnd = ObGetObject<WND>(_msg.hWnd);
    const _peb = wnd ? wnd.peb : peb;
    const state = NtUserGetProcInfo(_peb!);
    if (!state) return; // this process doesn't have a message queue

    state.lpMsgQueue.EnqueueMessage(_msg);
}

export async function NtDispatchMessage(peb: PEB | null, msg: MSG | WNDPROC_PARAMS): Promise<LRESULT> {
    let _msg: MSG = msg as MSG;
    if (msg instanceof Array) { // WNDPROC_PARAMS
        _msg = { hWnd: msg[0], message: msg[1], wParam: msg[2], lParam: msg[3] };
    }

    const wnd = ObGetObject<WND>(_msg.hWnd);
    const _peb = wnd ? wnd.peb : peb;
    const state = NtUserGetProcInfo(_peb!);
    if (!state) return; // this process doesn't have a message queue

    return await state.lpMsgQueue.DispatchMessage(_msg);
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

/**
 * Sends a quit message to the specified process' message queue
 * @param peb The process environment block of the process to post the quit message to
 * @param nExitCode The exit code to send with the quit message
 * @returns true if the message was posted, false if the process doesn't have a message queue
 */
export async function NtPostQuitMessage(peb: PEB, nExitCode: number) {
    const state = NtUserGetProcInfo(peb);
    if (!state) return false; // this process doesn't have a message queue

    const msg: MSG = {
        hWnd: 0,
        message: WM.QUIT,
        wParam: nExitCode,
        lParam: 0
    };

    state.lpMsgQueue.EnqueueMessage(msg);
    return true;
}

export async function NtPostProcessMessage(hProcess: HANDLE, lpMsg: MSG) {
    const process = ObGetObject<PsProcess>(hProcess);
    if (!process) return; // TODO: is process running?
    NtPostMessage(process.peb, lpMsg);
}