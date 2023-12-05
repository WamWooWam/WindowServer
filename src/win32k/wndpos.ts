import DESKTOP, { NtGetDefaultDesktop } from "./desktop.js";
import { GA, GW, HWND, HWND_BOTTOM, HWND_NOTOPMOST, HWND_TOP, HWND_TOPMOST, LOWORD, SM, SW, SWP, WINDOWPLACEMENT, WM, WS } from "../types/user32.types.js";
import { LPRECT, OffsetRect, POINT, RECT, SIZE, SetRect } from "../types/gdi32.types.js";
import { NtGetDesktopWindow, NtUserGetAncestor, NtUserGetClientRect, NtUserIntGetClientRect, NtUserIntLinkHwnd, NtUserIntSetStyle, NtUserIsDesktopWindow, NtUserWinPosGetMinMaxInfo, UserGetWindow } from "./window.js";
import { NtUserGetDesktop, NtUserGetProcInfo } from "./shared.js";
import { NtUserGetForegroundWindow, NtUserIntGetFocusProcInfo, NtUserIntSetForegroundWindow, NtUserIntWinPosActivateOtherWindow } from "./focus.js";
import { PWND, WMP, WPF } from "../types/user32.int.types.js";

import { IntIsWindowVisible } from "./sizemove.js";
import { NtDispatchMessage } from "./msg.js";
import { NtMonitorFromRect } from "./monitor.js";
import { NtUserClientToScreen } from "./client.js";
import { NtUserGetCursorPos } from "./cursor.js";
import { NtUserGetSystemMetrics } from "./metrics.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import WND from "./wnd.js";

interface WINDOWPOS {
    hWnd: HWND;
    hWndInsertAfter: HWND;
    x: number;
    y: number;
    cx: number;
    cy: number;
    uFlags: number;
}

type LPWINDOWPOS = WINDOWPOS | null;

interface NCCALCSIZE_PARAMS {
    rgrc: LPRECT[];
    lppos: LPWINDOWPOS;
}

const SWP_AGG_NOGEOMETRYCHANGE =
    (SWP.NOSIZE | SWP.NOCLIENTSIZE | SWP.NOZORDER)
const SWP_AGG_NOPOSCHANGE =
    (SWP.NOSIZE | SWP.NOMOVE | SWP.NOCLIENTSIZE | SWP.NOCLIENTMOVE | SWP.NOZORDER)
const SWP_AGG_STATUSFLAGS =
    (SWP_AGG_NOPOSCHANGE | SWP.FRAMECHANGED | SWP.HIDEWINDOW | SWP.SHOWWINDOW)
const SWP_AGG_NOCLIENTCHANGE =
    (SWP.NOCLIENTSIZE | SWP.NOCLIENTMOVE)

function IsPointInWindow(wnd: WND, x: number, y: number) {
    const rect = wnd.rcWindow;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

async function NtUserDoWinPosChanging(wnd: WND, winPos: WINDOWPOS): Promise<{ windowRect: RECT, clientRect: RECT }> {
    if (!(winPos.uFlags & SWP.NOSENDCHANGING) && !((winPos.uFlags & SWP.SHOWWINDOW))) {
        await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.WINDOWPOSCHANGING, 0, winPos]);
    }

    const windowRect = { ...wnd.rcWindow };
    const clientRect = (wnd.dwStyle & WS.MINIMIZE) ? { ...wnd.rcWindow } : { ...wnd.rcClient };

    if (!(winPos.uFlags & SWP.NOSIZE)) {
        if (wnd.dwStyle & WS.MINIMIZE) {
            windowRect.right = windowRect.left + NtUserGetSystemMetrics(wnd.peb, SM.CXMINIMIZED);
            windowRect.bottom = windowRect.top + NtUserGetSystemMetrics(wnd.peb, SM.CYMINIMIZED);
        }
        else {
            windowRect.right = windowRect.left + winPos.cx;
            windowRect.bottom = windowRect.top + winPos.cy;
        }
    }

    if (!(winPos.uFlags & SWP.NOMOVE)) {
        let X, Y;
        X = winPos.x;
        Y = winPos.y;

        let wParent = wnd.wndParent;
        if (
            wParent && !NtUserIsDesktopWindow(wnd.peb, wParent)) {
            X += wParent.rcClient.left;
            Y += wParent.rcClient.top;
        }

        windowRect.left = X;
        windowRect.top = Y;
        windowRect.right += X - wnd.rcWindow.left;
        windowRect.bottom += Y - wnd.rcWindow.top;

        OffsetRect(clientRect, X - wnd.rcWindow.left, Y - wnd.rcWindow.top);
    }

    return { windowRect, clientRect };
}

