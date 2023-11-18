import { HWND, LPARAM, LRESULT, SC_CLOSE, SC_MAXIMIZE, SC_MINIMIZE, SC_RESTORE, SW_MAXIMIZE, SW_MINIMIZE, SW_RESTORE, WM_CLOSE, WM_CREATE, WM_KEYDOWN, WM_NCCREATE, WM_SYSCOMMAND, WM_USER, WPARAM } from "../types/user32.types.js";
import { NtDestroyWindow, NtShowWindow } from "./window.js";

import { GetW32ProcInfo } from "./shared.js";
import { NtSendMessage } from "./msg.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

async function NtDefWndHandleSysCommand(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (wParam & 0xFFF0) {
        case SC_MINIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW_MINIMIZE);
            return 0;
        case SC_MAXIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW_MAXIMIZE);
            return 0;
        case SC_RESTORE:
            await NtShowWindow(peb, wnd.hWnd, SW_RESTORE);
            return 0;
        case SC_CLOSE:
            return await NtSendMessage(peb, {
                hWnd: wnd.hWnd,
                message: WM_CLOSE,
                wParam: 0,
                lParam: 0
            });
    }

    return 0; // TODO
}

export async function NtDefWindowProc(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const state = GetW32ProcInfo(peb);

    if (Msg > WM_USER) // not for us!
        return 0;

    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    console.warn(`NtDefWindowProc: Msg=0x${Msg.toString(16)}`);

    switch (Msg) {
        case WM_NCCREATE:
            console.log("WM_NCCREATE");
            return 0;
        case WM_CREATE:
            console.log("WM_CREATE");
            return 0;

        case WM_CLOSE:
            console.log("WM_CLOSE");
            await NtDestroyWindow(peb, hWnd);
            return 0;

        case WM_SYSCOMMAND:
            console.log("WM_SYSCOMMAND");
            return await NtDefWndHandleSysCommand(peb, wnd, wParam, lParam);

        case WM_KEYDOWN:
            console.log("WM_KEYDOWN " + wParam.toString(16) + " " + String.fromCharCode(wParam));
            wnd.pRootElement.appendChild(document.createTextNode(String.fromCharCode(wParam)));
            return 0;
    }

    return 0; // TODO
}
