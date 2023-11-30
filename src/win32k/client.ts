import { HWND, WS } from "../types/user32.types.js";
import { OffsetRect, POINT } from "../types/gdi32.types.js";

import { ObGetObject } from "../objects.js";
import WND from "./wnd.js";

export function NtUserScreenToClient(hWnd: HWND, lpPoint: POINT): boolean {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return false;

    const rcWindow = wnd.rcWindow;
    for (let pParent = ObGetObject<WND>(wnd.hParent); pParent; pParent = ObGetObject<WND>(pParent.hParent)) {
        if ((pParent.dwStyle & WS.VISIBLE) !== WS.VISIBLE ||
            (pParent.dwStyle & WS.DISABLED) === WS.DISABLED ||
            (pParent.dwStyle & WS.ICONIC) === WS.ICONIC)
            return false;

        OffsetRect(rcWindow, pParent.rcWindow.left + pParent.rcClient.left, pParent.rcWindow.top + pParent.rcClient.top);
    }

    lpPoint.x -= (rcWindow.left + wnd.rcClient.left);
    lpPoint.y -= (rcWindow.top + wnd.rcClient.top);

    return true;
}