import { HT, HWND, WM, WS } from "../subsystems/user32.js";
import { INRECT, InflateRect, OffsetRect, POINT } from "../subsystems/gdi32.js";
import { NtUserGetForegroundWindow, NtUserIntGetFocusMessageQueue, NtUserIntSetForegroundWindowMouse } from "./focus.js";
import { ObEnumHandlesByType, ObGetObject } from "../objects.js";

import DESKTOP from "./desktop.js";
import { NtPostMessage } from "./msg.js";
import { NtUserDoNCHitTest } from "./nc.js";
import { NtUserIsDesktopWindow } from "./window.js";
import { NtUserScreenToClient } from "./client.js";
import WND, { PWND } from "./wnd.js";
import { NtUserGetProcInfo } from "./shared.js";

let gCaptureElement: HTMLElement;
let gLastMouseMove = 0;
let gHitEatCount = 0;

export function NtUserInitInput() {
    window.addEventListener("pointerdown", NtOnPointerDown);
    window.addEventListener("pointermove", NtOnPointerMove);
    window.addEventListener("pointerup", NtOnPointerUp);
    window.addEventListener("pointercancel", NtOnPointerUp);
    window.addEventListener("keydown", (e) => {
        for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
            const desk = ObGetObject<DESKTOP>(hDesktop);
            if (!desk) continue;

            let peb = desk.pActiveProcess;
            if (!peb) continue;

            let pti = NtUserGetProcInfo(peb);
            if (!pti) continue;
            let wnd = ObGetObject<WND>(pti.hwndFocus);
            if (!wnd && pti.hwndActive)
                wnd = ObGetObject<WND>(pti.hwndActive);

            if (wnd) {
                peb = wnd.peb;
                pti = NtUserGetProcInfo(peb);
            }

            let msg = {
                hWnd: wnd?.hWnd || 0,
                message: WM.KEYDOWN,
                wParam: e.keyCode,
                lParam: 0,
                pt: { x: 0, y: 0 }
            }

            console.log("keydown", msg);

            NtPostMessage(peb, msg);
        }
    })

    window.addEventListener("keyup", (e) => {
        for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
            const desk = ObGetObject<DESKTOP>(hDesktop);
            if (!desk) continue;

            let peb = desk.pActiveProcess;
            if (!peb) continue;

            let pti = NtUserGetProcInfo(peb);
            if (!pti) continue;
            let wnd = ObGetObject<WND>(pti.hwndFocus);
            if (!wnd && pti.hwndActive)
                wnd = ObGetObject<WND>(pti.hwndActive);

            if (wnd) {
                peb = wnd.peb;
                pti = NtUserGetProcInfo(peb);
            }

            let msg = {
                hWnd: wnd?.hWnd || 0,
                message: WM.KEYUP,
                wParam: e.keyCode,
                lParam: 0,
                pt: { x: 0, y: 0 }
            }

            console.log("keyup", msg);

            NtPostMessage(peb, msg);
        }
    })
}

async function NtOnPointerDown(e: PointerEvent) {
    e.preventDefault();

    gCaptureElement = e.target as HTMLElement;
    gCaptureElement.setPointerCapture(e.pointerId);

    const x = Math.floor(e.clientX);
    const y = Math.floor(e.clientY);

    let wmc = WM.LBUTTONDOWN;
    let wmnc = WM.NCLBUTTONDOWN;
    if (e.button === 1) {
        wmc = WM.MBUTTONDOWN;
        wmnc = WM.NCMBUTTONDOWN;
    }
    else if (e.button === 2) {
        wmc = WM.RBUTTONDOWN;
        wmnc = WM.NCRBUTTONDOWN;
    }

    for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
        const desk = ObGetObject<DESKTOP>(hDesktop);
        if (!desk) continue;

        NtUserHitTestWindow(desk, x, y, (hWnd, result) =>
            OnHitWindowMouseDown(hWnd, x, y, result, wmc, wmnc));
    }
}

async function NtOnPointerMove(e: PointerEvent) {
    e.preventDefault();

    const x = Math.floor(e.clientX);
    const y = Math.floor(e.clientY);
    const now = performance.now();
    if (now - gLastMouseMove < 8)
        return;

    gLastMouseMove = now;

    for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
        const desk = ObGetObject<DESKTOP>(hDesktop);
        if (!desk) continue;

        NtUserHitTestWindow(desk, x, y, (hWnd, result) =>
            OnHitWindowMouseMove(result, x, y, hWnd));
    }
}

async function NtOnPointerUp(e: PointerEvent) {
    e.preventDefault();

    if (gCaptureElement)
        gCaptureElement.releasePointerCapture(e.pointerId);

    const x = Math.floor(e.clientX);
    const y = Math.floor(e.clientY);

    let wmc = WM.LBUTTONUP;
    let wmnc = WM.NCLBUTTONUP;
    if (e.button === 1) {
        wmc = WM.MBUTTONUP;
        wmnc = WM.NCMBUTTONUP;
    }
    else if (e.button === 2) {
        wmc = WM.RBUTTONUP;
        wmnc = WM.NCRBUTTONUP;
    }

    for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
        const desk = ObGetObject<DESKTOP>(hDesktop);
        if (!desk) continue;

        NtUserHitTestWindow(desk, x, y, (hWnd, result) =>
            OnHitWindowMouseUp(x, y, result, hWnd, wmc, wmnc));
    }
}

