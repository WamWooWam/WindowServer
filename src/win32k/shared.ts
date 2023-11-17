import {
    HBRUSH,
    HCURSOR,
    HICON,
    HINSTANCE,
    HWND,
    LPARAM,
    LRESULT,
    WPARAM
} from "../types/user32.types.js";

import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

export interface W32PROCINFO {
    classes: W32CLASSINFO[];
    hDesktop: HWND;
    hWnds: HWND[];
}

export interface W32CLASSINFO {
    lpszClassName: string;
    lpszClassVersion: string;
    lpszMenuName: string;
    lpfnWndProc: (hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM) => LRESULT | Promise<LRESULT>;
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    hModule: HINSTANCE;
}

export function GetW32ProcInfo(peb: PEB): W32PROCINFO {
    let info = peb.lpSubsystems.get(SUBSYS_USER32);
    if (!info.lpParams) {
        throw new Error("W32PROCINFO not initialized");
    }

    return info.lpParams as W32PROCINFO;
}