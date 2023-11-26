import { ObEnumObjectsByType, ObGetObject, ObSetObject } from "../objects.js";
import { INRECT, InflateRect } from "../types/gdi32.types.js";
import { HANDLE, PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import { CREATE_DESKTOP, CREATE_WINDOW_EX, HT, HWND, HWND_TOP, HWND_TOPMOST, SM, SW, SWP, WM, WS } from "../types/user32.types.js";
import { NtDefWindowProc } from "./def.js";;
import DesktopElement from "./html/DesktopElement.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtPostMessage } from "./msg.js";
import { NtCreateWindowEx, NtDoNCHitTest, NtGetDesktopWindow, NtSetWindowPos, NtShowWindow } from "./window.js";
import { WND } from "./wnd.js";

// export default interface DESKTOP {
//     dwSessionId: number;
//     hwndDesktop: HWND;
//     lpszDesktop: string;
//     hActiveWindow: HWND;
//     hWindowOrder: HWND[];
//     hCaptureWindow?: HWND;
// }

export default class DESKTOP {
    dwSessionId: number;
    hwndDesktop: HWND;
    lpszDesktop: string;
    hActiveWindow: HWND;
    hCaptureWindow?: HWND;

    public static async CreateDesktop(peb: PEB, pDeskParams: CREATE_DESKTOP): Promise<HANDLE> {
        const desktop = await NtUserCreateDesktop(peb, pDeskParams);
        return desktop;
    }
}

export function NtGetDefaultDesktop(): HANDLE {
    const desktop = [...ObEnumObjectsByType("DESKTOP")][0];
    return desktop;
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

    await NtShowWindow(peb, hWnd, SW.SHOWDEFAULT)

    const desktop = new DESKTOP();
    desktop.dwSessionId = 0;
    desktop.hwndDesktop = hWnd;
    desktop.lpszDesktop = pDeskParams.lpszDesktop;
    desktop.hActiveWindow = hWnd;
    
    const hDesktop = ObSetObject(desktop, "DESKTOP", 0);
    peb.hDesktop = hDesktop;

    return hDesktop;
}

export async function NtUserSetActiveWindow(peb: PEB, hWnd: HWND): Promise<HWND> {
    const desktop = ObGetObject<DESKTOP>(peb.hDesktop);
    if (!desktop) {
        return null;
    }

    if (hWnd === desktop.hwndDesktop) {
        return null;
    }

    if (hWnd === desktop.hActiveWindow) {
        return hWnd;
    }

    const newWnd = ObGetObject<WND>(hWnd);
    if ((newWnd.dwStyle & (WS.POPUP | WS.CHILD)) === WS.CHILD) {
        return null; // child windows cannot be active, only top level windows
    }

    const oldActiveWindow = desktop.hActiveWindow;
    const oldWnd = ObGetObject<WND>(oldActiveWindow);
    if (oldWnd) {
        oldWnd.dwStyle &= ~WS.ACTIVE;
    }

    if (newWnd) {
        newWnd.dwStyle |= WS.ACTIVE;
    }

    await NtSetWindowPos(peb, hWnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE | SWP.NOACTIVATE)

    desktop.hActiveWindow = hWnd;
    return oldActiveWindow;
}

export async function NtUserDesktopWndProc(hWnd: HWND, msg: number, wParam: number, lParam: number): Promise<number> {
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
        case WM.NCHITTEST: {
            return HT.CLIENT;
        }
        default:
            return await NtDefWindowProc(hWnd, msg, wParam, lParam);
    }
}

