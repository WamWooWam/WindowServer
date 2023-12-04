import { HT, LPARAM, SC, SM, SWP, VK, WM, WMSZ, WPARAM, WS } from "../types/user32.types.js";
import { NtUserGetCapture, NtUserGetCursorPos, NtUserReleaseCapture, NtUserSetCapture } from "./cursor.js";
import { NtUserGetClientRect, NtUserMapWindowPoints, NtUserWinPosGetMinMaxInfo } from "./window.js";
import { OffsetRect, POINT, RECT } from "../types/gdi32.types.js";

import { HasThickFrame } from "./def.js";
import { NtDispatchMessage } from "./msg.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtSetWindowPos } from "./wndpos.js";
import { NtUserDoNCHitTest } from "./nc.js";
import { NtUserGetProcInfo } from "./shared.js";
import { NtUserGetSystemMetrics } from "./metrics.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import WND from "./wnd.js";
import WindowElement from "./html/WindowElement.js";

export async function NtDefWndDoSizeMove(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM) {
    const pRootElement = wnd.pRootElement as WindowElement;
    if (!pRootElement) {
        return;
    }

    const sysCommand = wParam & 0xFFF0;
    let hitTest = wParam & 0xF;

    const style = wnd.dwStyle;
    const exStyle = wnd.dwExStyle;

    const isIconic = (style & WS.ICONIC) === WS.ICONIC;
    const isMaximized = (style & WS.MAXIMIZE) === WS.MAXIMIZE;

    if ((isMaximized) || !IntIsWindowVisible(wnd)) {
        return;
    }

    const cursorPos = NtUserGetCursorPos(peb);
    let capturePoint = { ...cursorPos };

    if (sysCommand === SC.MOVE) {
        if (!hitTest)
            hitTest = await DefWndStartSizeMove(peb, wnd, wParam, capturePoint);
        if (!hitTest)
            return; // bail
    }
    else { // SC_SIZE
        if (!HasThickFrame(style))
            return; // bail, no thick frame

        if (hitTest && (sysCommand !== SC.MOUSEMENU)) {
            hitTest += (HT.LEFT - WMSZ.LEFT);
        }
        else {
            NtUserSetCapture(peb, wnd.hWnd);
            hitTest = await DefWndStartSizeMove(peb, wnd, wParam, capturePoint);
            if (!hitTest) {
                NtUserReleaseCapture(peb);
                return; // bail
            }
        }
    }

    let minTrack = { cx: 0, cy: 0 };
    let maxTrack = { cx: 0, cy: 0 };

    await NtUserWinPosGetMinMaxInfo(peb, wnd, null, null, minTrack, maxTrack);

    let sizingRect = wnd.rcWindow as RECT;
    let mouseRect = { left: 0, top: 0, right: 0, bottom: 0 };
    let origRect = { ...sizingRect };
    let unmodRect = { ...sizingRect };

    if (style & WS.CHILD) {
        let pWndParent = ObGetObject<WND>(wnd.hParent);
        mouseRect = NtUserGetClientRect(peb, pWndParent.hWnd);
        let clientPoints = [{ x: mouseRect.left, y: mouseRect.top }, { x: mouseRect.right, y: mouseRect.bottom }];
        let sizingPoints = [{ x: sizingRect.left, y: sizingRect.top }, { x: sizingRect.right, y: sizingRect.bottom }];

        NtUserMapWindowPoints(pWndParent, null, clientPoints);
        NtUserMapWindowPoints(null, pWndParent, sizingPoints);

        sizingRect = { left: sizingPoints[0].x, top: sizingPoints[0].y, right: sizingPoints[1].x, bottom: sizingPoints[1].y };
        mouseRect = { left: clientPoints[0].x, top: clientPoints[0].y, right: clientPoints[1].x, bottom: clientPoints[1].y };
        unmodRect = { ...sizingRect };
    }
    else {
        if (!(wnd.dwExStyle & WS.EX.TOPMOST)) {
            mouseRect = { ...NtGetPrimaryMonitor().rcWork };
        }
        else {
            mouseRect = { ...NtGetPrimaryMonitor().rcMonitor };
        }
        unmodRect = { ...sizingRect };
    }

    if (hitTest === HT.LEFT || hitTest === HT.TOPLEFT || hitTest === HT.BOTTOMLEFT) {
        mouseRect.left = Math.max(mouseRect.left, sizingRect.right - maxTrack.cx + capturePoint.x - sizingRect.left);
        mouseRect.right = Math.min(mouseRect.right, sizingRect.right - minTrack.cx + capturePoint.x - sizingRect.left);
    }
    else if (hitTest === HT.RIGHT || hitTest === HT.TOPRIGHT || hitTest === HT.BOTTOMRIGHT) {
        mouseRect.left = Math.max(mouseRect.left, sizingRect.left + minTrack.cx + capturePoint.x - sizingRect.right);
        mouseRect.right = Math.min(mouseRect.right, sizingRect.left + maxTrack.cx + capturePoint.x - sizingRect.right);
    }
    if (hitTest === HT.TOP || hitTest === HT.TOPLEFT || hitTest === HT.TOPRIGHT) {
        mouseRect.top = Math.max(mouseRect.top, sizingRect.bottom - maxTrack.cy + capturePoint.y - sizingRect.top);
        mouseRect.bottom = Math.min(mouseRect.bottom, sizingRect.bottom - minTrack.cy + capturePoint.y - sizingRect.top);
    }
    else if (hitTest === HT.BOTTOM || hitTest === HT.BOTTOMLEFT || hitTest === HT.BOTTOMRIGHT) {
        mouseRect.top = Math.max(mouseRect.top, sizingRect.top + minTrack.cy + capturePoint.y - sizingRect.bottom);
        mouseRect.bottom = Math.min(mouseRect.bottom, sizingRect.top + maxTrack.cy + capturePoint.y - sizingRect.bottom);
    }

    if (isIconic) {
        // query drag icon??
    }

    await NtDispatchMessage(peb, [wnd.hWnd, WM.ENTERSIZEMOVE, 0, 0]);

    if (NtUserGetCapture(peb) !== wnd.hWnd) {
        NtUserSetCapture(peb, wnd.hWnd);
    }

    let moved = false;

    while (true) {
        const state = NtUserGetProcInfo(peb);
        if (!state) {
            console.warn("User32 not initialized");
            return 0;
        }

        let dx = 0, dy = 0;

        // look at me. i am the message loop now.
        let msg = await state.lpMsgQueue.GetMessage(wnd.hWnd, 0, 0);
        if (msg.message === WM.QUIT) break;

        // console.log("NtDefWndDoSizeMove: got message", msg);
        if (msg.message === WM.KEYDOWN && (msg.wParam == VK.RETURN || msg.wParam == VK.ESCAPE))
            break;

        if (msg.message === WM.LBUTTONUP) {
            break; // TOOD: snapping :3
        }

        if (msg.message !== WM.MOUSEMOVE && msg.message !== WM.KEYDOWN) {
            // await NtTranslateMessage(peb, msg);
            await NtDispatchMessage(peb, msg);
            continue;
        }

        let pt = msg.pt ?? { x: 0, y: 0 };
        if (msg.message == WM.KEYDOWN)
            switch (msg.wParam) {
                case VK.UP:
                    pt.y -= 8;
                    break;
                case VK.DOWN:
                    pt.y += 8;
                    break;
                case VK.LEFT:
                    pt.x -= 8;
                    break;
                case VK.RIGHT:
                    pt.x += 8;
                    break;
            }

        pt.x = Math.max(pt.x, mouseRect.left);
        pt.x = Math.min(pt.x, mouseRect.right - 1);
        pt.y = Math.max(pt.y, mouseRect.top);
        pt.y = Math.min(pt.y, mouseRect.bottom - 1);

        dx = pt.x - capturePoint.x;
        dy = pt.y - capturePoint.y;

        if (dx || dy) {
            if (!moved) {
                moved = true;
            }

            let newRect = { ...unmodRect };
            if (hitTest == HT.CAPTION) {
                OffsetRect(newRect, dx, dy);
            }

            if (hitTest === HT.LEFT || hitTest === HT.TOPLEFT || hitTest === HT.BOTTOMLEFT) {
                newRect.left += dx;
            }
            else if (hitTest === HT.RIGHT || hitTest === HT.TOPRIGHT || hitTest === HT.BOTTOMRIGHT) {
                newRect.right += dx;
            }
            if (hitTest === HT.TOP || hitTest === HT.TOPLEFT || hitTest === HT.TOPRIGHT) {
                newRect.top += dy;
            }
            else if (hitTest === HT.BOTTOM || hitTest === HT.BOTTOMLEFT || hitTest === HT.BOTTOMRIGHT) {
                newRect.bottom += dy;
            }

            capturePoint = pt;

            //
            //  Save the new position to the unmodified rectangle. This allows explorer task bar
            //  sizing. Explorer will forces back the position unless a certain amount of sizing
            //  has occurred.
            //
            unmodRect = newRect;

            if (sysCommand == SC.SIZE) {
                let wpSizingHit = 0;

                if (hitTest >= HT.LEFT && hitTest <= HT.BOTTOMRIGHT)
                    wpSizingHit = WMSZ.LEFT + (hitTest - HT.LEFT);

                let rect = await NtDispatchMessage(peb, [wnd.hWnd, WM.SIZING, wpSizingHit, newRect]);
                if (typeof rect === "object") {
                    newRect.left = rect.left;
                    newRect.top = rect.top;
                    newRect.right = rect.right;
                    newRect.bottom = rect.bottom;
                }
            }
            else {
                let rect = await NtDispatchMessage(peb, [wnd.hWnd, WM.MOVING, 0, newRect]);
                if (typeof rect === "object") {
                    newRect.left = rect.left;
                    newRect.top = rect.top;
                    newRect.right = rect.right;
                    newRect.bottom = rect.bottom;
                }
            }

            // if (!isIconic) {
            await NtSetWindowPos(peb, wnd.hWnd, null, newRect.left, newRect.top, newRect.right - newRect.left,
                newRect.bottom - newRect.top, SWP.NOACTIVATE | ((hitTest == HT.CAPTION) ? SWP.NOSIZE : 0) | SWP.NOZORDER);
            // }
            sizingRect = newRect;
        }
    }

    NtUserReleaseCapture(peb);

    await NtDispatchMessage(peb, [wnd.hWnd, WM.EXITSIZEMOVE, 0, 0]);

    return 0;
}

