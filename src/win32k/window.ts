import {
    CREATE_WINDOW_EX,
    HWND,
    LRESULT,
    MINMAXINFO,
    SM_CXMINIMIZED,
    SM_CYMINIMIZED,
    SWP_HIDEWINDOW,
    SWP_NOACTIVATE,
    SWP_NOMOVE,
    SWP_NOSIZE,
    SWP_NOZORDER,
    SW_HIDE,
    SW_SHOW,
    SW_SHOWDEFAULT,
    WM_CREATE,
    WM_DESTROY,
    WM_NCCREATE,
    WNDPROC_PARAMS,
    WS_BORDER,
    WS_CAPTION,
    WS_CHILD,
    WS_EX_NOPARENTNOTIFY,
    WS_MINIMIZED,
    WS_POPUP,
    WS_VISIBLE
} from "../types/user32.types.js";
import { GetW32ProcInfo, W32CLASSINFO } from "./shared.js";
import { HDC, POINT, RECT, SIZE } from "../types/gdi32.types.js";
import { ObDestroyHandle, ObDuplicateHandle, ObGetObject } from "../objects.js";

import { GreAllocDCForMonitor } from "./gdi/dc.js";
import { NtFindClass } from "./class.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtSendMessage } from "./msg.js";
import { NtSetLastError } from "../error.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

export function NtGetDesktopWindow(peb: PEB): HWND {
    const state = GetW32ProcInfo(peb);
    return state.hDesktop;
}

export function NtIntGetClientRect(peb: PEB, hWnd: HWND): RECT {
    const wnd = ObGetObject<WND>(hWnd);
    if (wnd.dwStyle & WS_MINIMIZED) {
        return {
            top: 0,
            left: 0,
            right: NtIntGetSystemMetrics(peb, SM_CXMINIMIZED),
            bottom: NtIntGetSystemMetrics(peb, SM_CYMINIMIZED)
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
export function NTWinPosGetMinMaxInfo(peb: PEB, wnd: WND, maxSize: SIZE, maxPos: POINT, minTrackSize: SIZE, maxTrackSize: SIZE) {
    let rc = wnd.rcWindow;
    const minMax: MINMAXINFO = {
        ptReserved: { x: rc.left, y: rc.top },
        ptMaxSize: { x: 0, y: 0 },
        ptMaxPosition: { x: 0, y: 0 },
        ptMinTrackSize: { x: 0, y: 0 },
        ptMaxTrackSize: { x: 0, y: 0 },
    };

    let adjustedStyle = wnd.dwStyle;
    if ((wnd.dwStyle & WS_CAPTION) == WS_CAPTION) {
        adjustedStyle &= ~WS_BORDER;
    }

    const parentWindow = ObGetObject<WND>(wnd.hParent);
    if (parentWindow) {
        rc = NtIntGetClientRect(peb, wnd.hParent);
    }
}

export async function NtCreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<HWND> {
    const { dwExStyle, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam } = data;
    const state = GetW32ProcInfo(peb);

    if ((dwStyle & (WS_POPUP | WS_CHILD)) != WS_CHILD) {
        // must have a valid menu if specified
        if (hMenu && ObGetObject(hMenu) === null) {
            return 0;
        }
    }

    let lpClassInfo: W32CLASSINFO = null;
    if (typeof lpClassName === "number") {
        lpClassInfo = state.classes[lpClassName];
    }
    else {
        lpClassInfo = NtFindClass(state, lpClassName);
    }

    if (lpClassInfo == null) {
        // Class not registered
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return 0;
    }

    let _hwndParent = state.hDesktop;
    let _hwndOwner = null;

    if (hWndParent) {
        // if we're not a child window, then we're a popup window
        // and as such the "parent" is actually the owner
        if ((dwStyle & (WS_CHILD | WS_POPUP)) != WS_CHILD) {
            _hwndOwner = hWndParent;
        }
        else {
            _hwndParent = hWndParent;
        }
    }
    else if ((dwStyle & (WS_CHILD | WS_POPUP)) == WS_CHILD) {
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
            while ((ownerWnd.dwStyle & (WS_POPUP | WS_CHILD)) == WS_CHILD && ownerWnd.hParent !== null) {
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

    if ((wnd.dwStyle & (WS_CHILD | WS_POPUP)) === WS_CHILD) {
        if (_hwndParent != NtGetDesktopWindow(peb)) {
            createStruct.x += parentWnd.rcClient.left;
            createStruct.y += parentWnd.rcClient.top;
        }
    }

    const size = {
        cx: createStruct.x,
        cy: createStruct.y
    };
    
    await NtSendMessage(peb, [wnd.hWnd, WM_NCCREATE, 0, createStruct]);

    // todo: wm_ncalcsize

    let result = await NtSendMessage(peb, [wnd.hWnd, WM_CREATE, 0, createStruct]);
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
            case SW_HIDE:
                wnd.Hide();
                break;
            case SW_SHOW:
            case SW_SHOWDEFAULT:
                wnd.Show();
                break;
            default:
                console.warn("NtShowWindow: unknown nCmdShow", nCmdShow);
                break;
        }
    }

}

async function NtSendParentNotify(peb: PEB, pWnd: WND, msg: number) {
    if ((pWnd.dwStyle & (WS_CHILD | WS_POPUP)) == WS_CHILD
        && !(pWnd.dwExStyle & WS_EX_NOPARENTNOTIFY)) {
        const parentWnd = ObGetObject<WND>(pWnd.hParent);
        if (!parentWnd) {
            console.warn("NtSendParentNotify: parentWnd is null");
            return;
        }

        const handle = ObDuplicateHandle(parentWnd.hWnd);
        await NtSendMessage(peb, [handle, msg, pWnd.hWnd, 0]);

        ObDestroyHandle(handle);
    }
}


export async function NtSetWindowPos(peb: PEB, hWnd: HWND, hWndInsertAfter: HWND, x: number, y: number, cx: number, cy: number, uFlags: number) {

}

export async function NtDestroyWindow(peb: PEB, hWnd: HWND) {
    const wnd = ObGetObject<WND>(hWnd);

    if ((wnd.dwStyle & WS_CHILD)) {
        await NtSendParentNotify(peb, wnd, WM_DESTROY);
    }

    if (wnd.hOwner === null) {
        // TODO: notify the shell
    }

    if ((wnd.dwStyle & WS_VISIBLE)) {
        if ((wnd.dwStyle & WS_CHILD)) {
            await NtShowWindow(peb, hWnd, SW_HIDE);
        }
        else {
            await NtSetWindowPos(peb, hWnd, 0, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_HIDEWINDOW);
        }
    }

    // adjust last active

    // check shell window

    // destroy children
    for (const child of wnd.children) {
        await NtDestroyWindow(peb, child);
    }

    await NtSendMessage(peb, [wnd.hWnd, WM_DESTROY, 0, 0]);

    ObDestroyHandle(wnd.hWnd);

    return true;
}

export function NtUserGetDC(peb: PEB, hWnd: HWND): HDC {
    if (hWnd === null) {
        return GreAllocDCForMonitor(NtGetPrimaryMonitor().hMonitor);
    }
    
    const wnd = ObGetObject<WND>(hWnd);
    return wnd.hDC;
}


// export async function NtFreeWindow(peb: PEB, hWnd: HWND) {
//    
// }