function NtUserFixupWinPosFlags(winPos: WINDOWPOS, wnd: WND) {
    let wParent: PWND;
    let pt: POINT = { x: 0, y: 0 };

    /* Finally make sure that all coordinates are valid */
    if (winPos.x < -32768) winPos.x = -32768;
    else if (winPos.x > 32767) winPos.x = 32767;
    if (winPos.y < -32768) winPos.y = -32768;
    else if (winPos.y > 32767) winPos.y = 32767;

    winPos.cx = Math.max(winPos.cx, 0);
    winPos.cy = Math.max(winPos.cy, 0);

    wParent = NtUserGetAncestor(wnd, GA.PARENT);
    if (!IntIsWindowVisible(wParent) &&
        /* Fix B : wine msg test_SetParent:WmSetParentSeq_2:25 wParam bits! */
        (winPos.uFlags & SWP_AGG_STATUSFLAGS) == SWP_AGG_NOPOSCHANGE) winPos.uFlags |= SWP.NOREDRAW;

    if (wnd.dwStyle & WS.VISIBLE) winPos.uFlags &= ~SWP.SHOWWINDOW;
    else {
        winPos.uFlags &= ~SWP.HIDEWINDOW;
        if (!(winPos.uFlags & SWP.SHOWWINDOW)) winPos.uFlags |= SWP.NOREDRAW;
    }

    /* Check for right size */
    if (wnd.rcWindow.right - wnd.rcWindow.left == winPos.cx &&
        wnd.rcWindow.bottom - wnd.rcWindow.top == winPos.cy) {
        winPos.uFlags |= SWP.NOSIZE;
    }

    pt.x = winPos.x;
    pt.y = winPos.y;
    if (wParent)
        NtUserClientToScreen(wParent, pt);
    // TRACE("WPFU C2S wpx %d wpy %d ptx %d pty %d\n", winPos.x, winPos.y, pt.x, pt.y);
    /* Check for right position */
    if (wnd.rcWindow.left == pt.x && wnd.rcWindow.top == pt.y) {
        //ERR("In right pos\n");
        winPos.uFlags |= SWP.NOMOVE;
    }

    if (winPos.hWnd != NtUserGetForegroundWindow() && (wnd.dwStyle & (WS.POPUP | WS.CHILD)) != WS.CHILD) {
        /* Bring to the top when activating */
        if (!(winPos.uFlags & (SWP.NOACTIVATE | SWP.HIDEWINDOW)) &&
            (winPos.uFlags & SWP.NOZORDER ||
                (winPos.hWndInsertAfter != HWND_TOPMOST && winPos.hWndInsertAfter != HWND_NOTOPMOST))) {
            winPos.uFlags &= ~SWP.NOZORDER;
            winPos.hWndInsertAfter = (0 != (wnd.dwExStyle & WS.EX.TOPMOST) ? HWND_TOPMOST : HWND_TOP);
        }
    }

    /* Check hwndInsertAfter */
    if (!(winPos.uFlags & SWP.NOZORDER)) {
        if (winPos.hWndInsertAfter == HWND_TOP) {
            /* Keep it topmost when it's already topmost */
            if ((wnd.dwExStyle & WS.EX.TOPMOST) != 0)
                winPos.hWndInsertAfter = HWND_TOPMOST;

            if (UserGetWindow(winPos.hWnd, GW.HWNDFIRST) == winPos.hWnd) {
                winPos.uFlags |= SWP.NOZORDER;
            }
        }
        else if (winPos.hWndInsertAfter == HWND_BOTTOM) {
            if (!(wnd.dwExStyle & WS.EX.TOPMOST) && UserGetWindow(winPos.hWnd, GW.HWNDLAST) == winPos.hWnd)
                winPos.uFlags |= SWP.NOZORDER;
        }
        else if (winPos.hWndInsertAfter == HWND_TOPMOST) {
            if ((wnd.dwExStyle & WS.EX.TOPMOST) && UserGetWindow(winPos.hWnd, GW.HWNDFIRST) == winPos.hWnd)
                winPos.uFlags |= SWP.NOZORDER;
        }
        else if (winPos.hWndInsertAfter == HWND_NOTOPMOST) {
            if (!(wnd.dwExStyle & WS.EX.TOPMOST))
                winPos.uFlags |= SWP.NOZORDER;
        }
        else /* hwndInsertAfter must be a sibling of the window */ {
            const insAfterWnd = ObGetObject<WND>(winPos.hWndInsertAfter);
            if (!insAfterWnd) {
                return true;
            }

            if (insAfterWnd.wndParent != wnd.wndParent) {
                /* Note from wine User32 Win test_SetWindowPos:
                   "Returns TRUE also for windows that are not siblings"
                   "Does not seem to do anything even without passing flags, still returns TRUE"
                   "Same thing the other way around."
                   ".. and with these windows."
                 */
                return false;
            }
            else {
                /*
                 * We don't need to change the Z order of hwnd if it's already
                 * inserted after hwndInsertAfter or when inserting hwnd after
                 * itself.
                 */
                if ((winPos.hWnd == winPos.hWndInsertAfter) ||
                    ((insAfterWnd.wndNext) && (winPos.hWnd == insAfterWnd.wndNext.hWnd))) {
                    winPos.uFlags |= SWP.NOZORDER;
                }
            }
        }
    }

    return true;
}

function FixClientRect(ClientRect: RECT, WindowRect: RECT) {
    if (ClientRect.left < WindowRect.left) {
        ClientRect.left = WindowRect.left;
    }
    else if (WindowRect.right < ClientRect.left) {
        ClientRect.left = WindowRect.right;
    }
    if (ClientRect.right < WindowRect.left) {
        ClientRect.right = WindowRect.left;
    }
    else if (WindowRect.right < ClientRect.right) {
        ClientRect.right = WindowRect.right;
    }
    if (ClientRect.top < WindowRect.top) {
        ClientRect.top = WindowRect.top;
    }
    else if (WindowRect.bottom < ClientRect.top) {
        ClientRect.top = WindowRect.bottom;
    }
    if (ClientRect.bottom < WindowRect.top) {
        ClientRect.bottom = WindowRect.top;
    }
    else if (WindowRect.bottom < ClientRect.bottom) {
        ClientRect.bottom = WindowRect.bottom;
    }
}

