import { GA, HWND, HWND_TOP, MAKEWPARAM, SWP, WA, WM, WS } from "../types/user32.types.js";
import { NtDispatchMessage, NtPostMessage } from "./msg.js";
import { NtGetDesktopWindow, NtUserGetAncestor, NtUserIsDesktopWindow } from "./window.js";
import { NtSetWindowPos, NtUserActivateOtherWindowMin, NtUserSetWindowPos } from "./wndpos.js";
import { NtUserGetDesktop, NtUserGetProcInfo, W32PROCINFO } from "./shared.js";

import { IntIsWindowVisible } from "./sizemove.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import WND from "./wnd.js";

let gpqForeground: PEB = null;
let gpqForegroundPrev: PEB = null;

export function NtUserGetForegroundWindow(): HWND {
    if (!gpqForeground) return 0;

    const pti = NtUserGetProcInfo(gpqForeground);
    if (!pti) {
        return 0;
    }

    return pti.hwndActive;
}

export function NtUserIntGetFocusProcInfo(peb: PEB): W32PROCINFO {
    const desktop = NtUserGetDesktop(peb);
    if (!desktop) {
        return null;
    }

    return NtUserGetProcInfo(desktop.pActiveProcess);
}

async function NtUserSendDeactivateMessages(hwndPrev: HWND, hWnd: HWND, clear: boolean): Promise<boolean> {
    let lParam = hWnd ?? 0;

    let wndPrev;
    if (hwndPrev && (wndPrev = ObGetObject<WND>(hwndPrev))) {
        const wParam = MAKEWPARAM(WA.INACTIVE, ((wndPrev.dwStyle & WS.MINIMIZE) != 0) ? 1 : 0);
        if (await NtDispatchMessage(wndPrev.peb, [wndPrev.hWnd, WM.NCACTIVATE, 0, lParam])) {
            await NtDispatchMessage(wndPrev.peb, [wndPrev.hWnd, WM.ACTIVATE, wParam, lParam]);

            if (clear) {
                wndPrev.stateFlags.bIsActiveFrame = false;
            }

            return true;
        }
        else {
            console.warn("NtUserSendDeactivateMessages: Application is trying to keep itself active.");
            return false;
        }
    }

    return true;
}


export async function NtUserActivateWindow(peb: PEB, hWnd: HWND, dwType: number): Promise<boolean> {
    let wnd = ObGetObject<WND>(hWnd);
    let pti = NtUserGetProcInfo(peb);
    if (!pti) {
        console.warn("NtUserActivateWindow: pti is null");
        return false;
    }

    if (wnd) {
        if (gpqForeground === null) {
            await NtUserIntSetForegroundMessageQueue(peb, wnd, dwType != 0, 0);
        }
        else {
            // same window
            if (pti.hwndActive === hWnd) {
                const wParam = NtUserGetForegroundWindow() === hWnd;
                await NtDispatchMessage(peb, [hWnd, WM.NCACTIVATE, wParam, hWnd]);

                if (!wParam) {
                    // TODO: update shell hook
                    await NtSetWindowPos(peb, hWnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE);
                }
            }
            else {
                // set the active window
                await NtUserCoIntSetActiveWindow(peb, wnd, dwType != 0, true, true);
            }
        }
    }
    else {
        // handle with no window
        if (gpqForeground === peb && pti.hwndActive) {
            // use active window from current process
            wnd = ObGetObject<WND>(pti.hwndActive);
            if (wnd) {
                await NtDispatchMessage(peb, [wnd.hWnd, WM.NCACTIVATE, true, 0]);
                // TODO: update shell hook
                await NtSetWindowPos(peb, wnd.hWnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE);
            }
        }
    }
}

/**
 * Deactivates all windows for a given process.
 * @param peb the process to deactivate windows for
 * @returns 
 */
