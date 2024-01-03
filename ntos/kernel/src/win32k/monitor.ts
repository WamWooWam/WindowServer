import { HWND_BROADCAST, WM } from "../subsystems/user32.js";
import { POINT, RECT } from "../subsystems/gdi32.js";

import { HANDLE } from "@window-server/sdk/types/types.js";
import { NtPostMessage } from "./msg.js";
import { ObSetObject } from "../objects.js";

export type MONITOR = {
    hMonitor: HANDLE;
    rcMonitor: RECT;
    rcWork: RECT;
    dwFlags: number;
    cWndStack: number;
    lpfnHooks: Function[];
}

export type LPMONITOR = MONITOR | null;

let defaultMonitor: LPMONITOR = null;
export function NtGetPrimaryMonitor(): MONITOR {
    if (defaultMonitor === null) {
        defaultMonitor = {
            hMonitor: 0,
            rcMonitor: {
                left: 0,
                top: 0,
                right: window.innerWidth,
                bottom: window.innerHeight
            },
            rcWork: {
                left: 0,
                top: 0,
                right: window.innerWidth,
                bottom: window.innerHeight
            },
            dwFlags: 1,
            cWndStack: 1,
            lpfnHooks: []
        };

        defaultMonitor.hMonitor = ObSetObject(defaultMonitor, "MONITOR", 0);

        document.body.onresize = () => {
            if (!defaultMonitor) return;

            defaultMonitor.rcMonitor.right = window.innerWidth;
            defaultMonitor.rcMonitor.bottom = window.innerHeight;
            defaultMonitor.rcWork.right = window.innerWidth;
            defaultMonitor.rcWork.bottom = window.innerHeight;

            NtPostMessage(null, [HWND_BROADCAST, WM.DISPLAYCHANGE, 0, 0]);

            for (const lpfnHook of defaultMonitor.lpfnHooks) {
                lpfnHook(defaultMonitor);
            }
        };
    }

    return defaultMonitor;
}

export function NtMonitorFromWindow(hWnd: HANDLE): MONITOR {
    return NtGetPrimaryMonitor();
}

export function NtMonitorFromPoint(pt: POINT): MONITOR {
    return NtGetPrimaryMonitor();
}

export function NtMonitorFromRect(lprc: RECT): MONITOR {
    return NtGetPrimaryMonitor();
}

export function NtRegisterMonitorHook(lpfnHook: Function): boolean {
    const monitor = NtGetPrimaryMonitor();
    monitor.lpfnHooks.push(lpfnHook);
    return true;
}

// export function NtGetMonitorInfo(hMonitor: HANDLE, lpmi: MONITORINFO): boolean {
//     const monitor = ObGetObject<MONITOR>(hMonitor);
//     if (!monitor) {
//         return false;
//     }

//     lpmi.rcMonitor = monitor.rcMonitor;
//     lpmi.rcWork = monitor.rcWork;
//     lpmi.dwFlags = monitor.dwFlags;

//     return true;
// }