async function NtUserWinPosDoNCCALCSize(wnd: WND, winPos: WINDOWPOS, windowRect: RECT, clientRect: RECT, validRects: LPRECT[]): Promise<number> {
    let parent: PWND;
    let wvrFlags = 0;

    /* Send WM.NCCALCSIZE message to get new client area */
    if ((winPos.uFlags & (SWP.FRAMECHANGED | SWP.NOSIZE)) != SWP.NOSIZE) {
        let params: NCCALCSIZE_PARAMS = {
            rgrc: [null, null, null],
            lppos: null,
        }
        let winposCopy: WINDOWPOS;

        params.rgrc[0] = windowRect;      // new coordinates of a window that has been moved or resized
        params.rgrc[1] = wnd.rcWindow; // window before it was moved or resized
        params.rgrc[2] = wnd.rcClient; // client area before the window was moved or resized

        parent = wnd.wndParent;
        if (0 != (wnd.dwStyle & WS.CHILD) && parent) {
            OffsetRect((params.rgrc[0]), - parent.rcClient.left, - parent.rcClient.top);
            OffsetRect((params.rgrc[1]), - parent.rcClient.left, - parent.rcClient.top);
            OffsetRect((params.rgrc[2]), - parent.rcClient.left, - parent.rcClient.top);
        }

        winposCopy = { ...winPos };
        params.lppos = winposCopy;

        params = await NtDispatchMessage(wnd.peb, [wnd.hWnd, WM.NCCALCSIZE, true, params]);
        if (params.rgrc[0] === null) {
            params.rgrc[0] = { top: 0, left: 0, right: 0, bottom: 0 }
        }

        /* If the application send back garbage, ignore it */
        if (params.rgrc[0].left <= params.rgrc[0].right &&
            params.rgrc[0].top <= params.rgrc[0].bottom) {
            clientRect = params.rgrc[0]; // First rectangle contains the coordinates of the new client rectangle resulting from the move or resize
            if ((wnd.dwStyle & WS.CHILD) && parent) {
                OffsetRect(clientRect, parent.rcClient.left, parent.rcClient.top);
            }
            FixClientRect(clientRect, windowRect);
        }

        if (clientRect.left != wnd.rcClient.left ||
            clientRect.top != wnd.rcClient.top) {
            winPos.uFlags &= ~SWP.NOCLIENTMOVE;
        }

        if (clientRect.right - clientRect.left != wnd.rcClient.right - wnd.rcClient.left) {
            winPos.uFlags &= ~SWP.NOCLIENTSIZE;
        }

        if (clientRect.bottom - clientRect.top != wnd.rcClient.bottom - wnd.rcClient.top) {
            winPos.uFlags &= ~SWP.NOCLIENTSIZE;
        }

        validRects[0] = params.rgrc[1]; // second rectangle contains the valid destination rectangle
        validRects[1] = params.rgrc[2]; // third rectangle contains the valid source rectangle
    }
    else {
        if (!(winPos.uFlags & SWP.NOMOVE) &&
            (clientRect.left != wnd.rcClient.left ||
                clientRect.top != wnd.rcClient.top)) {
            winPos.uFlags &= ~SWP.NOCLIENTMOVE;
        }
    }

    if (winPos.uFlags & (SWP.NOCOPYBITS | SWP.NOREDRAW | SWP.SHOWWINDOW | SWP.HIDEWINDOW)) {
        validRects[0] = { top: 0, left: 0, bottom: 0, right: 0 };
        validRects[1] = { top: 0, left: 0, bottom: 0, right: 0 };
    }
    else {
        // get_valid_rects( & Window.rcClient, ClientRect, wvrFlags, validRects);
    }

    return wvrFlags;
}

export async function NtUserSetWindowPos(peb: PEB, wnd: WND, hWndInsertAfter: HWND, x: number, y: number, cx: number, cy: number, flags: SWP): Promise<boolean> {
    const params: WINDOWPOS = {
        hWnd: wnd.hWnd,
        hWndInsertAfter,
        x,
        y,
        cx,
        cy,
        uFlags: flags,
    };

    const cursorPos = NtUserGetCursorPos(peb);
    const isInWindow = IsPointInWindow(wnd, cursorPos.x, cursorPos.y);

    if (flags & SWP.ASYNCWINDOWPOS) {
        params.uFlags &= ~SWP.ASYNCWINDOWPOS;

        const result = await NtDispatchMessage(peb, [wnd.hWnd, WMP.ASYNC_SETWINDOWPOS, 0, params]);
        if (!result) {
            return false;
        }

        return true;
    }

    const { windowRect, clientRect } = await NtUserDoWinPosChanging(wnd, params);

    if (!NtUserFixupWinPosFlags(params, wnd)) {
        return true;
    }

    let ancestor = NtUserGetAncestor(wnd, GA.PARENT);
    if ((params.uFlags & (SWP.NOZORDER | SWP.HIDEWINDOW | SWP.SHOWWINDOW)) !== SWP.NOZORDER && ancestor && NtUserIsDesktopWindow(peb, ancestor)) {
        // TODO: NtUserWinPosDoOwnedPopups
        // params.hWndInsertAfter = NtUserWinPosDoOwnedPopups(wnd, params.hWndInsertAfter);
    }

    let validRects: LPRECT[] = [null, null];
    let wvrFlags = await NtUserWinPosDoNCCALCSize(wnd, params, windowRect, clientRect, validRects);

    if (!(params.uFlags & SWP.NOZORDER)) {
        NtUserIntLinkHwnd(wnd, params.hWndInsertAfter);
    }

    let oldWindowRect = { ...wnd.rcWindow };
    let oldClientRect = { ...wnd.rcClient };

    if (windowRect.left != oldWindowRect.left || windowRect.top != oldWindowRect.top) {
        // ReactOS transforms all child coordinates to screen coordinates here
        // For now, we're not going to do that because each child window has its own transform
    }

    await wnd.MoveWindow(windowRect.left, windowRect.top, windowRect.right - windowRect.left, windowRect.bottom - windowRect.top, true);

    // these two should also notify the shell
    if (params.uFlags & SWP.HIDEWINDOW) {
        NtUserIntSetStyle(wnd, WS.VISIBLE, 0);
    }
    else if (params.uFlags & SWP.SHOWWINDOW) {
        NtUserIntSetStyle(wnd, 0, WS.VISIBLE);
    }

    return true;
}

