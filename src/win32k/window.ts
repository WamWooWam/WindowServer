import {
    CREATE_WINDOW_EX,
    HWND,
    MINMAXINFO,
    SM,
    SW,
    SWP,
    WM,
    WS,
} from "../types/user32.types.js";
import { GetW32ProcInfo, W32CLASSINFO } from "./shared.js";
import { HDC, POINT, RECT, SIZE } from "../types/gdi32.types.js";
import { NtPostMessage, NtSendMessage } from "./msg.js";
import { ObCloseHandle, ObDestroyHandle, ObDuplicateHandle, ObGetObject } from "../objects.js";

import { GreAllocDCForMonitor } from "./gdi/dc.js";
import { NtFindClass } from "./class.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtSetLastError } from "../error.js";
import { PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import { WND } from "./wnd.js";

let hDesktop: HWND = null;
export function NtGetDesktopWindow(): HWND {
    return hDesktop;
}

export function NtSetDesktopWindow(hWnd: HWND) {
    hDesktop = hWnd;
}

export function NtIntGetClientRect(peb: PEB, hWnd: HWND): RECT {
    const wnd = ObGetObject<WND>(hWnd);
    if (wnd.dwStyle & WS.MINIMIZED) {
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

// TODO: this is a stub
export function NtWinPosGetMinMaxInfo(peb: PEB, wnd: WND, maxSize: SIZE, maxPos: POINT, minTrackSize: SIZE, maxTrackSize: SIZE) {
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
}

export async function NtCreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<HWND> {
    const { dwExStyle, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam } = data;
    const state = GetW32ProcInfo(peb);

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

    let _hwndParent = NtGetDesktopWindow();
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
        if (_hwndParent != NtGetDesktopWindow()) {
            createStruct.x += parentWnd.rcClient.left;
            createStruct.y += parentWnd.rcClient.top;
        }
    }

    await wnd.CreateElement();

    const size = {
        cx: createStruct.x,
        cy: createStruct.y
    };

    await NtSendMessage(peb, [wnd.hWnd, WM.NCCREATE, 0, createStruct]);

    // todo: WM.ncalcsize

    let result = await NtSendMessage(peb, [wnd.hWnd, WM.CREATE, 0, createStruct]);
    if (result === -1) {
        wnd.Dispose();
        return 0;
    }

    console.log("wnd", wnd);

    if (!_hwndParent) {
        NtSetDesktopWindow(wnd.hWnd);
    }

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

    if (uFlags & SWP.NOZORDER) {
        // TODO: anything z-order related
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
        await NtSendMessage(peb, [wnd.hParent, WMP.REMOVECHILD, wnd.hWnd, 0])
    }

    // adjust last active

    // check shell window

    // destroy children
    for (const child of wnd.children) {
        await NtDestroyWindow(peb, child);
    }

    await NtSendMessage(peb, [wnd.hWnd, WM.DESTROY, 0, 0]);

    
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
