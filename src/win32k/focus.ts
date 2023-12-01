import { HWND, HWND_TOP, MAKEWPARAM, SWP, WA, WM, WS } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { IntIsWindowVisible } from "./sizemove.js";
import { NtDispatchMessage } from "./msg.js";
import { NtGetDesktopWindow } from "./window.js";
import { NtSetWindowPos } from "./wndpos.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
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
            NtUserSetForegroundProcess(peb, hWnd, dwType != 0, 0);
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
                await NtUserIntSetActiveWindow(peb, hWnd);
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

function NtUserSetForegroundProcess(peb: PEB, hWnd: HWND, bForeground: boolean, dwType: number) {
    if (bForeground) {
        gpqForegroundPrev = gpqForeground;
        gpqForeground = peb;
    }
    else {
        gpqForegroundPrev = null;
        gpqForeground = null;
    }
}

function NtUserIntSetActiveWindow(peb: PEB, hWnd: HWND) {
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
            const desktop = ObGetObject<WND>(NtGetDesktopWindow(peb));
            const children = desktop.pChildren;

            let i = 0;
            let wndTemp = ObGetObject<WND>(children[i]);
            while (wndTemp && !(wndTemp.dwStyle & WS.VISIBLE)) {
                i++;
                wndTemp = ObGetObject<WND>(children[i]);
            }

            if (wnd != wndTemp || (wndPrev && !IntIsWindowVisible(wndPrev))) {
                if (!async || peb === gpqForeground) {
                    let flags = SWP.NOSIZE | SWP.NOMOVE;
                    if (wnd == wndTemp) {
                        flags |= SWP.NOACTIVATE;
                    }

                    await NtSetWindowPos(peb, wnd.hWnd, HWND_TOP, 0, 0, 0, 0, flags);
                }
            }
        }
    }

    const wndOwner = ObGetObject<WND>(wnd?.hOwner);
    if (wndOwner) {
        const idx = wndOwner.pChildren.indexOf(wnd.hWnd);
        if (idx != 0) {
            const desktop = ObGetObject<WND>(NtGetDesktopWindow(peb));
            const children = desktop.pChildren;
            if (wnd.hParent === wndOwner.hWnd) {
                children.splice(idx, 1);
                children.unshift(wnd.hWnd);
            }
        }
    }
}