export async function NtSetWindowPos(peb: PEB, hWnd: HWND, hWndInsertAfter: HWND, x: number, y: number, cx: number, cy: number, uFlags: number) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return false;

    return NtUserSetWindowPos(peb, wnd, hWndInsertAfter, x, y, cx, cy, uFlags);
}

export async function NtUserWinPosShowWindow(peb: PEB, wnd: WND, cmd: number) {
    let wasVisible: boolean;
    let swp = 0;
    let eventMsg = 0;
    let newPos: RECT = { left: 0, top: 0, right: 0, bottom: 0 };
    let showFlag: boolean;
    let style: number;
    let parent: PWND;
    let pti = NtUserGetProcInfo(peb);
    let snowOwned = false;
    let firstTime = false;

    if (!pti) return false;

    wasVisible = (wnd.dwStyle & WS.VISIBLE) !== 0;
    style = wnd.dwStyle;

    //    if ( pti.ppi.usi.dwFlags & STARTF_USESHOWWINDOW )
    //    {
    //       if ((Wnd.dwStyle & (WS.POPUP|WS.CHILD)) != WS.CHILD)
    //       {
    //          if ((Wnd.dwStyle & WS.CAPTION) == WS.CAPTION)
    //          {
    //             if (Wnd.wndOwner == NULL)
    //             {
    //                if ( Cmd == SW.SHOWNORMAL || Cmd == SW.SHOW)
    //                {
    //                     Cmd = SW.SHOWDEFAULT;
    //                }
    //                FirstTime = TRUE;
    //                TRACE("co_WPSW FT 1\n");
    //             }
    //          }
    //       }
    //    }

    //    if ( Cmd == SW.SHOWDEFAULT )
    //    {
    //       if ( pti.ppi.usi.dwFlags & STARTF_USESHOWWINDOW )
    //       {
    //          Cmd = pti.ppi.usi.wShowWindow;
    //          FirstTime = TRUE;
    //          TRACE("co_WPSW FT 2\n");
    //       }
    //    }

    //    if (FirstTime)
    //    {
    //       pti.ppi.usi.dwFlags &= ~(STARTF_USEPOSITION|STARTF_USESIZE|STARTF_USESHOWWINDOW);
    //    }

    switch (cmd) {
        case SW.HIDE:
            {
                if (!wasVisible) {
                    //ERR("co_WinPosShowWindow Exit Bad\n");
                    return false;
                }
                swp |= SWP.HIDEWINDOW | SWP.NOSIZE | SWP.NOMOVE;
                if (wnd.hWnd != pti.hwndActive)
                    swp |= SWP.NOACTIVATE | SWP.NOZORDER;
                break;
            }

        case SW.FORCEMINIMIZE: /* FIXME: Does not work if thread is hung. */
        case SW.SHOWMINNOACTIVE:
            swp |= SWP.NOACTIVATE | SWP.NOZORDER;
        // fallthrough
        case SW.SHOWMINIMIZED:
        case SW.MINIMIZE: /* CORE-15669: SW.MINIMIZE also shows */
            swp |= SWP.SHOWWINDOW;
            {
                swp |= SWP.NOACTIVATE;
                if (!(style & WS.MINIMIZE)) {
                    await NtUserIntShowOwnedPopups(peb, wnd, false);
                    // Fix wine Win test_SetFocus todo #1 & #2,
                    if (cmd == SW.SHOWMINIMIZED) {
                        //ERR("co_WinPosShowWindow Set focus 1\n");
                        // if ((style & (WS.CHILD | WS.POPUP)) == WS.CHILD)
                        //     NtUserSetFocus(Wnd.wndParent);
                        // else
                        //     NtUserSetFocus(0);
                    }

                    swp |= await NtUserIntWinPosMinMaximize(peb, wnd, cmd, newPos);

                    // EventMsg = EVENT_SYSTEM_MINIMIZESTART;
                }
                else {
                    if (wasVisible) {
                        //ERR("co_WinPosShowWindow Exit Good\n");
                        return true;
                    }
                    swp |= SWP.NOSIZE | SWP.NOMOVE;
                }
                break;
            }

        case SW.SHOWMAXIMIZED:
            {
                swp |= SWP.SHOWWINDOW;
                if (!(style & WS.MAXIMIZE)) {
                    snowOwned = true;

                    swp |= await NtUserIntWinPosMinMaximize(peb, wnd, SW.MAXIMIZE, newPos);

                    // EventMsg = EVENT_SYSTEM_MINIMIZEEND;
                }
                else {
                    if (wasVisible) {
                        //ERR("co_WinPosShowWindow Exit Good 1\n");
                        return true;
                    }
                    swp |= SWP.NOSIZE | SWP.NOMOVE;
                }
                break;
            }

        case SW.SHOWNA:
            swp |= SWP.NOACTIVATE | SWP.SHOWWINDOW | SWP.NOSIZE | SWP.NOMOVE;
            if (style & WS.CHILD && !(wnd.dwExStyle & WS.EX.MDICHILD)) swp |= SWP.NOZORDER;
            break;
        case SW.SHOW:
            if (wasVisible) return (true); // Nothing to do!
            swp |= SWP.SHOWWINDOW | SWP.NOSIZE | SWP.NOMOVE;
            /* Don't activate the topmost window. */
            if (style & WS.CHILD && !(wnd.dwExStyle & WS.EX.MDICHILD)) swp |= SWP.NOACTIVATE | SWP.NOZORDER;
            break;

        case SW.SHOWNOACTIVATE:
            swp |= SWP.NOACTIVATE | SWP.NOZORDER;
        /* Fall through. */
        case SW.SHOWNORMAL:
        case SW.SHOWDEFAULT:
        case SW.RESTORE:
            if (!wasVisible) swp |= SWP.SHOWWINDOW;
            if (style & (WS.MINIMIZE | WS.MAXIMIZE)) {
                swp |= await NtUserIntWinPosMinMaximize(peb, wnd, cmd, newPos);
                // if (style & WS.MINIMIZE) EventMsg = EVENT_SYSTEM_MINIMIZEEND;
            }
            else {
                if (wasVisible) {
                    //ERR("co_WinPosShowWindow Exit Good 3\n");
                    return true;
                }
                swp |= SWP.NOSIZE | SWP.NOMOVE;
            }
            if (style & WS.CHILD &&
                !(wnd.dwExStyle & WS.EX.MDICHILD) &&
                !(swp & SWP.STATECHANGED))
                swp |= SWP.NOACTIVATE | SWP.NOZORDER;
            break;

        default:
            //ERR("co_WinPosShowWindow Exit Good 4\n");
            return false;
    }

    showFlag = (cmd != SW.HIDE);

    if ((showFlag != wasVisible || cmd == SW.SHOWNA) && cmd != SW.SHOWMAXIMIZED && !(swp & SWP.STATECHANGED)) {
        await NtDispatchMessage(peb, [wnd.hWnd, WM.SHOWWINDOW, showFlag, 0]);
        if (!ObGetObject(wnd.hWnd)) return wasVisible;
    }

    /* We can't activate a child window */
    if ((wnd.dwStyle & WS.CHILD) &&
        !(wnd.dwExStyle & WS.EX.MDICHILD) &&
        cmd != SW.SHOWNA) {
        //ERR("SWP Child No active and ZOrder\n");
        swp |= SWP.NOACTIVATE | SWP.NOZORDER;
    }

    if (IntIsWindowVisible(wnd)) {
        await NtUserSetWindowPos(peb, wnd,
            0 != (wnd.dwExStyle & WS.EX.TOPMOST) ? HWND_TOPMOST : HWND_TOP,
            newPos.left,
            newPos.top,
            newPos.right, // NewPos.right - NewPos.left, when minimized and restore, the window becomes smaller.
            newPos.bottom,// NewPos.bottom - NewPos.top,
            LOWORD(swp));
    }
    else {
        /* if parent is not visible simply toggle WS.VISIBLE and return */
        if (showFlag)
            NtUserIntSetStyle(wnd, WS.VISIBLE, 0);
        else
            NtUserIntSetStyle(wnd, 0, WS.VISIBLE);

    }

    // if (EventMsg) IntNotifyWinEvent(EventMsg, Wnd, OBJID_WINDOW, CHILDID_SELF, WEF_SETBYWNDPTI);

    // if (ShowOwned) IntShowOwnedPopups(Wnd, TRUE);

    if ((cmd == SW.HIDE) || (cmd == SW.MINIMIZE)) {
        if (wnd.hWnd == pti.hwndActive && pti == NtUserIntGetFocusProcInfo(peb)) {
            if (NtUserIsDesktopWindow(peb, wnd.wndParent)) {
                if (!await NtUserActivateOtherWindowMin(peb, wnd)) {
                    await NtUserIntWinPosActivateOtherWindow(peb, wnd);
                }
            }
            else {
                await NtUserIntWinPosActivateOtherWindow(peb, wnd);
            }
        }

        /* Revert focus to parent */
        if (wnd.hWnd == pti.hwndFocus) {
            parent = wnd.wndParent;
            if (NtUserIsDesktopWindow(peb, wnd.wndParent))
                parent = null;
            // NtUserUserCoSetFocus(Parent);
        }
        // Hide, just return.
        if (cmd == SW.HIDE) return wasVisible;
    }

    // /* FIXME: Check for window destruction. */

    // if ((Wnd.state & WNDS_SENDSIZEMOVEMSGS) &&
    //     !(Wnd.state2 & WNDS2_INDESTROY)) {
    //     co_WinPosSendSizeMove(Wnd);
    // }

    // /* if previous state was minimized Windows sets focus to the window */
    // if (style & WS.MINIMIZE) {
    //     co_UserSetFocus(Wnd);
    //     // Fix wine Win test_SetFocus todo #3,
    //     if (!(style & WS.CHILD)) co_IntSendMessage(UserHMGetHandle(Wnd), WM.ACTIVATE, WA_ACTIVE, 0);
    // }
    //ERR("co_WinPosShowWindow EXIT\n");
    return wasVisible;
}

