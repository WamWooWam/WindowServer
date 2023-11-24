import {
    CREATE_WINDOW_EX,
    HWND,
    HWND_BOTTOM,
    HWND_BROADCAST,
    HWND_MESSAGE,
    HWND_NOTOPMOST,
    HWND_TOP,
    HWND_TOPMOST,
    MINMAXINFO,
    SM,
    SW,
    SWP,
    WM,
    WS,
} from "../types/user32.types.js";
import DESKTOP, { NtUserSetActiveWindow } from "./desktop.js";
import { GetW32ProcInfo, W32CLASSINFO } from "./shared.js";
import { HDC, InflateRect, POINT, RECT, SIZE } from "../types/gdi32.types.js";
import { NtDispatchMessage, NtPostMessage, NtSendMessageTimeout } from "./msg.js";
import { ObCloseHandle, ObDestroyHandle, ObDuplicateHandle, ObGetObject } from "../objects.js";

import { GreAllocDCForMonitor } from "./gdi/dc.js";
import { NtDefWindowProc } from "./def.js";
import { NtFindClass } from "./class.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtSetLastError } from "../error.js";
import { PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import { WND } from "./wnd.js";

export function NtGetDesktopWindow(peb: PEB): HWND {
    return ObGetObject<DESKTOP>(peb.hDesktop)?.hwndDesktop;
}

export function NtIntGetClientRect(peb: PEB, hWnd: HWND): RECT {
    const wnd = ObGetObject<WND>(hWnd);
    if (wnd.dwStyle & WS.ICONIC) {
        return {
            top: 0,
            left: 0,
            right: NtIntGetSystemMetrics(SM.CXMINIMIZED),
            bottom: NtIntGetSystemMetrics(SM.CYMINIMIZED)
        }
    }

    // TODO: if desktop window return screen size
    if (wnd) {
        return {
            top: 0,
            left: 0,
            right: wnd.rcClient.right - wnd.rcClient.left,
            bottom: wnd.rcClient.bottom - wnd.rcClient.top
        }
    }
}
export function NtIntGetWindowBorders(dwStyle: number, dwExStyle: number) {
    let adjust = 0;

    if (dwExStyle & WS.EX.WINDOWEDGE)      // 1st
        adjust = 2; // outer 
    else if (dwExStyle & WS.EX.STATICEDGE) // 2nd
        adjust = 1; // for the outer frame 

    if (dwExStyle & WS.EX.CLIENTEDGE)
        adjust += 2;

    if (dwStyle & WS.CAPTION || dwExStyle & WS.EX.DLGMODALFRAME)
        adjust++; // the other border

    return adjust;
}

// TODO: this is a stub
export async function NtWinPosGetMinMaxInfo(peb: PEB, wnd: WND, maxSize: SIZE, maxPos: POINT, minTrackSize: SIZE, maxTrackSize: SIZE) {
    let rc = wnd.rcWindow;
    const minMax: MINMAXINFO = {
        ptReserved: { x: rc.left, y: rc.top },
        ptMaxSize: { x: 0, y: 0 },
        ptMaxPosition: { x: 0, y: 0 },
        ptMinTrackSize: { x: 0, y: 0 },
        ptMaxTrackSize: { x: 0, y: 0 },
    };

    let adjustedStyle = wnd.dwStyle;
    if ((wnd.dwStyle & WS.CAPTION) == WS.CAPTION) {
        adjustedStyle &= ~WS.BORDER;
    }

    const parentWindow = ObGetObject<WND>(wnd.hParent);
    if (parentWindow) {
        rc = NtIntGetClientRect(peb, wnd.hParent);
    }

    let adjust = NtIntGetWindowBorders(adjustedStyle, wnd.dwExStyle);
    if ((adjustedStyle & WS.THICKFRAME) && !(adjustedStyle & WS.CHILD) && !(adjustedStyle & WS.MINIMIZE))
        adjust += 1;

    let xinc = 0;
    let yinc = 0;

    xinc = yinc = adjust;

    if ((adjustedStyle & WS.THICKFRAME) && (adjustedStyle & WS.CHILD) && !(adjustedStyle & WS.MINIMIZE)) {
        xinc += NtIntGetSystemMetrics(SM.CXFRAME) - NtIntGetSystemMetrics(SM.CXDLGFRAME);
        yinc += NtIntGetSystemMetrics(SM.CYFRAME) - NtIntGetSystemMetrics(SM.CYDLGFRAME);
    }

    InflateRect(rc, xinc * NtIntGetSystemMetrics(SM.CXBORDER), yinc * NtIntGetSystemMetrics(SM.CYBORDER));

    xinc = -rc.left;
    yinc = -rc.top;

    minMax.ptMaxSize.x = rc.right - rc.left;
    minMax.ptMaxSize.y = rc.bottom - rc.top;

    if (wnd.dwStyle & (WS.DLGFRAME | WS.BORDER)) {
        // TODO: SM_CXMINTRACK/SM_CYMINTRACK
        minMax.ptMaxTrackSize.x = NtIntGetSystemMetrics(SM.CXMINTRACK);
        minMax.ptMaxTrackSize.y = NtIntGetSystemMetrics(SM.CYMINTRACK);
    }
    else {
        minMax.ptMaxTrackSize.x = 2 * xinc;
        minMax.ptMaxTrackSize.y = 2 * yinc;
    }

    // TODO: SM_CXMAXTRACK/SM_CYMAXTRACK
    minMax.ptMaxTrackSize.x = NtIntGetSystemMetrics(SM.CXMAXTRACK);
    minMax.ptMaxTrackSize.y = NtIntGetSystemMetrics(SM.CYMAXTRACK);

    minMax.ptMaxPosition.x = -xinc;
    minMax.ptMaxPosition.y = -yinc;

    let newMinMax = await NtDispatchMessage(peb, [wnd.hWnd, WM.GETMINMAXINFO, 0, minMax]);
    let monitor = NtGetPrimaryMonitor();
    let rcWork = { ...monitor.rcMonitor };

    if (wnd.dwStyle & WS.MAXIMIZEBOX) {
        if ((wnd.dwStyle & WS.CAPTION) === WS.CAPTION || !(wnd.dwStyle & (WS.CHILD | WS.POPUP))) {
            rcWork = { ...monitor.rcWork };
        }
    }

    if (newMinMax.ptMaxSize.x == NtIntGetSystemMetrics(SM.CXSCREEN) + 2 * xinc &&
        newMinMax.ptMaxSize.y == NtIntGetSystemMetrics(SM.CYSCREEN) + 2 * yinc) {
        newMinMax.ptMaxSize.x = (rcWork.right - rcWork.left) + 2 * xinc;
        newMinMax.ptMaxSize.y = (rcWork.bottom - rcWork.top) + 2 * yinc;
    }
    if (newMinMax.ptMaxPosition.x == -xinc && newMinMax.ptMaxPosition.y == -yinc) {
        newMinMax.ptMaxPosition.x = rcWork.left - xinc;
        newMinMax.ptMaxPosition.y = rcWork.top - yinc;
    }
    if (newMinMax.ptMaxSize.x >= (monitor.rcMonitor.right - monitor.rcMonitor.left) &&
        newMinMax.ptMaxSize.y >= (monitor.rcMonitor.bottom - monitor.rcMonitor.top)) {
        // Window -> state |= WNDS_MAXIMIZESTOMONITOR;
    }
    else {
        // Window -> state &= ~WNDS_MAXIMIZESTOMONITOR;
    }


    newMinMax.ptMaxTrackSize.x = Math.max(newMinMax.ptMaxTrackSize.x,
        newMinMax.ptMinTrackSize.x);
    newMinMax.ptMaxTrackSize.y = Math.max(newMinMax.ptMaxTrackSize.y,
        newMinMax.ptMinTrackSize.y);

    if (maxSize) {
        Object.assign(maxSize, newMinMax.ptMaxSize);
    }
    if (maxPos) {
        Object.assign(maxPos, newMinMax.ptMaxPosition);
    }
    if (minTrackSize) {
        minTrackSize.cx = newMinMax.ptMinTrackSize.x;
        minTrackSize.cy = newMinMax.ptMinTrackSize.y;
    }
    if (maxTrackSize) {
        maxTrackSize.cx = newMinMax.ptMaxTrackSize.x;
        maxTrackSize.cy = newMinMax.ptMaxTrackSize.y;
    }

    return 0;
}

export async function NtCreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<HWND> {
    const { dwExStyle, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam } = data;
    const state = GetW32ProcInfo(peb);

    let maxSize: SIZE = { cx: 0, cy: 0 };
    let maxPos: POINT = { x: 0, y: 0 };
    let minTrackSize: SIZE = { cx: 0, cy: 0 };
    let maxTrackSize: SIZE = { cx: 0, cy: 0 };

    if ((dwStyle & (WS.POPUP | WS.CHILD)) != WS.CHILD) {
        // must have a valid menu if specified
        if (hMenu && ObGetObject(hMenu) === null) {
            return 0;
        }
    }

    let lpClassInfo = NtFindClass(state, lpClassName);

    if (lpClassInfo == null) {
        // Class not registered
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return 0;
    }

    let _hwndParent = NtGetDesktopWindow(peb);
    let _hwndOwner = null;

    if (hWndParent) {
        // if we're not a child window, then we're a popup window
        // and as such the "parent" is actually the owner
        if ((dwStyle & (WS.CHILD | WS.POPUP)) != WS.CHILD) {
            _hwndOwner = hWndParent;
        }
        else {
            _hwndParent = hWndParent;
        }
    }
    else if ((dwStyle & (WS.CHILD | WS.POPUP)) == WS.CHILD) {
        // if we're a child window, we must have a parent
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return 0;
    }

    let parentWnd = ObGetObject<WND>(_hwndParent);
    let ownerWnd = ObGetObject<WND>(_hwndOwner);

    if ((_hwndParent && parentWnd == null) || (_hwndOwner && ownerWnd == null)) {
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return 0;
    }

    if (ownerWnd) {
        if (ownerWnd.hParent === null) { // IsDesktopWindow
            ownerWnd = null;
        }
        else if (parentWnd && parentWnd.hParent !== null) {
            // parent is not the desktop, so it's not a valid parent
            NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
            return 0;
        }
        else {
            // find the top-level owner
            while ((ownerWnd.dwStyle & (WS.POPUP | WS.CHILD)) == WS.CHILD && ownerWnd.hParent !== null) {
                ownerWnd = ObGetObject<WND>(ownerWnd.hParent);
            }
        }

        if (ownerWnd) {
            _hwndOwner = ownerWnd.hWnd;
        }
    }

    if (parentWnd) {
        ObDuplicateHandle(_hwndParent); // add a reference to the parent
    }

    const createStruct: CREATE_WINDOW_EX = {
        dwExStyle,
        dwStyle,
        x,
        y,
        nWidth,
        nHeight,
        hMenu,
        hInstance,
        lpParam,
        lpClassName: lpClassInfo.lpszClassName,
        lpWindowName,
        hWndParent: _hwndParent
    };

    const wnd = new WND(peb, state, createStruct, lpWindowName, lpClassInfo, _hwndParent, _hwndOwner);

    // we have a window! we can now send funny messages to it

    // reset these
    createStruct.lpClassName = lpClassName;
    createStruct.lpWindowName = lpWindowName;

    if ((wnd.dwStyle & (WS.CHILD | WS.POPUP)) === WS.CHILD) {
        if (_hwndParent != NtGetDesktopWindow(peb)) {
            createStruct.x += parentWnd.rcClient.left;
            createStruct.y += parentWnd.rcClient.top;
        }
    }

    await wnd.CreateElement();

    const size = {
        cx: createStruct.x,
        cy: createStruct.y
    };

    if (!(wnd.dwStyle & (WS.CHILD | WS.POPUP)) && (wnd.dwStyle & WS.THICKFRAME)) {
        await NtWinPosGetMinMaxInfo(peb, wnd, maxSize, maxPos, minTrackSize, maxTrackSize);
    }

    wnd.MoveWindow(createStruct.x, createStruct.y, createStruct.nWidth, createStruct.nHeight, false);

    await NtDispatchMessage(peb, [wnd.hWnd, WM.NCCREATE, 0, createStruct]);

    // todo: WM.ncalcsize

    let result = await NtDispatchMessage(peb, [wnd.hWnd, WM.CREATE, 0, createStruct]);
    if (result === -1) {
        wnd.Dispose();
        return 0;
    }

    console.log("wnd", wnd);

    return wnd.hWnd;
}

export async function NtShowWindow(peb: PEB, hWnd: HWND, nCmdShow: number) {
    const wnd = ObGetObject<WND>(hWnd);
    if (wnd) {
        switch (nCmdShow) {
            case SW.HIDE:
                wnd.Hide();
                break;
            case SW.SHOW:
            case SW.SHOWDEFAULT:
                wnd.Show();
                await NtUserSetActiveWindow(peb, hWnd);
                break;
            default:
                console.warn("NtShowWindow: unknown nCmdShow", nCmdShow);
                break;
        }
    }

}

async function NtSendParentNotify(peb: PEB, pWnd: WND, msg: number) {
    if ((pWnd.dwStyle & (WS.CHILD | WS.POPUP)) == WS.CHILD
        && !(pWnd.dwExStyle & WS.EX.NOPARENTNOTIFY)) {
        const parentWnd = ObGetObject<WND>(pWnd.hParent);
        if (!parentWnd) {
            console.warn("NtSendParentNotify: parentWnd is null");
            return;
        }

        const handle = ObDuplicateHandle(parentWnd.hWnd);
        NtPostMessage(peb, [handle, msg, pWnd.hWnd, 0]);

        ObCloseHandle(handle);
    }
}


export async function NtSetWindowPos(peb: PEB, hWnd: HWND, hWndInsertAfter: HWND, x: number, y: number, cx: number, cy: number, uFlags: number) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return false;
    }

    if (uFlags & SWP.NOMOVE) {
        x = wnd.rcWindow.left;
        y = wnd.rcWindow.top;
    }

    if (uFlags & SWP.NOSIZE) {
        cx = wnd.rcWindow.right - wnd.rcWindow.left;
        cy = wnd.rcWindow.bottom - wnd.rcWindow.top;
    }

    if (((uFlags & SWP.NOZORDER) !== SWP.NOZORDER) && hWndInsertAfter !== null) {
        const parentWnd = ObGetObject<WND>(wnd.hParent);
        if (!parentWnd) {
            return false;
        }

        let children = parentWnd.children;

        let insertIdx = children.indexOf(wnd.hWnd);
        if (hWndInsertAfter === HWND_TOP) {
            insertIdx = parentWnd.children.findIndex((hWnd) => {
                return ObGetObject<WND>(hWnd).dwExStyle & WS.EX.TOPMOST;
            });

            if (insertIdx === -1) {
                insertIdx = 0;
            }
        }
        else if (hWndInsertAfter === HWND_BOTTOM) {
            insertIdx = children.length - 1;
        }
        else if (hWndInsertAfter === HWND_NOTOPMOST) {
            insertIdx = children.findIndex((hWnd) => {
                return !(ObGetObject<WND>(hWnd).dwExStyle & WS.EX.TOPMOST);
            });

            if (insertIdx === -1) {
                insertIdx = 0;
            }
        }
        else if (hWndInsertAfter === HWND_TOPMOST) {
            insertIdx = 0;
        }
        else {
            insertIdx = children.indexOf(hWndInsertAfter);
        }


        parentWnd.MoveChild(wnd.hWnd, insertIdx);
    }

    if (uFlags & SWP.NOACTIVATE) {
        // TODO: check if we're the active window
    }

    if (uFlags & SWP.SHOWWINDOW) {
        await NtShowWindow(peb, hWnd, SW.SHOWDEFAULT);
    }

    if (uFlags & SWP.HIDEWINDOW) {
        await NtShowWindow(peb, hWnd, SW.HIDE);
    }

    if (uFlags & SWP.NOCOPYBITS) {
        // TODO
    }

    if (uFlags & SWP.NOOWNERZORDER) {
        // TODO
    }

    if (uFlags & SWP.FRAMECHANGED) {
        // TODO
    }

    if (uFlags & SWP.NOSENDCHANGING) {
        // TODO
    }

    if (uFlags & SWP.DEFERERASE) {
        // TODO
    }

    if (uFlags & SWP.ASYNCWINDOWPOS) {
        // TODO
    }

    if (uFlags & SWP.NOREDRAW) {
        // TODO
    }

    wnd.MoveWindow(x, y, cx, cy, uFlags & SWP.NOREDRAW ? false : true);
}

