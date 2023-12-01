import { CREATE_WINDOW_EX, WMP } from "../types/user32.int.types.js";
import DESKTOP, { NtUserSetActiveWindow } from "./desktop.js";
import { GetW32ProcInfo, W32CLASSINFO } from "./shared.js";
import { HDC, InflateRect, POINT, RECT, SIZE } from "../types/gdi32.types.js";
import {
    GA,
    GW,
    HWND,
    HWND_BOTTOM,
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
import { NtDispatchMessage, NtPostMessage } from "./msg.js";
import { ObCloseHandle, ObDestroyHandle, ObDuplicateHandle, ObEnumHandlesByType, ObGetObject } from "../objects.js";

import { GreAllocDCForMonitor } from "./gdi/dc.js";
import { NtFindClass } from "./class.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { NtSetLastError } from "../error.js";
import { PEB } from "../types/types.js";
import WND from "./wnd.js";
import { NtUserScreenToClient } from "./client.js";
import { NtSetWindowPos, NtUserSetWindowPos, NtUserShowWindow } from "./wndpos.js";

const gNestedWindowLimit = 50;

export function NtGetDesktopWindow(peb: PEB): HWND {
    return ObGetObject<DESKTOP>(peb.hDesktop)?.hwndDesktop;
}

export function NtUserIsDesktopWindow(wnd: WND) {
    return wnd.hWnd == NtGetDesktopWindow(wnd.peb);
}

function NtUserWndSetParent(wnd: WND, wParent: WND) {
    wnd.wndParent = wParent;
}

function NtUserWndSetOwner(wnd: WND, wOwner: WND) {
    wnd.wndOwner = wOwner;
}

function NtUserWndSetPrev(wnd: WND, wPrev: WND) {
    wnd.wndPrev = wPrev;
}

function NtUserWndSetNext(wnd: WND, wNext: WND) {
    wnd.wndNext = wNext;
}

function NtUserWndSetChild(wnd: WND, wChild: WND) {
    if(!wnd) return;
    wnd.wndChild = wChild;
}

export function NtUserLinkWindow(wnd: WND, wInsertAfter: WND) {
    if (wnd === wInsertAfter) {
        return;
    }

    NtUserWndSetPrev(wnd, wInsertAfter);
    if (wnd.wndPrev) {
        console.assert(wnd != wInsertAfter.wndNext);
        NtUserWndSetNext(wnd, wInsertAfter.wndNext);
        if (wnd.wndNext) {
            NtUserWndSetPrev(wnd.wndNext, wnd);
        }

        console.assert(wnd != wnd.wndPrev);
        NtUserWndSetNext(wnd.wndPrev, wnd);
    }
    else {
        console.assert(wnd != wnd.wndParent?.wndChild);
        NtUserWndSetNext(wnd, wnd.wndParent?.wndChild);
        if (wnd.wndNext) {
            NtUserWndSetPrev(wnd.wndNext, wnd);
        }

        NtUserWndSetChild(wnd.wndParent, wnd);
    }
}

export function NtUserUnlinkWindow(wnd: WND) {
    console.assert(wnd !== wnd.wndNext);
    console.assert(wnd !== wnd.wndPrev);

    if (wnd.wndNext)
        NtUserWndSetPrev(wnd.wndNext, wnd.wndPrev);

    if (wnd.wndPrev)
        NtUserWndSetNext(wnd.wndPrev, wnd.wndNext);

    if (wnd.wndParent && wnd.wndParent.wndChild === wnd)
        NtUserWndSetChild(wnd.wndParent, wnd.wndNext);

    NtUserWndSetNext(wnd, null);
    NtUserWndSetPrev(wnd, null);
}

export function NtIntIsChildWindow(wnd: WND, baseWindow: WND) {
    let window = baseWindow;
    do {
        if (window === null || (wnd.dwStyle & (WS.POPUP | WS.CHILD)) !== WS.CHILD) {
            return false;
        }

        window = window.wndParent;
    } while (wnd !== window);

    return true;
}

export function NtUserIntLinkHwnd(wnd: WND, hWndPrev: HWND) {
    if (hWndPrev === HWND_TOPMOST) {
        if (!(wnd.dwExStyle & WS.EX.TOPMOST) && wnd.stateFlags.isLinked) return;

        wnd.dwExStyle &= ~WS.EX.TOPMOST;
        hWndPrev = HWND_TOP;
    }

    NtUserUnlinkWindow(wnd); // remove from current list

    if (hWndPrev === HWND_BOTTOM) {
        let wndInsertAfter: WND;

        wndInsertAfter = wnd.wndParent?.wndChild;
        while (wndInsertAfter && wndInsertAfter.wndNext) {
            wndInsertAfter = wndInsertAfter.wndNext;
        }

        NtUserLinkWindow(wnd, wndInsertAfter);
        wnd.dwExStyle &= ~WS.EX.TOPMOST;
    }
    else if (hWndPrev === HWND_TOPMOST) {
        NtUserLinkWindow(wnd, null);
        wnd.dwExStyle |= WS.EX.TOPMOST;
    }
    else if (hWndPrev === HWND_TOP) {
        let wndInsertBefore = wnd.wndParent?.wndChild;
        if (!(wnd.dwExStyle & WS.EX.TOPMOST)) {
            while (wndInsertBefore != null && wndInsertBefore.wndNext != null) {
                if (!(wndInsertBefore.dwExStyle & WS.EX.TOPMOST)) {
                    break;
                }

                if (wndInsertBefore === wnd.wndOwner) {
                    wnd.dwExStyle |= WS.EX.TOPMOST;
                    break;
                }

                wndInsertBefore = wndInsertBefore.wndNext;
            }
        }

        NtUserLinkWindow(wnd, wndInsertBefore ? wndInsertBefore.wndPrev : null);
    }
    else {
        // insert after
        const wndInsertAfter = ObGetObject<WND>(hWndPrev);
        if (!wndInsertAfter) {
            NtUserIntLinkHwnd(wnd, HWND_TOP);
            return;
        }

        if (wndInsertAfter === wnd) {
            return;
        }
        else {
            NtUserLinkWindow(wnd, wndInsertAfter);
        }

        if (!(wndInsertAfter.dwExStyle & WS.EX.TOPMOST)) {
            wnd.dwExStyle &= ~WS.EX.TOPMOST;
        }
        else {
            if (wndInsertAfter.wndNext && (wndInsertAfter.wndNext.dwExStyle & WS.EX.TOPMOST)) {
                wnd.dwExStyle |= WS.EX.TOPMOST;
            }
        }

        wnd.stateFlags.isLinked = true;
    }
}

// ensures that when parenting windows from different processes, the input queues are attached
function NtUserHandleOwnerSwap(wnd: WND, wndNewOwner: WND, wndOldOwner: WND) {
    if (wndOldOwner) {
        if (wnd.peb != wndOldOwner.peb) {
            if (!wndNewOwner || wnd.peb === wndNewOwner.peb || wndOldOwner.peb !== wndNewOwner.peb) {
                // TODO: AttachThreadInput
                // NtUserAttachThreadInput(wnd.peb, wndOldOwner.peb, false); 
            }
        }
    }

    if (wndNewOwner) {
        if (wnd.peb != wndNewOwner.peb) {
            if (!wndOldOwner || wndOldOwner.peb !== wndNewOwner.peb) {
                // TODO: AttachThreadInput
                // NtUserAttachThreadInput(wnd.peb, wndNewOwner.peb, true);
            }
        }
    }
}

export function NtUserIntSetOwner(peb: PEB, hWnd: HWND, hWndOwner: HWND) {
    let wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return null;

    let wndOldOwner = wnd.wndOwner;
    let ret = wndOldOwner?.hWnd;

    let wndNewOwner = ObGetObject<WND>(hWndOwner);
    if (!wndNewOwner && hWndOwner) {
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return null;
    }

    NtUserHandleOwnerSwap(wnd, wndNewOwner, wndOldOwner);

    // ReactOS ensures there's a maximum of 50 nested windows
    NtUserWndSetOwner(wnd, wndNewOwner);

    return ret;
}

export async function NtUserIntSetParent(peb: PEB, wnd: WND, wndNewParent: WND): Promise<WND> {
    let flags = SWP.NOSIZE | SWP.NOZORDER;

    if (NtIntIsChildWindow(wnd, wndNewParent)) {
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return null; // don't set a child window as a parent
    }

    let wndExam = wndNewParent;
    while (wndExam) {
        if (wnd === wndExam) {
            NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
            return null; // don't set a child window as a parent
        }

        wndExam = wndExam.wndParent;
    }

    let wasVisible = await NtUserShowWindow(wnd.hWnd, SW.HIDE);
    if (wnd.peb !== peb) {
        NtSetLastError(peb, 0x00000057); // ERROR_INVALID_PARAMETER
        return null; // window must be in the same process
    }

    let pt = { x: 0, y: 0 };
    let wndOldParent = wnd.wndParent;
    if (wndOldParent && wndOldParent.dwExStyle & WS.EX.LAYOUTRTL)
        pt.x = wnd.rcWindow.right;
    else
        pt.x = wnd.rcWindow.left;

    pt.y = wnd.rcWindow.top;

    NtUserScreenToClient(wndOldParent.hWnd, pt);

    if (wndNewParent != wndOldParent) {
        NtUserUnlinkWindow(wnd);
        wnd.stateFlags.isLinked = false;

        NtUserWndSetParent(wnd, wndNewParent);

        if (wnd.dwStyle & WS.CHILD && wnd.wndOwner && wnd.wndOwner.dwExStyle & WS.EX.TOPMOST) {
            wnd.dwExStyle |= WS.EX.TOPMOST;
        }

        NtUserIntLinkHwnd(wnd, ((0 == (wnd.dwExStyle & WS.EX.TOPMOST) && NtUserIsDesktopWindow(wndNewParent)) ? HWND_TOP : HWND_TOPMOST));
    }

    if (wndNewParent.hWnd === NtGetDesktopWindow(peb) && !(wnd.dwStyle & WS.CLIPSIBLINGS)) {
        wnd.dwStyle |= WS.CLIPSIBLINGS; // TODO: make this flag do something
    }

    if ((wnd.dwStyle & (WS.CHILD | WS.POPUP)) == WS.CHILD) {
        if (wnd.wndParent.hWnd != NtGetDesktopWindow(peb)) {
            if (wndOldParent && (wnd.peb != wndOldParent.peb)) {
                // TOOD: AttachThreadInput
                // NtUserAttachThreadInput(wnd.peb, wndOldParent.peb, false);
            }
        }
        if (wndNewParent.hWnd != NtGetDesktopWindow(peb)) {
            if (wnd.peb != wndNewParent.peb) {
                // TOOD: AttachThreadInput
                // NtUserAttachThreadInput(wnd.peb, wndNewParent.peb, true);
            }
        }
    }

    // if (NtUserIsMessageWindow(wndOldParent) || NtUserIsMessageWindow(wndNewParent)) {
    //     flags |= SWP.NOACTIVATE;
    // }

    // IntNotifyWinEvent(EVENT_OBJECT_PARENTCHANGE, wnd, OBJID_WINDOW, CHILDID_SELF, WEF_SETBYWNDPTI);

    await NtUserSetWindowPos(wnd, (0 == (wnd.dwExStyle & WS.EX.TOPMOST) ? HWND_TOP : HWND_TOPMOST), pt.x, pt.y, 0, 0, flags);

    if (wasVisible)
        await NtUserShowWindow(wnd.hWnd, SW.SHOWNORMAL);

    return wndOldParent;
}

export async function NtUserSetParent(peb: PEB, hWnd: HWND, hWndParent: HWND): Promise<HWND> {
    let wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return null;

    let wndOldParent = await NtUserIntSetParent(peb, wnd, ObGetObject<WND>(hWndParent));
    if (wndOldParent) {
        return wndOldParent.hWnd;
    }
    else {
        return null;
    }
}

export function NtIntGetClientRect(peb: PEB, hWnd: HWND): RECT {
    const wnd = ObGetObject<WND>(hWnd);
    if (wnd.dwStyle & WS.ICONIC) {
        return {
            top: 0,
            left: 0,
            right: NtIntGetSystemMetrics(peb, SM.CXMINIMIZED),
            bottom: NtIntGetSystemMetrics(peb, SM.CYMINIMIZED)
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
        xinc += NtIntGetSystemMetrics(peb, SM.CXFRAME) - NtIntGetSystemMetrics(peb, SM.CXDLGFRAME);
        yinc += NtIntGetSystemMetrics(peb, SM.CYFRAME) - NtIntGetSystemMetrics(peb, SM.CYDLGFRAME);
    }

    InflateRect(rc, xinc * NtIntGetSystemMetrics(peb, SM.CXBORDER), yinc * NtIntGetSystemMetrics(peb, SM.CYBORDER));

    xinc = -rc.left;
    yinc = -rc.top;

    minMax.ptMaxSize.x = rc.right - rc.left;
    minMax.ptMaxSize.y = rc.bottom - rc.top;

    if (wnd.dwStyle & (WS.DLGFRAME | WS.BORDER)) {
        // TODO: SM_CXMINTRACK/SM_CYMINTRACK
        minMax.ptMinTrackSize.x = NtIntGetSystemMetrics(peb, SM.CXMINTRACK);
        minMax.ptMinTrackSize.y = NtIntGetSystemMetrics(peb, SM.CYMINTRACK);
    }
    else {
        minMax.ptMinTrackSize.x = 2 * xinc;
        minMax.ptMinTrackSize.y = 2 * yinc;
    }

    // TODO: SM_CXMAXTRACK/SM_CYMAXTRACK
    minMax.ptMaxTrackSize.x = NtIntGetSystemMetrics(peb, SM.CXMAXTRACK);
    minMax.ptMaxTrackSize.y = NtIntGetSystemMetrics(peb, SM.CYMAXTRACK);

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

    if (newMinMax.ptMaxSize.x == NtIntGetSystemMetrics(peb, SM.CXSCREEN) + 2 * xinc &&
        newMinMax.ptMaxSize.y == NtIntGetSystemMetrics(peb, SM.CYSCREEN) + 2 * yinc) {
        newMinMax.ptMaxSize.x = (rcWork.right - rcWork.left) + 2 * xinc;
        newMinMax.ptMaxSize.y = (rcWork.bottom - rcWork.top) + 2 * yinc;
    }
    if (newMinMax.ptMaxPosition.x == -xinc && newMinMax.ptMaxPosition.y == -yinc) {
        newMinMax.ptMaxPosition.x = rcWork.left - xinc;
        newMinMax.ptMaxPosition.y = rcWork.top - yinc;
    }
    if (newMinMax.ptMaxSize.x >= (monitor.rcMonitor.right - monitor.rcMonitor.left) &&
        newMinMax.ptMaxSize.y >= (monitor.rcMonitor.bottom - monitor.rcMonitor.top)) {
        // Window.state |= WNDS_MAXIMIZESTOMONITOR;
    }
    else {
        // Window.state &= ~WNDS_MAXIMIZESTOMONITOR;
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
    const mark = performance.now();

    const { dwExStyle, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam } = data;
    const state = GetW32ProcInfo(peb);
    if (!state) {
        return 0;
    }

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
    if (_hwndParent && ObGetObject<WND>(_hwndParent) === null) {
        _hwndParent = null;
    }

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

    const wnd = new WND(peb, state, createStruct, lpWindowName, lpClassInfo, parentWnd, ownerWnd);

    // we have a window! we can now send funny messages to it

    // reset these
    createStruct.lpClassName = lpClassName;
    createStruct.lpWindowName = lpWindowName;

    if ((wnd.dwStyle & (WS.CHILD | WS.POPUP)) === WS.CHILD) {
        if (_hwndParent != NtGetDesktopWindow(peb)) {
            // createStruct.x += parentWnd.rcClient.left;
            // createStruct.y += parentWnd.rcClient.top;
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

    await wnd.MoveWindow(createStruct.x, createStruct.y, createStruct.nWidth, createStruct.nHeight, false);

    await NtDispatchMessage(peb, [wnd.hWnd, WM.NCCREATE, 0, createStruct]);

    // if (parentWnd !== null) {
    //     parentWnd.AddChild(wnd.hWnd);
    // }

    // maxPos.x = wnd.rcWindow.left;
    // maxPos.y = wnd.rcWindow.top;

    // sends WM_NCCALCSIZE
    await wnd.CalculateClientSize();

    let result = await NtDispatchMessage(peb, [wnd.hWnd, WM.CREATE, 0, createStruct]);
    if (result === -1) {
        wnd.Dispose();
        return 0;
    }

    performance.measure("NtCreateWindowEx", { start: mark, end: performance.now() });

    return wnd.hWnd;
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

export function NtUserGetWindowRect(peb: PEB, hWnd: HWND): RECT {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return null;
    }

    return wnd.rcWindow;
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
            await NtUserShowWindow(hWnd, SW.HIDE);
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
    for (const child of wnd.pChildren) {
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

export function NtUserIsWindowEnabled(hWnd: HWND): boolean {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return false;
    }

    return !(wnd.dwStyle & WS.DISABLED) && (wnd.hParent === null || NtUserIsWindowEnabled(wnd.hParent));
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

export function NtUserHasWindowEdge(style: number, exStyle: number) {
    if (style & WS.MINIMIZE)
        return true;
    if (exStyle & WS.EX.DLGMODALFRAME)
        return true;
    if (exStyle & WS.EX.STATICEDGE)
        return true;
    if (style & WS.THICKFRAME)
        return true;
    style &= WS.CAPTION;
    if (style == WS.DLGFRAME || style == WS.CAPTION)
        return true;
    return false;
}

export function NtUserGetWindowBorders(peb: PEB, style: number, exStyle: number, withClient: boolean) {
    let border = 0;
    let size = { cx: 0, cy: 0 };

    if (NtUserHasWindowEdge(style, exStyle))
        border += 2;
    else if ((exStyle & (WS.EX.STATICEDGE | WS.EX.DLGMODALFRAME)) == WS.EX.STATICEDGE)
        border += 1; /* for the outer frame always present */
    if ((exStyle & WS.EX.CLIENTEDGE) && withClient)
        border += 2;
    if (style & WS.CAPTION || exStyle & WS.EX.DLGMODALFRAME)
        border++; /* The other border */
    size.cx = size.cy = border;
    if ((style & WS.THICKFRAME) && !(style & WS.MINIMIZE)) /* The resize border */ {
        size.cx += NtIntGetSystemMetrics(peb, SM.CXFRAME) - NtIntGetSystemMetrics(peb, SM.CXDLGFRAME);
        size.cy += NtIntGetSystemMetrics(peb, SM.CYFRAME) - NtIntGetSystemMetrics(peb, SM.CYDLGFRAME);
    }
    size.cx *= NtIntGetSystemMetrics(peb, SM.CXBORDER);
    size.cy *= NtIntGetSystemMetrics(peb, SM.CYBORDER);

    return size;
}


export function NtFindWindow(peb: PEB, lpClassName: string, lpWindowName: string): HWND {
    const state = GetW32ProcInfo(peb);
    if (!state) {
        return 0;
    }

    for (const hWnd of ObEnumHandlesByType("WND")) {
        const wnd = ObGetObject<WND>(hWnd);
        if (!wnd) continue;

        if (wnd.dwStyle & WS.CHILD) continue;
        if (wnd.lpClass.lpszClassName === lpClassName && (!lpWindowName || wnd.lpszName === lpWindowName)) {
            return wnd.hWnd;
        }
    }

    return 0;
}


export function NtUserGetParent(wnd: WND) {
    if (wnd.dwStyle & WS.POPUP) {
        return wnd.wndOwner;
    }
    else if (wnd.dwStyle & WS.CHILD) {
        return wnd.wndParent;
    }

    return null;
}

export function NtUserIntGetWindow(wnd: WND, uCmd: GW): WND {
    if (!wnd) {
        return null;
    }

    let foundWnd: WND = null;
    switch (uCmd) {
        case GW.HWNDNEXT:
            foundWnd = wnd.wndNext;
            break;
        case GW.HWNDPREV:
            foundWnd = wnd.wndPrev;
            break;
        case GW.HWNDLAST:
            foundWnd = wnd.wndParent.wndChild;
            while (foundWnd.wndNext) {
                foundWnd = foundWnd.wndNext;
            }
            break;
        case GW.HWNDFIRST:
            foundWnd = wnd.wndParent;
            if (foundWnd && foundWnd.wndChild)
                foundWnd = foundWnd.wndChild;
            break;
        case GW.OWNER:
            foundWnd = wnd.wndOwner;
            break;
        case GW.CHILD:
            foundWnd = wnd.wndChild;
            break;
        default:
            console.warn("NtUserIntGetWindow: unknown uCmd", uCmd);
            break;
    }

    return foundWnd;
}

export function NtUserIntGetAncestor(wnd: WND, uCmd: GA): WND {
    if (!wnd || wnd.hWnd === NtGetDesktopWindow(wnd.peb)) {
        return null;
    }

    let foundWnd: WND = null;
    switch (uCmd) {
        case GA.PARENT: {
            foundWnd = wnd.wndParent;
            break;
        }
        case GA.ROOT: {
            foundWnd = wnd;
            let parent: WND = null;
            while (true) {
                if (!(parent = foundWnd.wndParent)) break;
                if (NtUserIsDesktopWindow(parent)) break;

                foundWnd = parent;
            }
            break;
        }
        case GA.ROOTOWNER: {
            foundWnd = wnd;
            let parent: WND = null;
            while (true) {
                parent = NtUserGetParent(foundWnd);
                if (!parent) break;
                foundWnd = parent;
            }
            break;
        }
        default:
            console.warn("NtUserIntGetAncestor: unknown uCmd", uCmd);
            break;
    }

    return foundWnd;
}

export function NtUserGetWindow(hWnd: HWND, uCmd: GW): HWND {
    return NtUserIntGetWindow(ObGetObject<WND>(hWnd), uCmd)?.hWnd || 0;
}

export function NtUserGetAncestor(hWnd: HWND, uCmd: GA): HWND {
    return NtUserIntGetAncestor(ObGetObject<WND>(hWnd), uCmd)?.hWnd || 0;
}