export async function NtUserShowWindow(peb: PEB, hWnd: HWND, nCmdShow: number) {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return false;
    }

    return NtUserWinPosShowWindow(peb, wnd, nCmdShow);
}

function NtUserWinPosInitSavedPos(peb: PEB, wnd: WND, restoreRect: RECT) {
    let size: SIZE = { cx: 0, cy: 0 };
    let rect = { ...restoreRect };

    if (wnd.wndParent && !NtUserIsDesktopWindow(peb, wnd.wndParent)) {
        OffsetRect(rect, -wnd.wndParent.rcClient.left, -wnd.wndParent.rcClient.top);
    }

    size.cx = rect.left;
    size.cy = rect.top;

    if (!wnd.savedPos.initialized) {
        // FIXME: Use check point Atom..
        wnd.savedPos.flags = 0;
        wnd.savedPos.maxPos.x = wnd.savedPos.maxPos.y = -1;
        wnd.savedPos.iconPos.x = wnd.savedPos.iconPos.y = -1;
        wnd.savedPos.normalRect = rect;
        wnd.savedPos.initialized = true;
    }

    if (wnd.dwStyle & WS.MINIMIZE) {
        wnd.savedPos.iconPos = { x: size.cx, y: size.cy };
        wnd.savedPos.flags |= WPF.MININIT;
    }
    else if (wnd.dwStyle & WS.MAXIMIZE) {
        wnd.savedPos.flags |= WPF.MAXINIT;

        if (NtUserIsDesktopWindow(peb, wnd.wndParent)) {
            if (wnd.stateFlags.bMaximizesToMonitor) {
                wnd.savedPos.flags &= ~WPF.MAXINIT;
                wnd.savedPos.maxPos.x = wnd.savedPos.maxPos.y = -1;
            }
            else {
                let WorkArea: RECT;
                let pmonitor = NtMonitorFromRect(rect); // MONITOR_DEFAULTTOPRIMARY
                // FIXME: support DPI aware, rcWorkDPI/Real etc..
                WorkArea = pmonitor.rcMonitor;

                if (wnd.dwStyle & WS.MAXIMIZEBOX) {  // Support (Wnd.state & WNDS_HASCAPTION) || pmonitor.cFullScreen too.
                    if ((wnd.dwStyle & WS.CAPTION) == WS.CAPTION || !(wnd.dwStyle & (WS.CHILD | WS.POPUP))) {
                        WorkArea = pmonitor.rcWork;
                        //ERR("rcWork\n");
                    }
                }

                wnd.savedPos.maxPos.x = rect.left - WorkArea.left;
                wnd.savedPos.maxPos.y = rect.top - WorkArea.top;

                console.log("WinPosIP 2 X %d = R.l %d - W.l %d | Y %d = R.t %d - W.t %d\n",
                    wnd.savedPos.maxPos.x,
                    rect.left, WorkArea.left,
                    wnd.savedPos.maxPos.y,
                    rect.top, WorkArea.top);
            }
        }
        else
            wnd.savedPos.maxPos = { x: size.cx, y: size.cy };
    }
    else {
        wnd.savedPos.normalRect = rect;
    }
}