export async function NtDestroyWindow(peb: PEB, hWnd: HWND) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return false;
    }

    if ((wnd.dwStyle & WS.CHILD)) {
        await NtSendParentNotify(peb, wnd, WM.DESTROY);
    }

    if (wnd.hOwner === null) {
        // TODO: notify the shell
    }

    if ((wnd.dwStyle & WS.VISIBLE)) {
        if ((wnd.dwStyle & WS.CHILD)) {
            await NtShowWindow(peb, hWnd, SW.HIDE);
        }
        else {
            await NtSetWindowPos(peb, hWnd, 0, 0, 0, 0, 0, SWP.NOMOVE | SWP.NOSIZE | SWP.NOZORDER | SWP.NOACTIVATE | SWP.HIDEWINDOW);
        }
    }


    if (wnd.hParent) {
        await NtDispatchMessage(peb, [wnd.hParent, WMP.REMOVECHILD, wnd.hWnd, 0])
    }

    // adjust last active

    // check shell window

    // destroy children
    for (const child of wnd.children) {
        await NtDestroyWindow(peb, child);
    }

    await NtDispatchMessage(peb, [wnd.hWnd, WM.DESTROY, 0, 0]);


    ObDestroyHandle(wnd.hWnd);

    return true;
}

export function NtUserGetDC(peb: PEB, hWnd: HWND): HDC {
    if (hWnd === null) {
        return GreAllocDCForMonitor(NtGetPrimaryMonitor().hMonitor).hDC;
    }

    const wnd = ObGetObject<WND>(hWnd);
    return ObDuplicateHandle(wnd.hDC);
}

export async function NtDoNCHitTest(wnd: WND, x: number, y: number) {
    if (!wnd.stateFlags.overridesNCHITTEST) {
        return await NtDefWindowProc(wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x);
    }
    else {
        const { status, result } = await NtSendMessageTimeout(wnd.peb, [wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x], 10);
        if (status !== 0) // STATUS_TIMEOUT
            return await NtDefWindowProc(wnd.hWnd, WM.NCHITTEST, 0, (y << 16) + x);

        return result;
    }
}


export function NtUserMapWindowPoints(fromWnd: WND, toWnd: WND, lpPoints: POINT[]) {
    let delta = { cx: 0, cy: 0 };

    if (fromWnd && fromWnd.hParent !== null) {
        delta.cx = fromWnd.rcClient.left;
        delta.cy = fromWnd.rcClient.top;
    }

    if (toWnd && toWnd.hParent !== null) {
        delta.cx -= toWnd.rcClient.left;
        delta.cy -= toWnd.rcClient.top;
    }

    for (const point of lpPoints) {
        point.x += delta.cx;
        point.y += delta.cy;
    }
}