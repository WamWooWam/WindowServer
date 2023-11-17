import { HWND, LPARAM, LRESULT, WM_CREATE, WM_KEYDOWN, WM_NCCREATE, WM_USER, WPARAM } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

export async function NtDefWindowProc(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const state = GetW32ProcInfo(peb);

    if (Msg > WM_USER) // not for us!
        return 0;

    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    console.warn(`NtDefWindowProc: Msg=0x${Msg.toString(16)}`);

    if (Msg == WM_KEYDOWN) {
        console.log("keydown " + wParam.toString(16) + " " + String.fromCharCode(wParam));
        wnd.pRootElement.appendChild(document.createTextNode(String.fromCharCode(wParam)));
    }

    return 0; // TODO
}