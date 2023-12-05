import { HIWORD, HT, HWND, LOWORD, LPARAM, LRESULT, MA, MSG, SC, SW, VK, WA, WM, WPARAM, WS } from "../types/user32.types.js";
import { NtDefNCLButtonDown, NtDefNCLButtonUp, NtUserDefNCHitTest } from "./nc.js";
import { WMP, WND_DATA } from "../types/user32.int.types.js";

import { NtDefCalcNCSizing } from "./nc.js";
import { NtDefWndDoSizeMove } from "./sizemove.js";
import { NtDestroyWindow } from "./window.js";
import { NtDispatchMessage } from "./msg.js";
import { NtUserGetProcInfo } from "./shared.js";
import { NtUserShowWindow } from "./wndpos.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import WND from "./wnd.js";
import WindowElement from "./html/WindowElement.js";
import WindowElementBase from "./html/WindowElementBase.js";

export function HasThickFrame(dwStyle: number) {
    return (dwStyle & WS.THICKFRAME) === WS.THICKFRAME && !((dwStyle & (WS.DLGFRAME | WS.BORDER)) === WS.DLGFRAME);
}

export async function NtDefWindowProc(hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    if (Msg > WM.USER && Msg < WMP.CREATEELEMENT) // not for us!
        return 0;

    const mark = performance.now();
    try {
        const wnd = ObGetObject<WND>(hWnd);
        if (!wnd) {
            return -1;
        }

        const peb = wnd.peb;
        const state = NtUserGetProcInfo(peb);
        if (!state) {
            console.warn("User32 not initialized");
            return 0;
        }

        switch (Msg) {
            case WMP.CREATEELEMENT:
                return await NtDefCreateElement(peb, hWnd, Msg, wParam, lParam);
            case WMP.ADDCHILD:
                return await NtDefAddChild(hWnd, wParam);
            case WMP.REMOVECHILD:
                return await NtDefRemoveChild(hWnd, wParam);
            case WMP.UPDATEWINDOWSTYLE:
                return await NtDefUpdateWindowStyle(peb, hWnd, wParam, lParam);
            case WM.NCCALCSIZE:
                return NtDefCalcNCSizing(peb, hWnd, Msg, wParam, lParam);
            case WM.NCHITTEST:
                return NtUserDefNCHitTest(peb, hWnd, Msg, wParam, lParam);
            case WM.NCLBUTTONDOWN:
                return await NtDefNCLButtonDown(peb, hWnd, Msg, wParam, lParam);
            case WM.NCLBUTTONUP:
                return await NtDefNCLButtonUp(peb, hWnd, Msg, wParam, lParam);
            case WM.CLOSE:
                await NtDestroyWindow(peb, hWnd);
                return 0;
            case WM.SYSCOMMAND:
                return await NtDefWndHandleSysCommand(peb, wnd, wParam, lParam);
            case WM.GETMINMAXINFO:
                return lParam;
            case WM.QUERYOPEN:
                return true;
            case WM.NCACTIVATE:
                return NtDefNcActivate(hWnd, wParam, lParam);
            case WM.ACTIVATE:
                if (LOWORD(wParam) != WA.INACTIVE && !(wnd.dwStyle & WS.MINIMIZE)) {
                    // await NtUserSetFocus(wnd);
                }
                break;
            case WM.MOUSEACTIVATE: {
                if (wnd.dwStyle & WS.CHILD) {
                    let parent = ObGetObject<WND>(wnd.hParent);
                    if (parent) {
                        return await NtDispatchMessage(peb, [parent.hWnd, WM.MOUSEACTIVATE, wParam, lParam]);
                    }
                }

                return ((HIWORD(lParam) == WM.LBUTTONDOWN && LOWORD(lParam) == HT.CAPTION) ? MA.NOACTIVATE : MA.ACTIVATE);
            }
        }
    }
    finally {
        performance.measure(`NtDefWindowProc:0x${Msg.toString(16)}`, { start: mark, end: performance.now() });
    }

    return 0; // TODO
}

export function NtDefNcActivate(hWnd: HWND, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    if (wParam) {
        wnd.stateFlags.bIsActiveFrame = true;
    }
    else {
        wnd.stateFlags.bIsActiveFrame = false;
    }

    // update styles
    const pRootElement = wnd.pRootElement as WindowElementBase;
    pRootElement.invalidateStyle();

    return true;
}

export function NtDefAddChild(hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if (wnd.pRootElement) {
        wnd.pRootElement.appendChild(childWnd.pRootElement);
    }

    return 0;
}

export function NtDefRemoveChild(hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if (wnd.pRootElement) {
        wnd.pRootElement.removeChild(childWnd.pRootElement);
    }

    return 0;
}

function NtDefCreateElement(peb: PEB, hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const state = NtUserGetProcInfo(peb);
    if (!state) {
        console.warn("User32 not initialized");
        return 0;
    }

    const wnd = ObGetObject<WND>(hWnd);

    let data = wnd.data as WND_DATA;
    if (!data) {
        data = wnd.data = {
            pTitleBar: null,
            pTitleBarText: null,
            pTitleBarControls: null,
            pCloseButton: null,
            pMinimizeButton: null,
            pMaximizeButton: null
        };
    }

    const pRootElement = new WindowElement(wnd);
    pRootElement.title = wnd.lpszName;
    pRootElement.dwStyle = wnd.dwStyle.toString();
    wnd.pRootElement = pRootElement;
    return 1;
}

function NtDefUpdateWindowStyle(peb: PEB, hWnd: HWND, dwNewStyle: number, dwOldStyle: number): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    const pRootElement = wnd.pRootElement as WindowElement;
    if (!pRootElement) {
        return -1;
    }

    pRootElement.dwStyle = dwNewStyle.toString();
    return 0;
}

async function NtDefWndHandleSysCommand(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    // console.log(`NtDefWndHandleSysCommand: probably ${SC[wParam & 0xFFF0]}`);
    switch (wParam & 0xFFF0) {
        case SC.MINIMIZE:
            await NtUserShowWindow(peb, wnd.hWnd, SW.MINIMIZE);
            return 0;
        case SC.MAXIMIZE:
            await NtUserShowWindow(peb, wnd.hWnd, SW.MAXIMIZE);
            return 0;
        case SC.RESTORE:
            await NtUserShowWindow(peb, wnd.hWnd, SW.RESTORE);
            return 0;
        case SC.CLOSE:
            await NtDispatchMessage(peb, [wnd.hWnd, WM.CLOSE, 0, 0]);
            return 0;
        case SC.MOVE:
        case SC.SIZE:
            await NtDefWndDoSizeMove(peb, wnd, wParam, lParam);
            break;
    }

    return 0; // TODO
}


