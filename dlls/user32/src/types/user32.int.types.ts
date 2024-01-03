import { ATOM, HCURSOR, HICON, HINSTANCE, HMENU, HWND, LPARAM, LRESULT, MONITORINFO, MONITORINFOEX, MSG, PAINTSTRUCT, WNDCLASS, WPARAM } from "./user32.types.js";
import { HBRUSH, HDC, LPPOINT, LPRECT, POINT } from "@window-server/gdi32";

import { HANDLE } from "@window-server/ntdll";

export * from "./user32.types.js";

// TODO: sort these
const USER32 = {
    SetSystemMetrics: -1,

    RegisterClass: 0x00000001,
    DefWindowProc: 0x00000002,
    CreateWindowEx: 0x00000003,
    ShowWindow: 0x00000004,
    GetMessage: 0x00000005,
    PeekMessage: 0x00000006,
    TranslateMessage: 0x00000007,
    DispatchMessage: 0x00000008,
    PostQuitMessage: 0x00000009,
    GetDC: 0x0000000A,
    GetSystemMetrics: 0x0000000B,
    SetWindowPos: 0x0000000C,
    CreateDesktop: 0x0000000D,
    GetWindowRect: 0x0000000E,
    ScreenToClient: 0x0000000F,
    FindWindow: 0x00000010,
    GetClientRect: 0x00000011,
    SendMessage: 0x00000012,
    PostMessage: 0x00000013,
    GetProp: 0x00000014,
    SetProp: 0x00000015,
    RemoveProp: 0x00000016,
    GetWindowLong: 0x00000017,
    SetWindowLong: 0x00000018,
    GetParent: 0x00000019,
    SetParent: 0x0000001A,
    CallWindowProc: 0x0000001B,
    LoadImage: 0x0000001C,
    MonitorFromRect: 0x0000001D,
    MonitorFromPoint: 0x0000001E,
    MonitorFromWindow: 0x0000001F,
    GetMonitorInfo: 0x00000020,
    BeginPaint: 0x00000021,
    EndPaint: 0x00000022,
    InvalidateRect: 0x00000023,
    AdjustWindowRect: 0x00000024,
}

export default USER32;

// internal window messages
export enum WMP {
    CREATEELEMENT = 0x8000,
    ADDCHILD = 0x8001,
    REMOVECHILD = 0x8002,
    UPDATEWINDOWSTYLE = 0x8003,
    ASYNC_SETWINDOWPOS = 0x8004,
    ASYNC_SHOWWINDOW = 0x8005,
    ASYNC_SETACTIVEWINDOW = 0x8006,
}

// window placement flags, not windows presentation foundation
export enum WPF {
    SETMINPOSITION = 0x0001,
    RESTORETOMAXIMIZED = 0x0002,
    ASYNCWINDOWPLACEMENT = 0x0004,
    MININIT = 0x0008,
    MAXINIT = 0x0010
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
    lpszMenuName: number | string | null;
    lpszClassName: number | string | null;
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
    lpMsg: MSG | null;
}

export interface PEEK_MESSAGE extends GET_MESSAGE {
    wRemoveMsg: number;
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
    retVal: boolean, lpPoint: LPPOINT;
}

export interface FIND_WINDOW {
    lpClassName: string | null;
    lpWindowName: string | null;
}

export interface GET_CLIENT_RECT {
    hWnd: HWND;
    lpRect: LPRECT;
}

export interface GET_CLIENT_RECT_REPLY {
    retVal: boolean;
    lpRect: LPRECT;
}

export type GET_PROP_PARAMS = {
    hWnd: HWND;
    lpString: string;
}

export type GET_PROP_REPLY = {
    retVal: any;
}

export type SET_PROP_PARAMS = {
    hWnd: HWND;
    lpString: string;
    hData: any;
}

export type SET_PROP_REPLY = {
    retVal: boolean;
}

export type REMOVE_PROP_PARAMS = {
    hWnd: HWND;
    lpString: string;
}

export type REMOVE_PROP_REPLY = {
    retVal: any;
}

export type GET_WINDOW_LONG_PARAMS = {
    hWnd: HWND;
    nIndex: number;
}

export type GET_WINDOW_LONG_REPLY = {
    retVal: number;
}

export type SET_WINDOW_LONG_PARAMS = {
    hWnd: HWND;
    nIndex: number;
    dwNewLong: any;
}

export type SET_WINDOW_LONG_REPLY = {
    retVal: number;
}

export type CALL_WINDOW_PROC_PARAMS = {
    lpPrevWndFunc: number;
    hWnd: HWND;
    uMsg: number;
    wParam: WPARAM;
    lParam: LPARAM;
}

export type CALL_WINDOW_PROC_REPLY = {
    retVal: LRESULT;
}

export type SET_PARENT_PARAMS = {
    hWndChild: HWND;
    hWndNewParent: HWND;
}

export type GET_MONITOR_INFO_PARAMS = {
    hMonitor: HANDLE;
    lpmi: MONITORINFO | MONITORINFOEX;
}

export type GET_MONITOR_INFO_REPLY = {
    retVal: boolean;
    lpmi?: MONITORINFO | MONITORINFOEX;
}

export type LOAD_IMAGE_PARAMS = { hinst: HANDLE, lpszName: string, uType: number, cxDesired: number, cyDesired: number, fuLoad: number };
export type LOAD_IMAGE_REPLY = { retVal: HANDLE };

export type BEGIN_PAINT_PARAMS = { hWnd: HWND, lpPaint: PAINTSTRUCT };
export type BEGIN_PAINT_REPLY = { retVal: HDC, lpPaint: PAINTSTRUCT };

export type END_PAINT_PARAMS = { hWnd: HWND, lpPaint: PAINTSTRUCT };
export type END_PAINT_REPLY = { retVal: boolean };

export type INVALIDATE_RECT_PARAMS = { hWnd: HWND, lpRect: LPRECT, bErase: boolean };
export type INVALIDATE_RECT_REPLY = { retVal: boolean };

export type ADJUST_WINDOW_RECT_PARAMS = { lpRect: LPRECT, dwStyle: number, bMenu: boolean };
export type ADJUST_WINDOW_RECT_REPLY = { retVal: boolean, lpRect: LPRECT };