export async function NtUserDeactivateWindow(peb: PEB): Promise<boolean> {
    const pti = NtUserGetProcInfo(peb);
    if (!pti) {
        console.warn("NtUserDeactivateWindow: pti is null");
        return false;
    }

    let wndPrev;

    if (!pti.hwndActive) {
        console.debug("NtUserDeactivateWindow: nothing to do, pti.hwndActive is null");
        return true;
    }

    // release pointer capture
    if (pti.hwndCapture) {
        console.debug("NtUserDeactivateWindow: releasing capture");
        const wndCapture = ObGetObject<WND>(pti.hwndCapture);
        if (wndCapture) {
            await NtDispatchMessage(peb, [wndCapture.hWnd, WM.CANCELMODE, 0, 0]);

            // todo: generate WM_MOUSEMOVE to the window that had capture
        }

        pti.hwndCapture = 0;
    }

    // release the active window
    if (pti.hwndActive) {
        wndPrev = ObGetObject<WND>(pti.hwndActive);
        if (!(await NtUserSendDeactivateMessages(pti.hwndActive, 0, true))) {
            return false;
        }

        // ReactOS tests hwndActive === wndPrev.hWnd, not 100% sure why?
        if (pti.hwndActive === wndPrev?.hWnd) {
            pti.hwndActivePrev = wndPrev.hWnd;
            pti.hwndActive = 0;
        }
    }
    else {
        wndPrev = null;
    }

    if (wndPrev) {
        const desktop = ObGetObject<WND>(NtGetDesktopWindow(peb));
        if (desktop) {
            const children = desktop.pChildren;
            for (const child of children) {
                const childWnd = ObGetObject<WND>(child);
                if (childWnd && childWnd.peb === peb) {
                    await NtDispatchMessage(peb, [childWnd.hWnd, WM.ACTIVATEAPP, false, 0]);
                }
            }
        }
    }

    // Now check for a change (Bounce), if Active same as previous window, release it too.
    if (pti.hwndActive === wndPrev?.hWnd) {
        if (!(await NtUserSendDeactivateMessages(wndPrev.hWnd, 0, true))) {
            return false;
        }

        // ReactOS tests hwndActive === wndPrev.hWnd, not 100% sure why?
        if (pti.hwndActive === wndPrev?.hWnd) {
            pti.hwndActivePrev = wndPrev.hWnd;
            pti.hwndActive = 0;
        }
    }

    // check for focus and send WM_KILLFOCUS
    if (pti.hwndFocus) {
        const wndFocus = ObGetObject<WND>(pti.hwndFocus);
        if (wndFocus) {
            await NtDispatchMessage(peb, [wndFocus.hWnd, WM.KILLFOCUS, 0, 0]);
        }

        pti.hwndFocus = 0;
    }

    return true;
}



async function NtUserCoIntSetActiveWindow(peb: PEB, wnd: WND, bMouse: boolean, bFocus: boolean, async: boolean): Promise<boolean> {
    let pti = NtUserGetProcInfo(peb);
    if (!pti) {
        return false;
    }

    let pWndChg = ObGetObject<WND>(pti.hwndActive);
    let hWndPrev = pti.hwndActive;

    if (!wnd || NtUserIsDesktopWindow(peb, wnd))
        return false;

    let hWnd = wnd.hWnd;
    if (wnd.dwExStyle & WS.EX.NOACTIVATE)
        return true;

    if (peb !== wnd.peb) {
        return false;
    }

    if (!ObGetObject<WND>(wnd.hWnd)) {
        return false;
    }

    if (wnd === pWndChg) {
        return true;
    }

    if (wnd.stateFlags.bIsBeingActivated) return true;

    // cbt.fMouse     = bMouse;
    // cbt.hWndActive = hWndPrev;
    // if (co_HOOK_CallHooks( WH_CBT, HCBT_ACTIVATE, (WPARAM)hWnd, (LPARAM)&cbt))
    // {
    //    ERR("SetActiveWindow: WH_CBT Call Hook return!\n");
    //    return FALSE;
    // }


    if ((pWndChg = ObGetObject<WND>(pti.hwndActive)) && pWndChg.stateFlags.bIsDestroyed) {
        pti.hwndActive = 0;
    }
    else {
        pti.hwndActivePrev = pti.hwndActive;
    }

    let wndPrev = ObGetObject<WND>(pti.hwndActive);

    if (wndPrev) {
        if (peb === gpqForeground)
            gpqForegroundPrev = peb;
        if (!await NtUserSendDeactivateMessages(wndPrev.hWnd, hWnd, true))
            return false;
    }

    wndPrev = ObGetObject<WND>(pti.hwndActivePrev); // keep making sure it's valid

    if (pti.hwndActivePrev != pti.hwndActive || pWndChg != wndPrev || !(wnd && ObGetObject<WND>(wnd.hWnd)) || pti != NtUserGetProcInfo(peb)) {
        return false; // something's changed, bail
    }

    if (!wndPrev) {
        // ThreadQueue.QF_flags &= ~QF_FOCUSNULLSINCEACTIVE; ?
    }

    pti.hwndActive = wnd.hWnd;
    wnd.stateFlags.bIsBeingActivated = true;

    // IntNotifyWinEvent(EVENT_SYSTEM_FOREGROUND, Wnd, OBJID_WINDOW, CHILDID_SELF, WEF_SETBYWNDPTI);

    wndPrev = ObGetObject<WND>(pti.hwndActivePrev); // keep making sure it's valid

    await NtUserIntSendActivateMessages(peb, wndPrev, wnd, bMouse, async);

    // TODO: focus messages

    wnd.stateFlags.bIsBeingActivated = false;

    return (pti.hwndActive === wnd.hWnd);
}

