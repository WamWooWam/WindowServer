import { HWND_BROADCAST, WM } from "../types/user32.types.js";

import { HANDLE } from "../types/types.js";
import { NtPostMessage } from "./msg.js";
import { ObSetObject } from "../objects.js";
import { RECT } from "../types/gdi32.types.js";

export type MONITOR = {
    hMonitor: HANDLE;
    rcMonitor: RECT;
    rcWork: RECT;
    dwFlags: number;
    cWndStack: number;
    lpfnHooks: Function[];
}

let defaultMonitor: MONITOR = null;
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

export function NtMonitorFromPoint(pt: { x: number, y: number }): MONITOR {
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