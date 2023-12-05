import { HBRUSH, HCURSOR, HICON, HINSTANCE, HWND, LPARAM, LRESULT, MSG, WNDPROC, WPARAM } from "../types/user32.types.js";

import DESKTOP from "./desktop.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

export interface MSG_QUEUE {
    EnqueueMessage(msg: MSG, callback?: (result: LRESULT) => void | Promise<void>): void;
    GetMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): Promise<MSG | null>;
    PeekMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number, wRemoveMsg: number): Promise<MSG | null>;
    TranslateMessage(lpMsg: MSG): Promise<boolean>;
    DispatchMessage(lpMsg: MSG): Promise<LRESULT>;
}

export interface W32PROCINFO {
    classes: W32CLASSINFO[];
    lpMsgQueue: MSG_QUEUE;
    hWnds: HWND[];
    hwndFocus: HWND;
    hwndActive: HWND;
    hwndActivePrev: HWND;
    hwndCapture: HWND;

    nVisibleWindows: number;

    flags: {
        bInActivateAppMsg: boolean;
        bAllowForegroundActivate: boolean;
    }
}

export interface W32CLASSINFO {
    style: number;
    exStyle: number;
    lpszClassName: string;
    lpszClassVersion: string;
    lpszMenuName: string;
    lpfnWndProc: number | WNDPROC; 
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    hModule: HINSTANCE;
}

export function NtUserGetProcInfo(peb: PEB | null): W32PROCINFO | null {
    if (!peb) return null;

    let info = peb.lpSubsystems.get(SUBSYS_USER32);
    // if (!(info?.lpParams)) {
    //     throw new Error("W32PROCINFO not initialized");
    // }

    return info?.lpParams as W32PROCINFO;
}

export function NtUserGetDesktop(peb: PEB | null): DESKTOP | null {
    const state = peb && NtUserGetProcInfo(peb);
    if (!state) {
        console.warn("User32 not initialized");
        return null;
    }

    const desktop = ObGetObject<DESKTOP>(peb.hDesktop);

    return desktop;
}