function IsFGLocked() {
    return false;
}

function ToggleFGActivate(peb: PEB) {
    let pti = NtUserGetProcInfo(peb);
    let ret = pti.flags.bAllowForegroundActivate;
    if (ret) {
        pti.flags.bAllowForegroundActivate = false;
    }

    return ret;
}

function IsAllowedFGActive(peb: PEB, wnd: WND): boolean {
    if (!ToggleFGActivate(peb) ||              // bits not set,
        // pti.rpdesk != gpdeskInputDesktop ||  // not current Desktop,
        peb == gpqForeground || // if already the queue foreground,
        IsFGLocked() ||                       // foreground is locked,
        (wnd.dwExStyle & WS.EX.NOACTIVATE))    // or, does not become the foreground window when the user clicks it.
    {
        return false;
    }
    return true;
}

export async function NtUserIntSetForegroundWindowMouse(Wnd: WND): Promise<boolean> {
    if (Wnd && (Wnd.dwExStyle & WS.EX.NOACTIVATE))
        return true;
    return await NtUserIntSetForegroundAndFocusWindow(Wnd.peb, Wnd, false, true);
}

export async function NtUserIntSetForegroundWindow(Wnd: WND): Promise<boolean> {
    if (Wnd && (Wnd.dwExStyle & WS.EX.NOACTIVATE))
        return true;
    return await NtUserIntSetForegroundAndFocusWindow(Wnd.peb, Wnd, true, false);
}

async function IntUserSetActiveWindow(peb: PEB, wnd: WND, bMouse: boolean, bFocus: boolean, async: boolean): Promise<boolean> {
    const pti = NtUserGetProcInfo(peb);
    if (!pti) {
        return;
    }

    while (wnd) {
        let doFG = false;
        let allowFG = false;
        let ret = false;

        if (peb === wnd.peb) {
            if (IsAllowedFGActive(peb, wnd)) {
                doFG = true;
            }
            else {
                break;
            }

            allowFG = pti.nVisibleWindows === 0;
        }
        else {
            if (!gpqForeground || gpqForeground == peb) {
                doFG = true;
            }
            else
                doFG = false;
            if (doFG) {
                if (pti.flags.bAllowForegroundActivate || pti.nVisibleWindows !== 0)
                    allowFG = true;
                else
                    allowFG = false;
            }
            else
                allowFG = false;
        }

        if (doFG) {
            pti.flags.bAllowForegroundActivate = true;
            await NtUserIntSetForegroundAndFocusWindow(peb, wnd, bMouse, true);
            pti.flags.bAllowForegroundActivate = allowFG;
        }

        return ret;
    }

    return await NtUserCoIntSetActiveWindow(peb, wnd, bMouse, bFocus, async);
}

async function NtUserIntSetForegroundAndFocusWindow(peb: PEB, wnd: WND, bMouse: boolean, bFlash: boolean) {
    let hWnd = wnd?.hWnd ?? 0;
    let ret = false;

    let prevForegroundQueue = NtUserIntGetFocusProcInfo(peb);
    let pti = NtUserGetProcInfo(peb);
    if (wnd && prevForegroundQueue) {
        let wndPti = NtUserGetProcInfo(wnd.peb);
        if (wndPti === prevForegroundQueue) {
            // same queue, just activate the window
            if (pti === prevForegroundQueue) {
                ret = await IntUserSetActiveWindow(peb, wnd, bMouse, true, true);
            }
            else if (wndPti.hwndActive === wnd.hWnd) {
                ret = true; // do nothing
            }
            else {
                NtPostMessage(peb, [hWnd, WMP.ASYNC_SETACTIVEWINDOW, hWnd, 0]);
                ret = true;
            }

            return ret;
        }
    }

    if (true) {
        ToggleFGActivate(peb);
        NtUserIntSetForegroundMessageQueue(peb, wnd, bMouse, 0); 
        // we currently fall through to the next block, but reactos returns here
    }


    if (!wnd) return false;

    if (pti === NtUserGetProcInfo(wnd.peb)) {
        ret = await IntUserSetActiveWindow(peb, wnd, bMouse, true, false);
    }
    else if (NtUserGetProcInfo(wnd.peb).hwndActive === wnd.hWnd) {
        // do nothing
    }
    else {
        NtPostMessage(wnd.peb, [hWnd, WMP.ASYNC_SETACTIVEWINDOW, hWnd, 0]);
    }

    return false; // why do we keep ret if we always return false?
}