function NtUserIntGetWindowPlacement(peb: PEB, wnd: WND, wpl: WINDOWPLACEMENT) {
    if (!wnd) return false;

    wpl.flags = 0;

    NtUserWinPosInitSavedPos(peb, wnd, wnd.rcWindow);

    wpl.showCmd = SW.HIDE;

    if (wnd.dwStyle & WS.MINIMIZE)
        wpl.showCmd = SW.SHOWMINIMIZED;
    else
        wpl.showCmd = (wnd.dwStyle & WS.MAXIMIZE) ? SW.SHOWMAXIMIZED : SW.SHOWNORMAL;

    wpl.rcNormalPosition = wnd.savedPos.normalRect;

    if (wnd.savedPos.flags & WPF.MININIT) // Return if it was set!
    {
        wpl.ptMinPosition.x = wnd.savedPos.iconPos.x;
        wpl.ptMinPosition.y = wnd.savedPos.iconPos.y;
    }
    else
        wpl.ptMinPosition.x = wpl.ptMinPosition.y = -1;

    if (wnd.savedPos.flags & WPF.MAXINIT && // Return if set and not maximized to monitor!
        !(wnd.stateFlags.bMaximizesToMonitor)) {
        wpl.ptMaxPosition.x = wnd.savedPos.maxPos.x;
        wpl.ptMaxPosition.y = wnd.savedPos.maxPos.y;
    }
    else
        wpl.ptMaxPosition.x = wpl.ptMaxPosition.y = -1;

    if (NtUserIsDesktopWindow(peb, wnd.wndParent) &&
        !(wnd.dwExStyle & WS.EX.TOOLWINDOW)) {
        let pmonitor = NtMonitorFromRect(wpl.rcNormalPosition);//  MONITOR_DEFAULTTOPRIMARY

        // FIXME: support DPI aware, rcWorkDPI/Real etc..
        if (wnd.savedPos.flags & WPF.MININIT) {
            wpl.ptMinPosition.x -= (pmonitor.rcWork.left - pmonitor.rcMonitor.left);
            wpl.ptMinPosition.y -= (pmonitor.rcWork.top - pmonitor.rcMonitor.top);
        }
        OffsetRect(wpl.rcNormalPosition,
            pmonitor.rcMonitor.left - pmonitor.rcWork.left,
            pmonitor.rcMonitor.top - pmonitor.rcWork.top);
    }

    if (wnd.savedPos.flags & WPF.RESTORETOMAXIMIZED || wnd.dwStyle & WS.MAXIMIZE)
        wpl.flags |= WPF.RESTORETOMAXIMIZED;

    if (((wnd.dwStyle & (WS.CHILD | WS.POPUP)) == WS.CHILD) && wnd.savedPos.flags & WPF.SETMINPOSITION)
        wpl.flags |= WPF.SETMINPOSITION;

    return true;
}

