import { ObGetObject, ObSetObject } from "../objects.js";
import { HANDLE, PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import { CREATE_DESKTOP, CREATE_WINDOW_EX, HWND, SM, SWP, WM, WS } from "../types/user32.types.js";
import { NtDefWindowProc } from "./def.js";
import { GreRectangle } from "./gdi/draw.js";
import { NtGdiDeleteObject, NtGdiRectangle } from "./gdi/ntgdi.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtCreateWindowEx, NtIntGetClientRect, NtSetWindowPos, NtUserGetDC } from "./window.js";
import { WND } from "./wnd.js";

export default interface DESKTOP {
    dwSessionId: number;
    hDesktop: HWND;
    lpszDesktop: string;
    hActiveWindow: HWND;
}

export async function NtUserCreateDesktop(peb: PEB, pDeskParams: CREATE_DESKTOP): Promise<HANDLE> {
    const cs: CREATE_WINDOW_EX = {
        x: 0,
        y: 0,
        nWidth: NtIntGetSystemMetrics(SM.CXSCREEN),
        nHeight: NtIntGetSystemMetrics(SM.CYSCREEN),
        dwStyle: WS.POPUP | WS.CLIPCHILDREN,
        dwExStyle: 0,
        hInstance: 0,
        hMenu: 0,
        hWndParent: 0,
        lpClassName: <string><any>0x8001,
        lpWindowName: pDeskParams.lpszDesktop,
        lpParam: 0,
    };

    const hWnd = await NtCreateWindowEx(peb, cs);
    if (!hWnd) {
        console.error("NtCreateWindowEx failed");
        return null;
    }

    const desktop: DESKTOP = {
        dwSessionId: 0,
        hDesktop: hWnd,
        lpszDesktop: pDeskParams.lpszDesktop,
        hActiveWindow: 0
    };

    const hDesktop = ObSetObject(desktop, "DESKTOP", 0);
    return hDesktop;
}

export function NtUserSetActiveWindow(hWnd: HWND): HWND {
    const desktop = ObGetObject<DESKTOP>(hWnd);
    if (!desktop) {
        return null;
    }

    const newWnd = ObGetObject<WND>(hWnd);
    if ((newWnd.dwStyle & (WS.POPUP | WS.CHILD)) === WS.CHILD) {
        return null; // child windows cannot be active, only top level windows
    }

    if (newWnd) {
        newWnd.dwStyle |= WS.ACTIVE;
    }

    const oldActiveWindow = desktop.hActiveWindow;
    const oldWnd = ObGetObject<WND>(oldActiveWindow);
    if (oldWnd) {
        oldWnd.dwStyle &= ~WS.ACTIVE;
    }


    desktop.hActiveWindow = hWnd;
    return oldActiveWindow;
}

export function NtUserDesktopWndProc(hWnd: HWND, msg: number, wParam: number, lParam: number): Promise<number> {
    const wnd = ObGetObject<WND>(hWnd);
    const peb = wnd.peb;
    switch (msg) {
        case WMP.CREATEELEMENT: {
            NtUserDesktopCreateElement(wnd);
            break;
        }
        case WM.DISPLAYCHANGE: {
            const screenW = NtIntGetSystemMetrics(SM.CXSCREEN);
            const screenH = NtIntGetSystemMetrics(SM.CYSCREEN);

            console.log("WM_DISPLAYCHANGE", screenW, screenH);

            NtSetWindowPos(peb, hWnd, 0, 0, 0, screenW, screenH, SWP.NOZORDER | SWP.NOACTIVATE | SWP.FRAMECHANGED);
            break;
        }
        default:
            return NtDefWindowProc(hWnd, msg, wParam, lParam);
    }
}

function NtUserDesktopCreateElement(wnd: WND) {
    const pRootElement = document.createElement("desktop");
    wnd.pRootElement = pRootElement;

    // we need to bubble events up to windows via window messages

}