function OnHitWindowMouseUp(x: number, y: number, result: HT, hWnd: HWND, wmc: WM, wmnc: WM) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return;
    }

    // if (result === HT.CLIENT && gHitEatCount > 0) {
    //     gHitEatCount--;
    //     return;
    // }

    const point = { x, y };
    if (result === HT.CLIENT)
        NtUserScreenToClient(wnd, point);

    NtPostMessage(null, {
        hWnd,
        message: result === HT.CLIENT ? wmc : wmnc,
        wParam: result,
        lParam: (point.x << 16) + point.y,
        pt: { x, y }
    });
}

async function OnHitWindowMouseDown(hWnd: HWND, x: number, y: number, result: HT, wmc: WM, wmnc: WM) {
    const wnd = ObGetObject<WND>(hWnd);
    const peb = wnd?.peb || null;
    if (!wnd || !peb) {
        return;
    }

    // TODO: there's a lot wrong currently with activating windows

    // if (wnd && NtUserIsDesktopWindow(peb, wnd.wndParent))
    //     await NtUserIntSetForegroundWindowMouse(wnd)

    let topLevel: PWND = wnd;
    while (topLevel && !NtUserIsDesktopWindow(peb, topLevel.wndParent))
        topLevel = topLevel.wndParent;

    if (topLevel && (NtUserGetForegroundWindow() !== topLevel.hWnd)) {
        await NtUserIntSetForegroundWindowMouse(topLevel);
        // if (result === HT.CLIENT) {
        //     return;
        // }
    }

    // if (result === HT.CLIENT && gHitEatCount > 0) {
    //     gHitEatCount--;
    //     return;
    // }

    const point = { x, y };
    if (result === HT.CLIENT)
        NtUserScreenToClient(wnd, point);

    NtPostMessage(null, {
        hWnd,
        message: result === HT.CLIENT ? wmc : wmnc,
        wParam: result,
        lParam: (point.x << 16) + point.y,
        pt: { x, y }
    });
}

function OnHitWindowMouseMove(result: HT, x: number, y: number, hWnd: HWND) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return;

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

    const point = { x, y };
    if (result === HT.CLIENT)
        NtUserScreenToClient(wnd, point);

    NtPostMessage(null, {
        hWnd,
        message: result === HT.CLIENT ? WM.MOUSEMOVE : WM.NCMOUSEMOVE,
        wParam: result,
        lParam: (point.x << 16) + point.y,
        pt: { x, y }
    });
}

async function NtUserHitTestWindow(desk: DESKTOP, x: number, y: number, callback: (hWnd: HWND, result: HT) => void) {
    if (!desk) return;

    if (desk.hCaptureWindow) {
        const hWnd = desk.hCaptureWindow;
        callback(hWnd, HT.CLIENT);
        return;
    }

    const desktop = desk.hwndDesktop;
    const hWnd = await NtUserHitTestWindowRecursive({ x, y }, desktop, callback);
    console.log("NtUserHitTestWindow", ObGetObject<WND>(hWnd)?.lpszName);
}

async function NtUserHitTestWindowRecursive(lpPoint: POINT, hWnd: HWND, callback: (hWnd: HWND, result: HT) => void): Promise<HWND> {
    const pWnd = ObGetObject<WND>(hWnd);
    if (!pWnd)
        return -1;

    if ((pWnd.dwStyle & WS.VISIBLE) !== WS.VISIBLE ||
        (pWnd.dwStyle & WS.DISABLED) === WS.DISABLED)
        return -1;

    const rcWindow = pWnd.rcWindow;
    for (let pParent = pWnd.wndParent; pParent; pParent = pParent.wndParent) {
        if ((pParent.dwStyle & WS.VISIBLE) !== WS.VISIBLE ||
            (pParent.dwStyle & WS.DISABLED) === WS.DISABLED)
            break;

        OffsetRect(rcWindow, pParent.rcWindow.left + pParent.rcClient.left, pParent.rcWindow.top + pParent.rcClient.top);
    }

    if (!(pWnd.dwStyle & WS.CHILD))
        InflateRect(rcWindow, 4, 4); // inflate rect by 4px to make it easier to hit

    // not in the window rect, go away :D
    if (!INRECT(lpPoint.x, lpPoint.y, rcWindow))
        return -1;

    for (const child of pWnd.pChildren) {
        const ret = await NtUserHitTestWindowRecursive(lpPoint, child, callback);
        if (ret !== -1) {
            return ret;
        }
    }

    const result = <HT>await NtUserDoNCHitTest(pWnd, lpPoint.x, lpPoint.y);
    if (result !== HT.TRANSPARENT && result !== HT.NOWHERE && result !== HT.ERROR) {
        callback(hWnd, result);
        return hWnd;
    }

    return -1;
}