function NtUserIntWinPosFindIconPos(peb: PEB, wnd: WND, pos: POINT) {
    let rectParent: RECT;
    let pwndChild: PWND, pwndParent: PWND;
    let x: number, y: number, xspacing: number, yspacing: number;

    pwndParent = wnd.wndParent;
    if (!pwndParent) {
        return; // not sure what we should do here
    }

    if (NtUserIsDesktopWindow(peb, pwndParent)) {
        // TODO: this is the behaviour for ARW_HIDE, make it configurable
        // pos.x = pos.y = -32000;
        // wnd.savedPos.flags |= WPF.MININIT;
        // wnd.savedPos.iconPos.x = pos.x;
        // wnd.savedPos.iconPos.y = pos.y;
        // return;
    }

    rectParent = NtUserIntGetClientRect(pwndParent);

    // FIXME: Support Minimize Metrics gspv.mm.iArrange.
    // Default: ARW_BOTTOMLEFT
    x = rectParent.left;
    y = rectParent.bottom;

    xspacing = NtUserGetSystemMetrics(peb, SM.CXMINIMIZED);
    yspacing = NtUserGetSystemMetrics(peb, SM.CYMINIMIZED);

    // Set to default position when minimized.
    pos.x = x + NtUserGetSystemMetrics(peb, SM.CXBORDER);
    pos.y = y - yspacing - NtUserGetSystemMetrics(peb, SM.CYBORDER);

    for (pwndChild = pwndParent.wndChild; pwndChild; pwndChild = pwndChild.wndNext) {
        if (pwndChild == wnd) continue;

        if ((pwndChild.dwStyle & (WS.VISIBLE | WS.MINIMIZE)) != (WS.VISIBLE | WS.MINIMIZE)) {
            continue;
        }

        if (pwndChild.savedPos.iconPos.x != pos.x && pwndChild.savedPos.iconPos.y != pos.y) {
            break;
        }
        if (x <= rectParent.right - xspacing)
            x += xspacing;
        else {
            x = rectParent.left;
            y -= yspacing;
        }
        pos.x = x + NtUserGetSystemMetrics(peb, SM.CXBORDER);
        pos.y = y - yspacing - NtUserGetSystemMetrics(peb, SM.CYBORDER);
    }

    wnd.savedPos.iconPos.x = pos.x;
    wnd.savedPos.iconPos.y = pos.y;
    wnd.savedPos.flags |= WPF.MININIT;
    return;
}

async function NtUserIntWinPosMinMaximize(peb: PEB, wnd: WND, showFlag: number, newPos: RECT) {
    let newPosCopy: RECT = { ...newPos };
    let size: SIZE = { cx: 0, cy: 0 };
    let wpl: WINDOWPLACEMENT = {
        flags: 0,
        ptMaxPosition: { x: 0, y: 0 },
        ptMinPosition: { x: 0, y: 0 },
        rcNormalPosition: { left: 0, top: 0, right: 0, bottom: 0 },
        showCmd: 0,
    }
    let oldStyle: number;
    let swpFlags = 0;

    //    ASSERT_REFS_CO(Wnd);

    NtUserIntGetWindowPlacement(peb, wnd, wpl);

    //    if (co_HOOK_CallHooks( WH_CBT, HCBT_MINMAX, (WPARAM)Wnd.head.h, ShowFlag))
    //    {
    //       ERR("WinPosMinMaximize WH_CBT Call Hook return!\n");
    //       return SWP_NOSIZE | SWP_NOMOVE;
    //    }

    if (wnd.dwStyle & WS.MINIMIZE) {
        switch (showFlag) {
            case SW.MINIMIZE:
            case SW.SHOWMINNOACTIVE:
            case SW.SHOWMINIMIZED:
            case SW.FORCEMINIMIZE:
                return SWP.NOSIZE | SWP.NOMOVE;
        }
        if (!await NtDispatchMessage(null, [wnd.hWnd, WM.QUERYOPEN, 0, 0])) {
            return (SWP.NOSIZE | SWP.NOMOVE);
        }
        swpFlags |= SWP.NOCOPYBITS;
    }

    switch (showFlag) {
        case SW.MINIMIZE:
        case SW.SHOWMINNOACTIVE:
        case SW.SHOWMINIMIZED:
        case SW.FORCEMINIMIZE:
            {
                //ERR("MinMaximize Minimize\n");
                if (wnd.dwStyle & WS.MAXIMIZE) {
                    wnd.savedPos.flags |= WPF.RESTORETOMAXIMIZED;
                }
                else {
                    wnd.savedPos.flags &= ~WPF.RESTORETOMAXIMIZED;
                }

                oldStyle = NtUserIntSetStyle(wnd, WS.MINIMIZE, WS.MAXIMIZE);

                if (!(wnd.savedPos.flags & WPF.SETMINPOSITION))
                    wnd.savedPos.flags &= ~WPF.MININIT;

                NtUserIntWinPosFindIconPos(peb, wnd, wpl.ptMinPosition);

                if (!(oldStyle & WS.MINIMIZE)) {
                    swpFlags |= SWP.STATECHANGED;
                    await NtUserIntShowOwnedPopups(peb, wnd, false);
                }

                SetRect(newPosCopy, wpl.ptMinPosition.x, wpl.ptMinPosition.y,
                    wpl.ptMinPosition.x + NtUserGetSystemMetrics(wnd.peb, SM.CXMINIMIZED),
                    wpl.ptMinPosition.y + NtUserGetSystemMetrics(wnd.peb, SM.CYMINIMIZED));
                swpFlags |= SWP.NOCOPYBITS;
                break;
            }

        case SW.MAXIMIZE:
            {
                //ERR("MinMaximize Maximize\n");
                if ((wnd.dwStyle & WS.MAXIMIZE) && (wnd.dwStyle & WS.VISIBLE)) {
                    swpFlags = SWP.NOSIZE | SWP.NOMOVE;
                    break;
                }

                await NtUserWinPosGetMinMaxInfo(wnd.peb, wnd, size, wpl.ptMaxPosition, null, null);
                oldStyle = NtUserIntSetStyle(wnd, WS.MAXIMIZE, WS.MINIMIZE);
                /*if (old_style & WS.MINIMIZE)
                {
                   NtUserIntShowOwnedPopups(Wnd, TRUE);
                }*/

                if (!(oldStyle & WS.MAXIMIZE)) swpFlags |= SWP.STATECHANGED;
                SetRect(newPosCopy, wpl.ptMaxPosition.x, wpl.ptMaxPosition.y,
                    size.cx, size.cy);
                break;
            }

        case SW.SHOWNOACTIVATE:
            wnd.savedPos.flags &= ~WPF.RESTORETOMAXIMIZED;
        /* fall through */
        case SW.SHOWNORMAL:
        case SW.RESTORE:
        case SW.SHOWDEFAULT: /* FIXME: should have its own handler */
            {
                //ERR("MinMaximize Restore\n");
                oldStyle = NtUserIntSetStyle(wnd, 0, WS.MINIMIZE | WS.MAXIMIZE);
                if (oldStyle & WS.MINIMIZE) {
                    await NtUserIntShowOwnedPopups(peb, wnd, true);

                    if (wnd.savedPos.flags & WPF.RESTORETOMAXIMIZED) {
                        await NtUserWinPosGetMinMaxInfo(wnd.peb, wnd, size, wpl.ptMaxPosition, null, null);
                        NtUserIntSetStyle(wnd, WS.MAXIMIZE, 0);
                        swpFlags |= SWP.STATECHANGED;
                        SetRect(newPosCopy, wpl.ptMaxPosition.x, wpl.ptMaxPosition.y,
                            wpl.ptMaxPosition.x + size.cx, wpl.ptMaxPosition.y + size.cy);
                        break;
                    }
                    else {
                        newPosCopy = { ...wpl.rcNormalPosition };
                        newPosCopy.right -= newPosCopy.left;
                        newPosCopy.bottom -= newPosCopy.top;
                        break;
                    }
                }
                else {
                    if (!(oldStyle & WS.MAXIMIZE)) {
                        break;
                    }
                    swpFlags |= SWP.STATECHANGED;
                    wnd.savedPos.flags &= ~WPF.RESTORETOMAXIMIZED;
                    newPosCopy = { ...wpl.rcNormalPosition };
                    newPosCopy.right -= newPosCopy.left;
                    newPosCopy.bottom -= newPosCopy.top;
                    break;
                }
            }
    }

    Object.assign(newPos, newPosCopy);

    return swpFlags;
}

