import { ATOM, HCURSOR, HICON, HINSTANCE, HMENU, HWND, LPARAM, LRESULT, MSG, WNDCLASS, WPARAM } from "./user32.types.js";
import { HBRUSH, LPPOINT, LPRECT, POINT, RECT } from "./gdi32.types.js";

import { HANDLE } from "./types.js";
import WND from "../win32k/wnd.js";

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

export type PWND = WND | null;

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