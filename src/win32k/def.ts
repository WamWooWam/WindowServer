import { HIWORD, HT, HWND, LOWORD, LPARAM, LRESULT, MSG, SC, SM, SW, SWP, VK, WM, WMSZ, WPARAM, WS } from "../types/user32.types.js";
import { INRECT, InflateRect, OffsetRect, POINT, RECT } from "../types/gdi32.types.js";
import { NtDestroyWindow, NtDoNCHitTest, NtIntGetClientRect, NtSetWindowPos, NtShowWindow, NtUserGetWindowBorders, NtUserHasWindowEdge, NtUserMapWindowPoints, NtWinPosGetMinMaxInfo } from "./window.js";
import { NtDispatchMessage, NtGetMessage, NtPostMessage, NtSendMessageTimeout } from "./msg.js";
import { NtUserGetCapture, NtUserGetCursorPos, NtUserReleaseCapture, NtUserSetCapture } from "./cursor.js";
import { WMP, WND_DATA } from "../types/user32.int.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtUserSetActiveWindow } from "./desktop.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";
import WindowElement from "./html/WindowElement.js";

function HasThickFrame(dwStyle: number) {
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
        const state = GetW32ProcInfo(peb);
        if (!state) {
            console.warn("User32 not initialized");
            return 0;
        }

        switch (Msg) {
            case WMP.CREATEELEMENT:
                return await NtDefCreateElement(peb, hWnd, Msg, wParam, lParam);
            case WMP.ADDCHILD:
                return await NtDefAddChild(peb, hWnd, wParam);
            case WMP.REMOVECHILD:
                return await NtDefRemoveChild(peb, hWnd, wParam);
            case WMP.UPDATEWINDOWSTYLE:
                return await NtDefUpdateWindowStyle(peb, hWnd, wParam, lParam);
            case WM.NCCALCSIZE:
                return NtDefCalcNCSizing(peb, hWnd, Msg, wParam, lParam);
            case WM.NCHITTEST:
                return NtDefNCHitTest(peb, hWnd, Msg, wParam, lParam);
            case WM.NCLBUTTONDOWN:
                return await NtDefNCLButtonDown(peb, hWnd, Msg, wParam, lParam);
            case WM.NCLBUTTONUP:
                return await NtDefNCLButtonUp(peb, hWnd, Msg, wParam, lParam);
            case WM.ACTIVATE:
                return 0;
            case WM.NCCREATE:
                return 0;
            case WM.CREATE:
                return 0;
            case WM.CLOSE:
                await NtDestroyWindow(peb, hWnd);
                return 0;
            case WM.SYSCOMMAND:
                return await NtDefWndHandleSysCommand(peb, wnd, wParam, lParam);
            case WM.GETMINMAXINFO:
                return lParam;
        }
    }
    finally {
        performance.measure(`NtDefWindowProc:0x${Msg.toString(16)}`, { start: mark, end: performance.now() });
    }

    return 0; // TODO
}

function NtDefAddChild(peb: PEB, hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if (wnd.pRootElement) {
        wnd.pRootElement.appendChild(childWnd.pRootElement);
    }

    wnd.AddChild(hWndChild);

    return 0;
}

function NtDefRemoveChild(peb: PEB, hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if (wnd.pRootElement) {
        wnd.pRootElement.removeChild(childWnd.pRootElement);
    }

    wnd.RemoveChild(hWndChild);

    return 0;
}

