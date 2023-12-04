import { HT, HWND, WM, WS } from "../types/user32.types.js";
import { INRECT, InflateRect, OffsetRect, POINT } from "../types/gdi32.types.js";
import { ObEnumHandlesByType, ObGetObject } from "../objects.js";

import DESKTOP from "./desktop.js";
import { NtPostMessage } from "./msg.js";
import { NtUserActivateWindow } from "./focus.js";
import { NtUserDoNCHitTest } from "./nc.js";
import { NtUserIsDesktopWindow } from "./window.js";
import { NtUserScreenToClient } from "./client.js";
import WND from "./wnd.js";

let captureElement: HTMLElement;
let lastMouseMove = 0;

export function NtInitInput() {
    window.addEventListener("pointerdown", NtOnPointerDown);
    window.addEventListener("pointermove", NtOnPointerMove);
    window.addEventListener("pointerup", NtOnPointerUp);
    window.addEventListener("pointercancel", NtOnPointerUp);
}

async function NtOnPointerDown(e: PointerEvent) {
    e.preventDefault();

    captureElement = e.target as HTMLElement;
    captureElement.setPointerCapture(e.pointerId);

    const x = e.clientX;
    const y = e.clientY;

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

    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    if (now - lastMouseMove < 8)
        return;

    lastMouseMove = now;

    for (const hDesktop of ObEnumHandlesByType("DESKTOP")) {
        const desk = ObGetObject<DESKTOP>(hDesktop);
        if (!desk) continue;

        NtUserHitTestWindow(desk, x, y, (hWnd, result) =>
            OnHitWindowMouseMove(result, x, y, hWnd));
    }
}

async function NtOnPointerUp(e: PointerEvent) {
    e.preventDefault();

    if (captureElement)
        captureElement.releasePointerCapture(e.pointerId);

    const x = e.clientX;
    const y = e.clientY;

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
    const peb = wnd?.peb;

    // TODO: there's a lot wrong currently with activating windows
    if (wnd && NtUserIsDesktopWindow(peb, wnd.wndParent))
        await NtUserActivateWindow(peb, wnd.hWnd, 1)

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
    for (let pParent = ObGetObject<WND>(pWnd.hParent); pParent; pParent = ObGetObject<WND>(pParent.hParent)) {
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

    const result = await NtUserDoNCHitTest(pWnd, lpPoint.x, lpPoint.y);
    if (result !== HT.TRANSPARENT && result !== HT.NOWHERE && result !== HT.ERROR) {
        callback(hWnd, result);
        return hWnd;
    }

    return -1;
}