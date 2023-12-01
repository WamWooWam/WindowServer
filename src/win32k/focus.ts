import { HWND, HWND_TOP, MAKEWPARAM, SWP, WA, WM, WS } from "../types/user32.types.js";
import { NtDispatchMessage, NtPostMessage } from "./msg.js";
import { NtSetWindowPos, NtUserSetWindowPos } from "./wndpos.js";

import { GetW32ProcInfo } from "./shared.js";
import { IntIsWindowVisible } from "./sizemove.js";
import { NtGetDesktopWindow } from "./window.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WMP } from "../types/user32.int.types.js";
import WND from "./wnd.js";

let gpqForeground: PEB = null;
let gpqForegroundPrev: PEB = null;

export function NtUserGetForegroundWindow(): HWND {
    if (!gpqForeground) return 0;

    const pti = GetW32ProcInfo(gpqForeground);
    if (!pti) {
        return 0;
    }

    return pti.hwndActive;
}

async function NtUserSendDeactivateMessages(hwndPrev: HWND, hWnd: HWND, clear: boolean): Promise<boolean> {
    let lParam = hWnd ?? 0;

    let wndPrev;
    if (hwndPrev && (wndPrev = ObGetObject<WND>(hwndPrev))) {
        if (await NtDispatchMessage(wndPrev.peb, [wndPrev.hWnd, WM.NCACTIVATE, 0, lParam])) {
            await NtDispatchMessage(wndPrev.peb, [wndPrev.hWnd, WM.ACTIVATE, MAKEWPARAM(WA.INACTIVE, ((wndPrev.dwStyle & WS.MINIMIZE) != 0) ? 1 : 0), lParam]);

            if (clear) {
                wndPrev.dwStyle &= ~WS.ACTIVE;
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

/**
 * Deactivates all windows for a given process.
 * @param peb the process to deactivate windows for
 * @returns 
 */
export async function NtUserDeactivateWindow(peb: PEB): Promise<boolean> {
    const pti = GetW32ProcInfo(peb);
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

export async function NtUserActivateWindow(peb: PEB, hWnd: HWND, dwType: number): Promise<boolean> {
    let wnd = ObGetObject<WND>(hWnd);
    let pti = GetW32ProcInfo(peb);
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

                if (wParam) {
                    // TODO: update shell hook
                    await NtSetWindowPos(peb, hWnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE);
                }
            }
            else {
                // set the active window
                await NtUserIntSetActiveWindow(wnd, dwType != 0, true, true);
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

async function NtUserIntSetActiveWindow(wnd: WND, bMouse: boolean, bFocus: boolean, async: boolean) {
    // TODO: this
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
    const pti = GetW32ProcInfo(peb);
    if (wnd) {
        if (!(wnd.dwStyle & WS.CHILD)) {
            let pWndTemp = ObGetObject<WND>(NtGetDesktopWindow(peb)).wndChild;
            while (pWndTemp && !(pWndTemp.dwStyle & WS.VISIBLE)) pWndTemp = pWndTemp.wndNext;

            if (wnd != pWndTemp || (wndPrev && !IntIsWindowVisible(wndPrev))) {
                if (!async && (peb === gpqForeground)) {
                    let flags = SWP.NOSIZE | SWP.NOMOVE;
                    if (wnd == pWndTemp) flags |= SWP.NOACTIVATE;
                    await NtUserSetWindowPos(wnd, HWND_TOP, 0, 0, 0, 0, flags);
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
                        await NtUserSetWindowPos(pwndCurrent, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE | SWP.NOACTIVATE);
                    }
                }
            }
        }
    }

    let oldPeb = wndPrev?.peb;
    let newPeb = wnd?.peb;
    let oldPti = GetW32ProcInfo(oldPeb);
    let newPti = GetW32ProcInfo(newPeb);

    if (!(pti.flags.bInActivateAppMsg) && oldPeb != newPeb) {
        let desktop = ObGetObject<WND>(NtGetDesktopWindow(oldPeb));
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

function NtUserIntSetFocusMessageQueue(peb: PEB) {
    // TODO:
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
        NtUserIntSetFocusMessageQueue(wnd.peb);
        gpqForeground = wnd.peb;
    }
    else {
        NtUserIntSetFocusMessageQueue(null);
        gpqForeground = null;
    }

    if (gpqForegroundPrev != gpqForeground) {
        let pmqPrev = null;
        if (pebPrev) { // && not in cleanup       
            pmqPrev = GetW32ProcInfo(pebPrev);
        }

        let pmq = GetW32ProcInfo(peb);

        if (pmqPrev) {
            if (pmq != pmqPrev) {
                let hwndPrev = pmqPrev.hwndActive;
                NtPostMessage(pebPrev, [hwndPrev, WMP.ASYNC_SETACTIVEWINDOW, hwndPrev, 0]);
            }
        }

        let pmqChg = null;
        if (pebChg) { // && not in cleanup
            pmqChg = GetW32ProcInfo(pebChg);
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
                    await NtUserSetWindowPos(wnd, HWND_TOP, 0, 0, 0, 0, SWP.NOSIZE | SWP.NOMOVE);
                }
                else {
                    await NtUserIntSetActiveWindow(wnd, mouseActivate, true, true);
                }
            }
        }

        pmqPrev = null;
        if (pebPrev) { // && not in cleanup
            pmqPrev = GetW32ProcInfo(pebPrev);
        }

        pmq = GetW32ProcInfo(peb);


        if (pmqPrev && pmq == pmqPrev) {
            await NtUserDeactivateWindow(pebPrev);
        }
    }
}