function NtUserIntMakeWindowActive(wnd: WND) {
    let owner = wnd;
    while (owner.hOwner) {
        owner = ObGetObject<WND>(owner.hOwner);
        if (!owner) {
            break;
        }
    }

    owner.wndLastActive = wnd;
}

async function NtUserIntSendActivateMessages(peb: PEB, wndPrev: WND, wnd: WND, mouseActivate: boolean, async: boolean) {
    const pti = NtUserGetProcInfo(peb);
    console.log("Focusing Window %s", wnd?.lpszName);

    if (wnd) {
        if (!(wnd.dwStyle & WS.CHILD)) {
            let pWndTemp = ObGetObject<WND>(NtGetDesktopWindow(peb)).wndChild;
            while (pWndTemp && !(pWndTemp.dwStyle & WS.VISIBLE)) pWndTemp = pWndTemp.wndNext;

            if (wnd != pWndTemp || (wndPrev && !IntIsWindowVisible(wndPrev))) {
                if (!async && (peb === gpqForeground)) {
                    let flags = SWP.NOSIZE | SWP.NOMOVE;
                    if (wnd == pWndTemp) flags |= SWP.NOACTIVATE;
                    await NtUserSetWindowPos(peb, wnd, HWND_TOP, 0, 0, 0, 0, flags);
                }
            }
        }

        if (wnd.wndPrev) {
            let pwndCurrent, pwndDesktop;

            pwndDesktop = ObGetObject<WND>(NtGetDesktopWindow(peb));
            if (wnd.wndParent === pwndDesktop) {
                let children = pwndDesktop.pChildren;
                for (const child of children) {
                    pwndCurrent = ObGetObject<WND>(child);
                    if (pwndCurrent && pwndCurrent.wndOwner === wnd) {
                        await NtUserSetWindowPos(peb, pwndCurrent, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE | SWP.NOACTIVATE);
                    }
                }
            }
        }
    }

    let oldPeb = wndPrev?.peb;
    let newPeb = wnd?.peb;
    let oldPti = NtUserGetProcInfo(oldPeb);
    let newPti = NtUserGetProcInfo(newPeb);

    if (!(pti.flags.bInActivateAppMsg) && oldPeb != newPeb) {
        let desktop = ObGetObject<WND>(NtGetDesktopWindow(peb));
        let children = desktop.pChildren;

        if (oldPti) {
            oldPti.flags.bInActivateAppMsg = true;
            for (const child of children) {
                let childWnd = ObGetObject<WND>(child);
                if (childWnd && childWnd.peb === oldPeb) {
                    await NtDispatchMessage(oldPeb, [childWnd.hWnd, WM.ACTIVATEAPP, false, 0]);
                }
            }
            oldPti.flags.bInActivateAppMsg = false;
        }

        if (newPti) {
            newPti.flags.bInActivateAppMsg = true;
            for (const child of children) {
                let childWnd = ObGetObject<WND>(child);
                if (childWnd && childWnd.peb === newPeb) {
                    await NtDispatchMessage(newPeb, [childWnd.hWnd, WM.ACTIVATEAPP, true, 0]);
                }
            }
            newPti.flags.bInActivateAppMsg = false;
        }
    }

    if (wnd) {
        if (wndPrev) {
            // unref the previous window
        }

        NtUserIntMakeWindowActive(wnd);

        await NtDispatchMessage(peb, [wnd.hWnd, WM.NCACTIVATE, wnd.hWnd === NtUserGetForegroundWindow(), wnd.hWnd]);
        await NtDispatchMessage(peb, [wnd.hWnd, WM.ACTIVATE, MAKEWPARAM((mouseActivate ? WA.CLICKACTIVE : WA.ACTIVE), ((wnd.dwStyle & WS.MINIMIZE) != 0) ? 1 : 0), wnd.hWnd]);

        // TODO: update shell hook
    }
}

