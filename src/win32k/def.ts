import { HWND, LPARAM, LRESULT, WM_CREATE, WM_KEYDOWN, WM_NCCREATE, WM_USER, WPARAM } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

const funnyMap = new Map<HWND, HTMLParagraphElement>();

export async function NtDefWindowProc(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const state = GetW32ProcInfo(peb);

    if (Msg > WM_USER) // not for us!
        return 0;

    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    console.warn(`NtDefWindowProc: ${Msg.toString(16)}`);

    if (Msg == WM_NCCREATE) {
        const p = document.createElement("p");
        funnyMap.set(hWnd, p);
        document.body.appendChild(p);
    }

    if (Msg == WM_KEYDOWN) {
        const p = funnyMap.get(hWnd);
        if (p) {
            console.log("keydown " + wParam.toString(16) + " " + String.fromCharCode(wParam));
            p.textContent += String.fromCharCode(wParam);
        }
    }

    return 0; // TODO
}