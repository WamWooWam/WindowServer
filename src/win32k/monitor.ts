import { HANDLE } from "../types/types.js";
import { ObSetObject } from "../objects.js";
import { RECT } from "../types/gdi32.types.js";

export type MONITOR = {
    hMonitor: HANDLE;
    rcMonitor: RECT;
    rcWork: RECT;
    dwFlags: number;
    cWndStack: number;
}

let defaultMonitor: MONITOR = null;
export function NtGetPrimaryMonitor(): MONITOR {
    if (defaultMonitor === null) {
        defaultMonitor = {
            hMonitor: 0,
            rcMonitor: {
                left: 0,
                top: 0,
                right: document.body.clientWidth,
                bottom: document.body.clientHeight
            },
            rcWork: {
                left: 0,
                top: 0,
                right: document.body.clientWidth,
                bottom: document.body.clientHeight
            },
            dwFlags: 1,
            cWndStack: 1
        };

        defaultMonitor.hMonitor = ObSetObject(defaultMonitor, "MONITOR", 0);
    
        document.body.onresize = () => {
            defaultMonitor.rcMonitor.right = document.body.clientWidth;
            defaultMonitor.rcMonitor.bottom = document.body.clientHeight;
            defaultMonitor.rcWork.right = document.body.clientWidth;
            defaultMonitor.rcWork.bottom = document.body.clientHeight;
        };

        // TODO: raise WM_DISPLAYCHANGE
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