export function IntIsWindowVisible(wnd: WND) {
    let temp = wnd;
    for (; ;) {
        if (!temp) return true;
        if (!(temp.dwStyle & WS.VISIBLE)) break;
        if (temp.dwStyle & WS.MINIMIZE && temp != wnd) break;
        // if (Temp.fnid == FNID_DESKTOP) return TRUE;
        temp = ObGetObject<WND>(temp.hParent);
    }

    return false;
}

// TODO: this probably wont work super great as we can't move the cursor
export async function DefWndStartSizeMove(peb: PEB, wnd: WND, wParam: WPARAM, pt: POINT): Promise<number> {
    const rectWindow = wnd.rcWindow as RECT;

    let hitTest = 0;
    if ((wParam & 0xFFF0) === SC.MOVE) {
        if (wnd.dwStyle & WS.SYSMENU) {
            rectWindow.left += NtUserGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }
        if (wnd.dwStyle & WS.MINIMIZEBOX) {
            rectWindow.right -= NtUserGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }
        if (wnd.dwStyle & WS.MAXIMIZEBOX) {
            rectWindow.right -= NtUserGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }

        pt.x = (rectWindow.right + rectWindow.left) / 2;
        pt.y = rectWindow.top + NtUserGetSystemMetrics(peb, SM.CYSIZE) / 2;
        hitTest = HT.CAPTION;
    }
    else {
        pt.x = pt.y = 0;

        while (!hitTest) {
            const state = NtUserGetProcInfo(peb);
            if (!state) {
                console.warn("User32 not initialized");
                return 0;
            }

            let msg = await state.lpMsgQueue.GetMessage(wnd.hWnd, 0, 0);
            if (msg.message === WM.QUIT) return 0;

            switch (msg.message) {
                case WM.MOUSEMOVE: {
                    pt.x = Math.min(Math.max(msg.pt.x, rectWindow.left), rectWindow.right - 1);
                    pt.y = Math.min(Math.max(msg.pt.y, rectWindow.top), rectWindow.bottom - 1);
                    hitTest = await NtUserDoNCHitTest(wnd, pt.x, pt.y);
                    if ((hitTest < HT.LEFT) || (hitTest > HT.BOTTOMRIGHT))
                        hitTest = 0;
                    break;
                }
                case WM.LBUTTONUP:
                    return 0;
                case WM.KEYDOWN:
                    switch (msg.wParam) {
                        case VK.UP:
                            hitTest = HT.TOP;
                            pt.x = (rectWindow.left + rectWindow.right) / 2;
                            pt.y = rectWindow.top + NtUserGetSystemMetrics(peb, SM.CYFRAME) / 2;
                            break;
                        case VK.DOWN:
                            hitTest = HT.BOTTOM;
                            pt.x = (rectWindow.left + rectWindow.right) / 2;
                            pt.y = rectWindow.bottom - NtUserGetSystemMetrics(peb, SM.CYFRAME) / 2;
                            break;
                        case VK.LEFT:
                            hitTest = HT.LEFT;
                            pt.x = rectWindow.left + NtUserGetSystemMetrics(peb, SM.CXFRAME) / 2;
                            pt.y = (rectWindow.top + rectWindow.bottom) / 2;
                            break;
                        case VK.RIGHT:
                            hitTest = HT.RIGHT;
                            pt.x = rectWindow.right - NtUserGetSystemMetrics(peb, SM.CXFRAME) / 2;
                            pt.y = (rectWindow.top + rectWindow.bottom) / 2;
                            break;
                        case VK.RETURN:
                        case VK.ESCAPE:
                            return 0;
                    }
                    break;
                default: {
                    // NtTranslateMessage(msg);
                    await NtDispatchMessage(peb, msg);
                }
            }
        }
    }
}
