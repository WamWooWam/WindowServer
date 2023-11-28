import { HIWORD, HT, HWND, LOWORD, LPARAM, LRESULT, SC, SM, WM, WMSZ, WPARAM, WS } from "../../types/user32.types.js";
import { INRECT, InflateRect, RECT } from "../../types/gdi32.types.js";
import { NtDispatchMessage, NtSendMessageTimeout } from "./msg.js";
import { NtUserGetWindowBorders, NtUserHasWindowEdge } from "./window.js";

import { NtDefWindowProc } from "./def.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtUserSetActiveWindow } from "./desktop.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../../types/types.js";
import WND from "./wnd.js";
import WindowElement from "../../win32k/html/WindowElement.js";

export function NtDefCalcNCSizing(peb: PEB, hWnd: number, Msg: WM, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    let style = wnd.dwStyle;
    let exStyle = wnd.dwExStyle;
    let rect = lParam as RECT;
    let origRect: RECT;

    if (rect == null) {
        return null;
    }

    origRect = { ...rect };

    // wnd.state &= ~WNDS_HASCAPTION;
    // if (wparam)
    // {
    //     if (wnd.lpClass.style & CS.VREDRAW)
    //     {
    //         Result |= WVR_VREDRAW;
    //     }
    //     if (wnd.pcls.style & CS.HREDRAW)
    //     {
    //         Result |= WVR_HREDRAW;
    //     }
    //     Result |= WVR_VALIDRECTS;
    // }
    if (!(wnd.dwStyle & WS.MINIMIZE)) {
        if (NtUserHasWindowEdge(wnd.dwStyle, wnd.dwExStyle)) {
            let windowBorders = NtUserGetWindowBorders(peb, wnd.dwStyle, wnd.dwExStyle, false);
            InflateRect(rect, -windowBorders.cx, -windowBorders.cy);
        }
        else if ((wnd.dwExStyle & WS.EX.STATICEDGE) || (wnd.dwStyle & WS.BORDER)) {
            InflateRect(rect, -1, -1);
        }

        if ((wnd.dwStyle & WS.CAPTION) == WS.CAPTION) {
            // wnd.state |= WNDS_HASCAPTION;
            if (wnd.dwExStyle & WS.EX.TOOLWINDOW)
                rect.top += NtIntGetSystemMetrics(peb, SM.CYSMCAPTION);

            else
                rect.top += NtIntGetSystemMetrics(peb, SM.CYCAPTION);
        }

        // TODO: HMENUS
        // if (HAS_MENU(Wnd, Style))
        // {
        //     HDC hDC = UserGetDCEx(Wnd, 0, DCX_USESTYLE | DCX_WINDOW);
        //     wnd.state |= WNDS_HASMENU;
        //     if (hDC)
        //     {
        //         RECT CliRect = *Rect;
        //         CliRect.bottom -= OrigRect.top;
        //         CliRect.right -= OrigRect.left;
        //         CliRect.left -= OrigRect.left;
        //         CliRect.top -= OrigRect.top;
        //         if (!Suspended)
        //             Rect.top += MENU_DrawMenuBar(hDC, &CliRect, Wnd, TRUE);
        //         UserReleaseDC(Wnd, hDC, FALSE);
        //     }
        // }
        if (wnd.dwExStyle & WS.EX.CLIENTEDGE) {
            InflateRect(rect, -2 * NtIntGetSystemMetrics(peb, SM.CXBORDER), -2 * NtIntGetSystemMetrics(peb, SM.CYBORDER));
        }

        if (style & WS.VSCROLL) {
            if (rect.right - rect.left >= NtIntGetSystemMetrics(peb, SM.CXVSCROLL)) {
                // wnd.state |= WNDS_HASVERTICALSCROOLLBAR;
                /* rectangle is in screen coords when wparam is false */
                if (!wParam && (exStyle & WS.EX.LAYOUTRTL))
                    exStyle ^= WS.EX.LEFTSCROLLBAR;

                if ((exStyle & WS.EX.LEFTSCROLLBAR) != 0)
                    rect.left += NtIntGetSystemMetrics(peb, SM.CXVSCROLL);

                else
                    rect.right -= NtIntGetSystemMetrics(peb, SM.CXVSCROLL);
            }
        }

        if (style & WS.HSCROLL) {
            if (rect.bottom - rect.top > NtIntGetSystemMetrics(peb, SM.CYHSCROLL)) {
                // wnd.state |= WNDS_HASHORIZONTALSCROLLBAR;
                rect.bottom -= NtIntGetSystemMetrics(peb, SM.CYHSCROLL);
            }
        }

        if (rect.top > rect.bottom)
            rect.bottom = rect.top;

        if (rect.left > rect.right)
            rect.right = rect.left;
    }
    else {
        rect.right = rect.left;
        rect.bottom = rect.top;
    }

    return rect;
}

export async function NtDefNCLButtonUp(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
    const x = LOWORD(lParam);
    const y = HIWORD(lParam);
    const ht = wParam as HT;
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return 0;
    }

    const pRootElement = wnd.pRootElement as WindowElement;
    if (!pRootElement) {
        return 0;
    }

    switch (ht) {
        case HT.CLOSE:
            await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.SYSCOMMAND, SC.CLOSE, 0]);
            break;
        case HT.MINBUTTON:
            if (wnd.dwStyle & WS.ICONIC) {
                await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.SYSCOMMAND, SC.RESTORE, 0]);
            }
            else {
                await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.SYSCOMMAND, SC.MINIMIZE, 0]);
            }
            break;
        case HT.MAXBUTTON:
            if (wnd.dwStyle & WS.MAXIMIZE) {
                await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.SYSCOMMAND, SC.RESTORE, 0]);
            }
            else {
                await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.SYSCOMMAND, SC.MAXIMIZE, 0]);
            }
            break;
    }

    return 0;
}