let lastMouseMove = 0;
function NtUserDesktopCreateElement(wnd: WND) {
    const pRootElement = new DesktopElement();
    wnd.pRootElement = pRootElement;

    let captureElement: HTMLElement = null;

    // we need to bubble events up to windows via window messages
    window.addEventListener("pointermove", async (e) => {
        // debounce to ~125hz
        const now = performance.now();
        if (lastMouseMove && now - lastMouseMove < 8) {
            return;
        }

        lastMouseMove = now;

        const x = e.clientX;
        const y = e.clientY;

        NtUserHitTestWindow(wnd.peb, x, y, (hWnd, result) => {
            NtPostMessage(wnd.peb, {
                hWnd,
                message: result === HT.CLIENT ? WM.MOUSEMOVE : WM.NCMOUSEMOVE,
                wParam: result,
                lParam: (x << 16) + y,
                pt: { x, y }
            });
        });
    });

    window.addEventListener("pointerdown", async (e) => {
        captureElement = e.target as HTMLElement;
        captureElement.setPointerCapture(e.pointerId);

        const x = e.clientX;
        const y = e.clientY;

        let wmc = WM.LBUTTONDOWN;
        let wmnc = WM.NCLBUTTONDOWN;
        switch (e.button) {
            case 0:
                wmc = WM.LBUTTONDOWN;
                wmnc = WM.NCLBUTTONDOWN;
                break;
            case 1:
                wmc = WM.MBUTTONDOWN;
                wmnc = WM.NCMBUTTONDOWN;
                break;
            case 2:
                wmc = WM.RBUTTONDOWN;
                wmnc = WM.NCRBUTTONDOWN;
                break;
        }

        NtUserHitTestWindow(wnd.peb, x, y, (hWnd, result) => {
            NtPostMessage(wnd.peb, {
                hWnd,
                message: result === HT.CLIENT ? wmc : wmnc,
                wParam: result,
                lParam: (x << 16) + y,
                pt: { x, y }
            });
        });
    });

    window.addEventListener("pointerup", async (e) => {
        if (captureElement)
            captureElement.releasePointerCapture(e.pointerId);

        const x = e.clientX;
        const y = e.clientY;

        let wmc = WM.LBUTTONUP;
        let wmnc = WM.NCLBUTTONUP;
        switch (e.button) {
            case 0:
                wmc = WM.LBUTTONUP;
                wmnc = WM.NCLBUTTONUP;
                break;
            case 1:
                wmc = WM.MBUTTONUP;
                wmnc = WM.NCMBUTTONUP;
                break;
            case 2:
                wmc = WM.RBUTTONUP;
                wmnc = WM.NCRBUTTONUP;
                break;
        }

        NtUserHitTestWindow(wnd.peb, x, y, (hWnd, result) => {
            NtPostMessage(wnd.peb, {
                hWnd,
                message: result === HT.CLIENT ? wmc : wmnc,
                wParam: result,
                lParam: (x << 16) + y,
                pt: { x, y }
            });
        });
    });

    window.addEventListener("dblclick", async (e) => {
        const x = e.clientX;
        const y = e.clientY;

        NtUserHitTestWindow(wnd.peb, x, y, (hWnd, result) => {
            if (result === HT.CLIENT) {
                NtPostMessage(wnd.peb, [hWnd, WM.LBUTTONDBLCLK, 0, (x << 16) + y]);
            }
            else {
                NtPostMessage(wnd.peb, [hWnd, WM.NCLBUTTONDBLCLK, result, (x << 16) + y]);
            }
        });
    });
}

async function NtUserHitTestWindow(peb: PEB, x: number, y: number, callback: (hWnd: HWND, result: HT) => void) {
    const desk = ObGetObject<DESKTOP>(peb.hDesktop);
    if (desk.hCaptureWindow) {
        const hWnd = desk.hCaptureWindow;
        callback(hWnd, HT.CLIENT);
        return;
    }
    else {
    }

    const desktop = NtGetDesktopWindow(peb);
    const desktopWnd = ObGetObject<WND>(desktop);
    const wnds = [...desktopWnd.children, desktop];
    // the order of children of the desktop window should be the z-order, we need to preserve this
    for (const hWnd of wnds) {
        const wnd = ObGetObject<WND>(hWnd);

        // if the window is a child, invisible, disabled, or iconic, skip it
        if ((wnd.dwStyle & (WS.CHILD | WS.POPUP)) === WS.CHILD ||
            (wnd.dwStyle & WS.VISIBLE) !== WS.VISIBLE ||
            (wnd.dwStyle & WS.DISABLED) === WS.DISABLED ||
            (wnd.dwStyle & WS.ICONIC) === WS.ICONIC)
            continue;

        const rcWindow = { ...wnd.rcWindow };

        InflateRect(rcWindow, 4, 4); // inflate rect by 4px to make it easier to hit
        if (INRECT(x, y, rcWindow)) {
            // TODO: i assume we should look at rcClient here, but it isn't fully implemented yet
            const result = await NtDoNCHitTest(wnd, x, y);
            if (result !== HT.TRANSPARENT && result !== HT.NOWHERE && result !== HT.ERROR) {
                // for now, we do cursor changes here
                // TODO: this should be done in the window proc
                switch (result) {
                    case HT.TOP:
                    case HT.BOTTOM:
                        document.body.style.cursor = "ns-resize";
                        break;
                    case HT.LEFT:
                    case HT.RIGHT:
                        document.body.style.cursor = "ew-resize";
                        break;
                    case HT.TOPLEFT:
                    case HT.BOTTOMRIGHT:
                        document.body.style.cursor = "nwse-resize";
                        break;
                    case HT.TOPRIGHT:
                    case HT.BOTTOMLEFT:
                        document.body.style.cursor = "nesw-resize";
                        break;
                    default:
                        document.body.style.cursor = "default";
                        break;
                }

                callback(hWnd, result);
                return;
            }
        }
    }
}