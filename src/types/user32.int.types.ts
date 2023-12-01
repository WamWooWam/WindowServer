import { ATOM, HCURSOR, HICON, HINSTANCE, HMENU, HWND, LPARAM, MSG, WNDCLASS, WPARAM } from "./user32.types.js";
import { HBRUSH, POINT, RECT } from "./gdi32.types.js";

import { HANDLE } from "./types.js";

// internal window messages
export enum WMP {
    CREATEELEMENT = 0x8000,
    ADDCHILD = 0x8001,
    REMOVECHILD = 0x8002,
    UPDATEWINDOWSTYLE = 0x8003,
    ASYNC_SETWINDOWPOS = 0x8004,
}

export interface WND_DATA {
    pTitleBar: HTMLElement;
    pTitleBarText: HTMLElement;
    pTitleBarControls: HTMLElement;
    pMinimizeButton: HTMLElement;
    pMaximizeButton: HTMLElement;
    pCloseButton: HTMLElement;
}

export interface WNDCLASS_WIRE {
    cbSize?: number;
    style: number;
    lpfnWndProc: number;
    cbClsExtra: number;
    cbWndExtra: number;
    hInstance: HINSTANCE;
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    lpszMenuName: number | string;
    lpszClassName: number | string;
    hIconSm?: HICON;
}

export interface CREATE_WINDOW_EX {
    dwExStyle: number;
    lpClassName: string | number;
    lpWindowName: string;
    dwStyle: number;
    x: number;
    y: number;
    nWidth: number;
    nHeight: number;
    hWndParent: HWND;
    hMenu: HMENU;
    hInstance: HINSTANCE;
    lpParam: any;
}

export interface CREATE_WINDOW_EX_REPLY {
    hWnd: HWND;
}

export type WNDPROC_PARAMS = [hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM];

export interface REGISTER_CLASS {
    lpWndClass: WNDCLASS | WNDCLASS_WIRE;
}

export interface REGISTER_CLASS_REPLY {
    retVal: ATOM;
}

export interface SHOW_WINDOW {
    hWnd: HWND;
    nCmdShow: number;
}

export interface SHOW_WINDOW_REPLY {
    retVal: boolean;
}

export interface GET_MESSAGE {
    lpMsg: MSG;
    hWnd: HWND;
    wMsgFilterMin: number;
    wMsgFilterMax: number;
}

export interface GET_MESSAGE_REPLY {
    retVal: boolean;
    lpMsg: MSG;
}

export interface SET_WINDOW_POS {
    hWnd: HWND;
    hWndInsertAfter: HWND;
    x: number;
    y: number;
    cx: number;
    cy: number;
    uFlags: number;
}

export interface CREATE_DESKTOP {
    lpszDesktop: string;
    lpszDevice: string;
    pDevMode: null;
    dwFlags: number;
    dwDesiredAccess: number;
    lpsa: any;
}

export interface SCREEN_TO_CLIENT {
    hWnd: HWND;
    lpPoint: POINT;
}

export interface SCREEN_TO_CLIENT_REPLY {
    retVal: boolean, lpPoint: POINT;
}

export interface FIND_WINDOW {
    lpClassName: string;
    lpWindowName: string;
}

export interface GET_CLIENT_RECT {
    hWnd: HWND;
    lpRect: RECT;
}

export interface GET_CLIENT_RECT_REPLY {
    retVal: boolean;
    lpRect: RECT;
}