function NtDefCreateElement(peb: PEB, hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const state = GetW32ProcInfo(peb);
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

    const pRootElement = new WindowElement();
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

function NtDefNCHitTest(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
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

async function NtDefNCLButtonDown(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
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

async function NtDefNCLButtonUp(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM) {
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

async function NtDefWndHandleSysCommand(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    // console.log(`NtDefWndHandleSysCommand: probably ${SC[wParam & 0xFFF0]}`);
    switch (wParam & 0xFFF0) {
        case SC.MINIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW.MINIMIZE);
            return 0;
        case SC.MAXIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW.MAXIMIZE);
            return 0;
        case SC.RESTORE:
            await NtShowWindow(peb, wnd.hWnd, SW.RESTORE);
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

function IntIsWindowVisible(wnd: WND) {
    let temp = wnd;
    for (; ;) {
        if (!temp) return true;
        if (!(temp.dwStyle & WS.VISIBLE)) break;
        if (temp.dwStyle & WS.MINIMIZE && temp != wnd) break;
        // if (Temp . fnid == FNID_DESKTOP) return TRUE;
        temp = ObGetObject<WND>(temp.hParent);
    }

    return false;
}

async function NtDefWndDoSizeMove(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM) {
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

    if (isMaximized && sysCommand !== SC.MOVE || !IntIsWindowVisible(wnd)) {
        return;
    }

    const dragFullWindows = true; // TODO: make this configurable
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

    await NtWinPosGetMinMaxInfo(peb, wnd, null, null, minTrack, maxTrack);

    let sizingRect = wnd.rcWindow as RECT;
    let mouseRect = { left: 0, top: 0, right: 0, bottom: 0 };
    let origRect = { ...sizingRect };
    let unmodRect = { ...sizingRect };

    if (style & WS.CHILD) {
        let pWndParent = ObGetObject<WND>(wnd.hParent);
        mouseRect = NtIntGetClientRect(peb, pWndParent.hWnd);
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
            mouseRect = { ...NtGetPrimaryMonitor().rcWork }
        }
        else {
            mouseRect = { ...NtGetPrimaryMonitor().rcMonitor }
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
        const state = GetW32ProcInfo(peb);
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
            // NtTranslateMessage(msg);
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

            let newRect = { ...unmodRect }
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
                if (typeof rect === "object") [
                    newRect.left = rect.left,
                    newRect.top = rect.top,
                    newRect.right = rect.right,
                    newRect.bottom = rect.bottom
                ]
            }
            else {
                let rect = await NtDispatchMessage(peb, [wnd.hWnd, WM.MOVING, 0, newRect]);
                if (typeof rect === "object") [
                    newRect.left = rect.left,
                    newRect.top = rect.top,
                    newRect.right = rect.right,
                    newRect.bottom = rect.bottom
                ]
            }

            if (!isIconic) {
                NtSetWindowPos(peb, wnd.hWnd, null, newRect.left, newRect.top, newRect.right - newRect.left,
                    newRect.bottom - newRect.top, SWP.NOACTIVATE | ((hitTest == HT.CAPTION) ? SWP.NOSIZE : 0));
            }
            sizingRect = newRect;
        }
    }

    NtUserReleaseCapture(peb);

    await NtDispatchMessage(peb, [wnd.hWnd, WM.EXITSIZEMOVE, 0, 0]);

    return 0;
}

// TODO: this probably wont work super great as we can't move the cursor
async function DefWndStartSizeMove(peb: PEB, wnd: WND, wParam: WPARAM, pt: POINT): Promise<number> {
    const rectWindow = wnd.rcWindow as RECT;

    let hitTest = 0;
    if ((wParam & 0xFFF0) === SC.MOVE) {
        if (wnd.dwStyle & WS.SYSMENU) {
            rectWindow.left += NtIntGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }
        if (wnd.dwStyle & WS.MINIMIZEBOX) {
            rectWindow.right -= NtIntGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }
        if (wnd.dwStyle & WS.MAXIMIZEBOX) {
            rectWindow.right -= NtIntGetSystemMetrics(peb, SM.CXSIZE) + 1;
        }

        pt.x = (rectWindow.right + rectWindow.left) / 2;
        pt.y = rectWindow.top + NtIntGetSystemMetrics(peb, SM.CYSIZE) / 2;
        hitTest = HT.CAPTION;
    }
    else {
        pt.x = pt.y = 0;

        while (!hitTest) {
            const state = GetW32ProcInfo(peb);
            if (!state) {
                console.warn("User32 not initialized");
                return 0;
            }

            let msg = await state.lpMsgQueue.GetMessage(wnd.hWnd, 0, 0);
            if (msg.message === WM.QUIT) return 0;

            // console.log("DefWndStartSizeMove: got message", msg);

            switch (msg.message) {
                case WM.MOUSEMOVE: {
                    pt.x = Math.min(Math.max(msg.pt.x, rectWindow.left), rectWindow.right - 1);
                    pt.y = Math.min(Math.max(msg.pt.y, rectWindow.top), rectWindow.bottom - 1);
                    hitTest = await NtDoNCHitTest(wnd, pt.x, pt.y);
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
                            pt.y = rectWindow.top + NtIntGetSystemMetrics(peb, SM.CYFRAME) / 2;
                            break;
                        case VK.DOWN:
                            hitTest = HT.BOTTOM;
                            pt.x = (rectWindow.left + rectWindow.right) / 2;
                            pt.y = rectWindow.bottom - NtIntGetSystemMetrics(peb, SM.CYFRAME) / 2;
                            break;
                        case VK.LEFT:
                            hitTest = HT.LEFT;
                            pt.x = rectWindow.left + NtIntGetSystemMetrics(peb, SM.CXFRAME) / 2;
                            pt.y = (rectWindow.top + rectWindow.bottom) / 2;
                            break;
                        case VK.RIGHT:
                            hitTest = HT.RIGHT;
                            pt.x = rectWindow.right - NtIntGetSystemMetrics(peb, SM.CXFRAME) / 2;
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

function NtDefCalcNCSizing(peb: PEB, hWnd: number, Msg: WM, wParam: WPARAM, lParam: LPARAM): LRESULT {
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
