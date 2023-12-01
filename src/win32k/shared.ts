import { HBRUSH, HCURSOR, HICON, HINSTANCE, HWND, LPARAM, LRESULT, MSG, WPARAM } from "../types/user32.types.js";

import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

export interface MSG_QUEUE {
    EnqueueMessage(msg: MSG, callback?: (result: LRESULT) => void | Promise<void>): void;
    GetMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): Promise<MSG>;
    PeekMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number, wRemoveMsg: number): Promise<MSG>;
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
    lpfnWndProc: (hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM) => LRESULT | Promise<LRESULT>;
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    hModule: HINSTANCE;
}

export function GetW32ProcInfo(peb: PEB): W32PROCINFO | null {
    if (!peb) return null;

    let info = peb.lpSubsystems.get(SUBSYS_USER32);
    // if (!(info?.lpParams)) {
    //     throw new Error("W32PROCINFO not initialized");
    // }

    return info?.lpParams as W32PROCINFO;
}
