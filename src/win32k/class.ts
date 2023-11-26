import { ATOM, HWND, LPARAM, WNDCLASS, WNDCLASSEX, WNDCLASS_WIRE, WNDPROC, WPARAM } from "../types/user32.types.js";
import { GetW32ProcInfo, W32CLASSINFO, W32PROCINFO } from "./shared.js";

import { NtDoCallbackAsync } from "../callback.js";
import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

function CreateWndProcCallback(peb: PEB, lpfnWndProc: number | WNDPROC): WNDPROC {
    if (typeof lpfnWndProc === "number") {
        async function NT_IS_CALLING_INTO_USERSPACE(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<number> {
            const now = performance.now();
            try {
                return (await NtDoCallbackAsync(peb, SUBSYS_USER32, <number>lpfnWndProc, [hWnd, uMsg, wParam, lParam])).data;
            }
            finally {
                performance.measure(`RemoteWndProc:${lpfnWndProc}`, { start: now, end: performance.now() });
            }
        }

        return NT_IS_CALLING_INTO_USERSPACE;
    }
    else if(typeof lpfnWndProc === "function") {
        function LocalWndProcCallback(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): number {
            const now = performance.now();
            try {
                return (<Function>lpfnWndProc)(hWnd, uMsg, wParam, lParam);
            }
            finally {
                performance.measure(`LocalWndProc:${(<Function>lpfnWndProc).name}`, { start: now, end: performance.now() });
            }
        }

        return LocalWndProcCallback;
    }
}

export function NtRegisterClassEx(peb: PEB, lpWndClass: WNDCLASS_WIRE | WNDCLASSEX): ATOM {
    const state = GetW32ProcInfo(peb);
    if (!state) {
        console.warn("User32 not initialized");
        return 0;
    }

    const className = lpWndClass.lpszClassName as string;

    if (NtFindClass(state, className) != null) {
        return 0;
    }

    const lpfnWndProc = CreateWndProcCallback(peb, lpWndClass.lpfnWndProc);
    const classInfo: W32CLASSINFO = {
        style: lpWndClass.style,
        exStyle: 0,
        lpszClassName: className,
        lpszClassVersion: className,
        lpszMenuName: lpWndClass.lpszMenuName as string,
        lpfnWndProc: lpfnWndProc,
        hIcon: lpWndClass.hIcon,
        hCursor: lpWndClass.hCursor,
        hbrBackground: lpWndClass.hbrBackground,
        hModule: lpWndClass.hInstance
    };


    state.classes.push(classInfo);
    return state.classes.length - 1;
}

export function NtFindClass(state: W32PROCINFO, className: string | number): W32CLASSINFO | null {
    // TODO: handle global classes    
    return state.classes.find(c => c.lpszClassName === className) || null;
}