export function NtUserIntSetFocusMessageQueue(peb: PEB, newQueue: PEB) {
    const desktop = NtUserGetDesktop(peb);
    if (!desktop) {
        return;
    }

    let old = desktop.pActiveProcess;
    if (newQueue) {
        desktop.pActiveProcess = newQueue;
    }

    if (old) {
        gpqForegroundPrev = old;
    }

    if (newQueue) {
        gpqForeground = newQueue;
    }
    else {
        gpqForeground = null;
    }
}

async function NtUserIntSetForegroundMessageQueue(peb: PEB, wnd: WND, mouseActivate: boolean, type: number) {
    if (wnd && !ObGetObject<WND>(wnd.hWnd)) { // VerifyWnd is used in a bunch of places and i've omitted it, fix that
        return;
    }

    let pebPrev = gpqForeground;
    let pebNew = wnd?.peb ?? null;
    let pebChg = null;
    if (wnd) {
        pebChg = wnd.peb;
        NtUserIntSetFocusMessageQueue(peb, wnd.peb);
        // gpqForeground = wnd.peb;
    }
    else {
        NtUserIntSetFocusMessageQueue(peb, null);
        // gpqForeground = null;
    }

    if (gpqForegroundPrev != gpqForeground) {
        let pmqPrev = null;
        if (pebPrev) { // && not in cleanup       
            pmqPrev = NtUserGetProcInfo(pebPrev);
        }

        let pmq = NtUserGetProcInfo(peb);

        if (pmqPrev) {
            if (pmq != pmqPrev) {
                let hwndPrev = pmqPrev.hwndActive;
                NtPostMessage(pebPrev, [hwndPrev, WMP.ASYNC_SETACTIVEWINDOW, hwndPrev, 0]);
            }
        }

        let pmqChg = null;
        if (pebChg) { // && not in cleanup
            pmqChg = NtUserGetProcInfo(pebChg);
        }

        if (pmqChg) {
            if (pmq != pmqChg) {
                let hWnd = wnd?.hWnd ?? 0;
                NtPostMessage(pebChg, [hWnd, WMP.ASYNC_SETACTIVEWINDOW, hWnd, 0]);
            }
            else {
                if (pmq.hwndActive === wnd?.hWnd) {
                    await NtDispatchMessage(peb, [wnd.hWnd, WM.NCACTIVATE, true, wnd.hWnd]);
                    // update shell hook
                    await NtUserSetWindowPos(peb, wnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE);
                }
                else {
                    await NtUserCoIntSetActiveWindow(peb, wnd, mouseActivate, true, true);
                }
            }
        }

        pmqPrev = null;
        if (pebPrev) { // && not in cleanup
            pmqPrev = NtUserGetProcInfo(pebPrev);
        }

        pmq = NtUserGetProcInfo(peb);


        if (pmqPrev && pmq == pmqPrev) {
            await NtUserDeactivateWindow(pebPrev);
        }
    }
}

export async function UserSetActiveWindow(peb: PEB, Wnd: WND) {
    if (Wnd) {
        if ((Wnd.dwStyle & (WS.POPUP | WS.CHILD)) == WS.CHILD) return false;

        return await IntUserSetActiveWindow(peb, Wnd, false, true, false);
    }
    /*
       Yes your eyes are not deceiving you~!
  
       First part of wines Win.c test_SetActiveWindow:
  
       flush_events( TRUE );
       ShowWindow(hwnd, SW_HIDE);
       SetFocus(0);
       SetActiveWindow(0);
       check_wnd_state(0, 0, 0, 0); <-- This should pass if ShowWindow does it's job!!! As of 10/28/2012 it does!
  
       Now Handle wines Msg.c test_SetActiveWindow( 0 )...
    */
    let ptiForegroundPrev = NtUserGetProcInfo(gpqForegroundPrev);
    let wndActivePrev: WND;
    if (ptiForegroundPrev &&
        ptiForegroundPrev.hwndActive && (wndActivePrev = ObGetObject<WND>(ptiForegroundPrev.hwndActive)) &&
        (wndActivePrev.dwStyle & (WS.VISIBLE | WS.DISABLED)) == WS.VISIBLE &&
        // !(wndActivePrev.state2 & WNDS2_BOTTOMMOST) &&
        (Wnd = ObGetObject(wndActivePrev.hWnd)) != null) {
        // TRACE("USAW:PAW hwnd %p\n", Wnd ? Wnd.head.h : NULL);
        return await IntUserSetActiveWindow(peb, Wnd, false, true, false);
    }

    let pti = NtUserGetProcInfo(peb);
    // Activate anyone but the active window.
    if (pti.hwndActive &&
        (Wnd = ObGetObject<WND>(pti.hwndActive)) != null) {
        //ERR("USAW:AOWM hwnd %p\n",Wnd?Wnd.head.h:NULL);
        if (!(await NtUserActivateOtherWindowMin(peb, Wnd))) {
            // Okay, now go find someone else to play with!
            //ERR("USAW: Going to WPAOW\n");
            await NtUserIntWinPosActivateOtherWindow(peb, Wnd)
        }
        return true;
    }

    // TRACE("USAW: Nothing\n");
    return false;
}


