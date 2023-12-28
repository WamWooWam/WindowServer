import { ObEnumHandlesByType, ObGetObject, ObSetObject } from "../objects.js";
import { HANDLE, PEB } from "ntos-sdk/types/types.js";
import { CREATE_DESKTOP, CREATE_WINDOW_EX, WMP, HT, HWND, LPARAM, LRESULT, SM, SW, SWP, WM, WPARAM, WS } from "../subsystems/user32.js";
import { NtDefWindowProc } from "./def.js";;
import DesktopElement from "./html/DesktopElement.js";
import { NtUserGetSystemMetrics } from "./metrics.js";
import { NtCreateWindowEx } from "./window.js";
import WND from "./wnd.js";
import { NtSetWindowPos, NtUserShowWindow } from "./wndpos.js";

// export default interface DESKTOP {
//     dwSessionId: number;
//     hwndDesktop: HWND;
//     lpszDesktop: string;
//     hActiveWindow: HWND;
//     hWindowOrder: HWND[];
//     hCaptureWindow?: HWND;
// }

// TODO: implement hWindowOrder
export default class DESKTOP {
    dwSessionId: number;
    hwndDesktop: HWND;
    lpszDesktop: string;
    hCaptureWindow?: HWND;

    pActiveProcess: PEB;
}

export function NtGetDefaultDesktop(): HANDLE {
    const desktop = [...ObEnumHandlesByType("DESKTOP")][0];
    return desktop;
}

export async function NtUserCreateDesktop(peb: PEB, pDeskParams: CREATE_DESKTOP): Promise<HANDLE> {
    const cs: CREATE_WINDOW_EX = {
        x: 0,
        y: 0,
        nWidth: NtUserGetSystemMetrics(peb, SM.CXSCREEN),
        nHeight: NtUserGetSystemMetrics(peb, SM.CYSCREEN),
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
        return 0;
    }

    await NtUserShowWindow(peb, hWnd, SW.SHOWDEFAULT)

    const desktop = new DESKTOP();
    desktop.dwSessionId = 0;
    desktop.hwndDesktop = hWnd;
    desktop.lpszDesktop = pDeskParams.lpszDesktop;
    desktop.pActiveProcess = peb;

    const hDesktop = ObSetObject(desktop, "DESKTOP", 0);
    peb.hDesktop = hDesktop;

    return hDesktop;
}


export async function NtUserDesktopWndProc(hWnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        console.error("NtUserDesktopWndProc: wnd not found");
        return 0;
    }

    const peb = wnd.peb;
    switch (msg) {
        case WMP.CREATEELEMENT: {
            NtUserDesktopCreateElement(peb, wnd);
            break;
        }
        case WM.DISPLAYCHANGE: {
            const screenW = NtUserGetSystemMetrics(peb, SM.CXSCREEN);
            const screenH = NtUserGetSystemMetrics(peb, SM.CYSCREEN);

            console.log("WM_DISPLAYCHANGE", screenW, screenH);

            NtSetWindowPos(peb, hWnd, 0, 0, 0, screenW, screenH, SWP.NOZORDER | SWP.NOACTIVATE | SWP.FRAMECHANGED);
            break;
        }
        case WM.NCHITTEST: {
            return HT.CLIENT;
        }
        case WM.QUIT: {
            return 0; // ignore quit messages
        }
        default:
            return await NtDefWindowProc(hWnd, msg, wParam, lParam);
    }

    return 0;
}


function NtUserDesktopCreateElement(peb: PEB, wnd: WND) {
    const pRootElement = new DesktopElement();
    wnd.pRootElement = pRootElement;

    document.body.appendChild(pRootElement);
}