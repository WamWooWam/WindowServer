import { ObEnumHandlesByType, ObGetObject, ObSetObject } from "../objects.js";
import { HANDLE, PEB } from "../types/types.js";
import { CREATE_DESKTOP, CREATE_WINDOW_EX, WMP } from "../types/user32.int.types.js";
import { HT, HWND, HWND_TOP, SM, SW, SWP, WM, WS } from "../types/user32.types.js";
import { NtDefWindowProc } from "./def.js";;
import DesktopElement from "./html/DesktopElement.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { GetW32ProcInfo, W32PROCINFO } from "./shared.js";
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
        nWidth: NtIntGetSystemMetrics(peb, SM.CXSCREEN),
        nHeight: NtIntGetSystemMetrics(peb, SM.CYSCREEN),
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

    await NtUserShowWindow(hWnd, SW.SHOWDEFAULT)

    const desktop = new DESKTOP();
    desktop.dwSessionId = 0;
    desktop.hwndDesktop = hWnd;
    desktop.lpszDesktop = pDeskParams.lpszDesktop;
    desktop.pActiveProcess = peb;

    const hDesktop = ObSetObject(desktop, "DESKTOP", 0);
    peb.hDesktop = hDesktop;

    return hDesktop;
}


export async function NtUserDesktopWndProc(hWnd: HWND, msg: number, wParam: number, lParam: number): Promise<number> {
    const wnd = ObGetObject<WND>(hWnd);
    const peb = wnd.peb;
    switch (msg) {
        case WMP.CREATEELEMENT: {
            NtUserDesktopCreateElement(peb, wnd);
            break;
        }
        case WM.DISPLAYCHANGE: {
            const screenW = NtIntGetSystemMetrics(peb, SM.CXSCREEN);
            const screenH = NtIntGetSystemMetrics(peb, SM.CYSCREEN);

            console.log("WM_DISPLAYCHANGE", screenW, screenH);

            NtSetWindowPos(peb, hWnd, 0, 0, 0, screenW, screenH, SWP.NOZORDER | SWP.NOACTIVATE | SWP.FRAMECHANGED);
            break;
        }
        case WM.NCHITTEST: {
            return HT.CLIENT;
        }
        case WM.QUIT: {
            return; // ignore quit messages
        }
        default:
            return await NtDefWindowProc(hWnd, msg, wParam, lParam);
    }
}


function NtUserDesktopCreateElement(peb: PEB, wnd: WND) {
    const pRootElement = new DesktopElement();
    wnd.pRootElement = pRootElement;

    document.body.appendChild(pRootElement);
}