export async function NtUserIntWinPosActivateOtherWindow(peb: PEB, Wnd: WND) {
    let WndTo: WND = null;

    async function done() {
        if (gpqForeground && (!NtUserGetProcInfo(gpqForeground).hwndActive || Wnd.hWnd == NtUserGetProcInfo(gpqForeground).hwndActive)) {
            /* ReactOS can pass WndTo = NULL to co_IntSetForegroundWindow and returns FALSE. */
            //ERR("WinPosActivateOtherWindow Set FG 0x%p hWnd %p\n",WndTo, WndTo ? WndTo.head.h : 0);
            if (await NtUserIntSetForegroundWindow(WndTo)) {
                return;
            }
        }
        //ERR("WinPosActivateOtherWindow Set Active  0x%p\n",WndTo);
        if (!await UserSetActiveWindow(peb, WndTo))  /* Ok for WndTo to be NULL here */ {
            //ERR("WPAOW SA 1\n");
            await UserSetActiveWindow(peb, null);
        }
    }

    if (NtUserIsDesktopWindow(peb, Wnd)) {
        //ERR("WinPosActivateOtherWindow Set Focus Msg Q No window!\n");
        NtUserIntSetFocusMessageQueue(peb, null);
        return;
    }

    /* If this is popup window, try to activate the owner first. */
    if ((Wnd.dwStyle & WS.POPUP) && (WndTo = Wnd.wndOwner)) {
        WndTo = NtUserGetAncestor(WndTo, GA.ROOT);
        if (NtUserIntCanActivateWindow(WndTo)) return await done();
    }

    /* Pick a next top-level window. */
    /* FIXME: Search for non-tooltip windows first. */
    WndTo = Wnd;
    for (; ;) {
        if (!(WndTo = WndTo.wndNext)) break;
        if (NtUserIntCanActivateWindow(WndTo)) return await done();
    }

    /*
       Fixes wine win.c:test_SetParent last ShowWindow test after popup dies.
       Check for previous active window to bring to top.
    */
    if (Wnd) {
        WndTo = ObGetObject(NtUserGetProcInfo(Wnd.peb).hwndActivePrev);
        if (NtUserIntCanActivateWindow(WndTo)) return await done();
    }

    // Find any window to bring to top. Works Okay for wine since it does not see X11 windows.
    WndTo = ObGetObject<WND>(NtGetDesktopWindow(Wnd.peb));
    if ((WndTo == null) || (WndTo.wndChild == null)) {
        //ERR("WinPosActivateOtherWindow No window!\n");
        return;
    }
    WndTo = WndTo.wndChild;
    for (; ;) {
        if (WndTo == Wnd) {
            WndTo = null;
            break;
        }
        if (NtUserIntCanActivateWindow(WndTo)) return await done();
        if (!(WndTo = WndTo.wndNext)) break;
    }

    return await done();
}

function NtUserIntCanActivateWindow(Wnd: WND) {
    let style;

    if (!Wnd) return false;

    style = Wnd.dwStyle;
    if (!(style & WS.VISIBLE)) return false;
    if (style & WS.MINIMIZE) return false;
    if ((style & (WS.POPUP | WS.CHILD)) == WS.CHILD) return false;
    if (Wnd.dwExStyle & WS.EX.NOACTIVATE) return false;
    return true;
    /* FIXME: This window could be disable because the child that closed
              was a popup. */
    //return !(style & WS_DISABLED);
}

