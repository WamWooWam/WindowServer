import { ObGetObject, ObSetObject } from "../objects.js";

import { GWL, WM } from "../subsystems/user32.js";
import { PEB } from "@window-server/sdk/types/types.js";
import WND from "./wnd.js";
import { NtCreateCallback } from "../callback.js";
import { NtDispatchMessage } from "./msg.js";

export function NtUserGetWindowLong(peb: PEB, wnd: WND, nIndex: number): number | Function {
    switch (nIndex) {
        case GWL.STYLE:
            return wnd.dwStyle;
        case GWL.EXSTYLE:
            return wnd.dwExStyle;
        case GWL.ID:
            return wnd.hWnd;
        case GWL.USERDATA:
            return wnd.dwUserData;
        case GWL.WNDPROC:
            return wnd.lpfnWndProc;
        case GWL.HINSTANCE:
            return wnd.hInstance;
        case GWL.HWNDPARENT:
            return wnd.hParent;
        default:
            console.warn("NtUserGetWindowLong: unknown nIndex", nIndex);
            return 0;
    }
}

export async function NtUserSetWindowLong(peb: PEB, wnd: WND, nIndex: number, dwNewLong: any): Promise<number> {
    let oldValue = 0;
    switch (nIndex) {
        case GWL.STYLE:
            oldValue = wnd.dwStyle;
            wnd.dwStyle = dwNewLong;

            // send WM_STYLECHANGED
            await NtDispatchMessage(peb, [wnd.hWnd, WM.STYLECHANGED, nIndex, dwNewLong]);
            break;
        case GWL.EXSTYLE:
            oldValue = wnd.dwExStyle;
            wnd.dwExStyle = dwNewLong;
            break;
        case GWL.USERDATA:
            oldValue = wnd.dwUserData;
            wnd.dwUserData = dwNewLong;
            break;
        case GWL.WNDPROC: {
            let pOldValue = wnd.lpfnWndProc;
            if (typeof pOldValue === 'function') {
                oldValue = NtCreateCallback(peb, pOldValue);
            }
            else {
                oldValue = <number>oldValue;
            }

            wnd.lpfnWndProc = dwNewLong;
            break;
        }
        case GWL.HWNDPARENT:
            // wnd.hParent = dwNewLong;
            break;
        default:
            console.warn("NtUserSetWindowLong: unknown nIndex", nIndex);
            break;
    }

    return oldValue;
}