async function NtUserIntShowOwnedPopups(peb: PEB, wnd: WND, bShow: boolean) {

}

function NtUserIntGetLastTopMostWindow(peb: PEB): PWND {
    let rpDesk = NtUserGetDesktop(peb);
    let pWndDesktop = ObGetObject<WND>(rpDesk?.hwndDesktop || 0);
    let pWnd: PWND;
    if (rpDesk && pWndDesktop &&
        (pWnd = pWndDesktop.wndChild) &&
        pWnd.dwExStyle & WS.EX.TOPMOST) {
        for (; ;) {
            if (!pWnd.wndNext) break;
            if (!(pWnd.wndNext.dwExStyle & WS.EX.TOPMOST)) break;
            pWnd = pWnd.wndNext;
        }
        return pWnd;
    }
    return null;
}

export async function NtUserActivateOtherWindowMin(peb: PEB, wnd: WND) {
    let activePrev: boolean, findTopWnd: boolean;
    let pWndTopMost: PWND, pWndChild: PWND, pWndSetActive: PWND, pWndTemp: PWND, pWndDesk: PWND;
    let pti = NtUserGetProcInfo(peb);
    if (!pti) {
        return false;
    }

    //ERR("AOWM 1 %p\n",Wnd.head.h);
    activePrev = (pti.hwndActivePrev !== 0);
    findTopWnd = true;

    if ((pWndTopMost = NtUserIntGetLastTopMostWindow(peb)))
        pWndChild = pWndTopMost.wndNext;
    else
        pWndChild = wnd.wndParent?.wndChild || null;

    for (; ;) {
        if (activePrev)
            pWndSetActive = ObGetObject<WND>(pti.hwndActivePrev);
        else
            pWndSetActive = pWndChild;

        pWndTemp = null;

        while (pWndSetActive) {
            if (ObGetObject<WND>(pWndSetActive.hWnd) &&
                !(pWndSetActive.dwExStyle & WS.EX.NOACTIVATE) &&
                (pWndSetActive.dwStyle & (WS.VISIBLE | WS.DISABLED)) == WS.VISIBLE &&
                (!(pWndSetActive.dwStyle & WS.ICONIC) /* FIXME MinMax pos? */)) {
                if (!(pWndSetActive.dwExStyle & WS.EX.TOOLWINDOW)) {
                    // UserRefObjectCo(pWndSetActive, &Ref);
                    //ERR("ActivateOtherWindowMin Set FG 1\n");
                    await NtUserIntSetForegroundWindow(pWndSetActive);
                    // UserDerefObjectCo(pWndSetActive);
                    //ERR("AOWM 2 Exit Good %p\n",pWndSetActive.head.h);
                    return true;
                }
                if (!pWndTemp) pWndTemp = pWndSetActive;
            }
            if (activePrev) {
                activePrev = false;
                pWndSetActive = pWndChild;
            }
            else
                pWndSetActive = pWndSetActive.wndNext;
        }

        if (!findTopWnd) break;
        findTopWnd = false;

        if (pWndChild) {
            pWndChild = pWndChild.wndParent?.wndChild || null;
            continue;
        }

        if (!(pWndDesk = ObGetObject<WND>(NtGetDesktopWindow(peb)))) {
            pWndChild = null;
            continue;
        }

        pWndChild = pWndDesk.wndChild;
    }

    if ((pWndSetActive = pWndTemp)) {
        //UserRefObjectCo(pWndSetActive, & Ref);
        //ERR("ActivateOtherWindowMin Set FG 2\n");
        await NtUserIntSetForegroundWindow(pWndSetActive);
        //UserDerefObjectCo(pWndSetActive);
        //ERR("AOWM 3 Exit Good %p\n",pWndSetActive.head.h);
        return true;
    }
    //ERR("AOWM 4 Bad\n");
    return false;
}