export async function NtDefNCLButtonDown(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
    const x = LOWORD(lParam);
    const y = HIWORD(lParam);
    const ht = wParam as HT;
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return 0;
    }

    const pRootElement = wnd.pRootElement as WindowElement;
    if (!pRootElement) {
        return 0;
    }

    switch (ht) {
        case HT.CLOSE:
        case HT.MINBUTTON:
        case HT.MAXBUTTON:
            break;
        case HT.CAPTION: {
            if ((wnd.dwExStyle & WS.EX.NOACTIVATE) !== WS.EX.NOACTIVATE)
                NtUserSetActiveWindow(peb, wnd.hWnd);

            await NtDispatchMessage(peb, [hWnd, WM.SYSCOMMAND, SC.MOVE + HT.CAPTION, lParam]);
            break;
        }
        case HT.SYSMENU: {
            if (wnd.dwStyle & WS.SYSMENU)
                await NtDispatchMessage(peb, [hWnd, WM.SYSCOMMAND, SC.MOUSEMENU + HT.SYSMENU, lParam]);
            break;
        }
        case HT.MENU: {
            await NtDispatchMessage(peb, [hWnd, WM.SYSCOMMAND, SC.MOUSEMENU + HT.MENU, lParam]);
            break;
        }
        case HT.LEFT:
        case HT.RIGHT:
        case HT.TOP:
        case HT.BOTTOM:
        case HT.TOPLEFT:
        case HT.TOPRIGHT:
        case HT.BOTTOMLEFT:
        case HT.BOTTOMRIGHT: {
            await NtDispatchMessage(peb, [hWnd, WM.SYSCOMMAND, SC.SIZE + wParam - (HT.LEFT - WMSZ.LEFT), lParam]);
            break;
        }
    }

    return 0;
}


export function NtDefNCHitTest(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
    const x = LOWORD(lParam);
    const y = HIWORD(lParam);
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return HT.ERROR;
    }

    // wnd.stateFlags.overrides_NCHITTEST = false;
    const pRootElement = wnd.pRootElement as WindowElement;
    if (!pRootElement) {
        return HT.ERROR;
    }

    const domRect = pRootElement.getBoundingClientRect();
    const rect = { left: domRect.left, top: domRect.top, right: domRect.right, bottom: domRect.bottom };
    InflateRect(rect, 4, 4);

    if (!INRECT(x, y, rect)) {
        return HT.NOWHERE;
    }

    if (wnd.dwStyle & WS.CAPTION) {
        if (wnd.dwStyle & WS.MAXIMIZEBOX) {
            const maximizeRect = pRootElement.maximizeButton.getBoundingClientRect();
            if (INRECT(x, y, maximizeRect)) {
                return HT.MAXBUTTON;
            }
        }

        if (wnd.dwStyle & WS.MINIMIZEBOX) {
            const minimizeRect = pRootElement.minimizeButton.getBoundingClientRect();
            if (INRECT(x, y, minimizeRect)) {
                return HT.MINBUTTON;
            }
        }

        const closeRect = pRootElement.closeButton.getBoundingClientRect();
        if (INRECT(x, y, closeRect)) {
            return HT.CLOSE;
        }

        const titleBarRect = pRootElement.titleBar.getBoundingClientRect();
        if (INRECT(x, y, titleBarRect)) {
            return HT.CAPTION;
        }
    }

    // if the window is sizable, check the borders
    if (wnd.dwStyle & WS.SIZEBOX) {
        const borderSize = 4;
        const left = rect.left;
        const right = rect.right;
        const top = rect.top;
        const bottom = rect.bottom;

        if (x >= left && x <= left + borderSize) {
            if (y >= top && y <= top + borderSize) {
                return HT.TOPLEFT;
            }

            if (y >= bottom - borderSize && y <= bottom) {
                return HT.BOTTOMLEFT;
            }
        }

        if (x >= right - borderSize && x <= right) {
            if (y >= top && y <= top + borderSize) {
                return HT.TOPRIGHT;
            }

            if (y >= bottom - borderSize && y <= bottom) {
                return HT.BOTTOMRIGHT;
            }
        }

        if (x >= left && x <= left + borderSize) {
            if (y >= top && y <= bottom) {
                return HT.LEFT;
            }
        }

        if (x >= right - borderSize && x <= right) {
            if (y >= top && y <= bottom) {
                return HT.RIGHT;
            }
        }

        if (y >= top && y <= top + borderSize) {
            if (x >= left && x <= right) {
                return HT.TOP;
            }
        }

        if (y >= bottom - borderSize && y <= bottom) {
            if (x >= left && x <= right) {
                return HT.BOTTOM;
            }
        }
    }

    return HT.CLIENT;
}

export async function NtDoNCHitTest(wnd: WND, x: number, y: number) {
    if (!wnd.stateFlags.overrides_NCHITTEST) {
        return await NtDefWindowProc(wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x);
    }

    const { status, result } = await NtSendMessageTimeout(wnd.peb, [wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x], 10);
    if (status !== 0) // STATUS_TIMEOUT
        return await NtDefWindowProc(wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x);

    return result;
}
