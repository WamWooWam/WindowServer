import { HANDLE } from "./types.js";
import { POINT } from "./gdi32.types.js";

const USER32 = {
    RegisterClass: 0x00000001,
    DefWindowProc: 0x00000002,
    CreateWindowEx: 0x00000003,
}

export const CW_USEDEFAULT = 0x80000000;

export const WS_OVERLAPPED = 0x00000000;
export const WS_POPUP = 0x80000000;
export const WS_CHILD = 0x40000000;
export const WS_MINIMIZE = 0x20000000;
export const WS_VISIBLE = 0x10000000;
export const WS_DISABLED = 0x08000000;
export const WS_CLIPSIBLINGS = 0x04000000;
export const WS_CLIPCHILDREN = 0x02000000;
export const WS_MAXIMIZE = 0x01000000;
export const WS_CAPTION = 0x00C00000;
export const WS_BORDER = 0x00800000;
export const WS_DLGFRAME = 0x00400000;
export const WS_VSCROLL = 0x00200000;
export const WS_HSCROLL = 0x00100000;
export const WS_SYSMENU = 0x00080000;
export const WS_THICKFRAME = 0x00040000;
export const WS_GROUP = 0x00020000;
export const WS_TABSTOP = 0x00010000;

export const WS_MINIMIZEBOX = 0x00020000;
export const WS_MAXIMIZEBOX = 0x00010000;

export const WS_TILED = WS_OVERLAPPED;
export const WS_ICONIC = WS_MINIMIZE;
export const WS_SIZEBOX = WS_THICKFRAME;
export const WS_OVERLAPPEDWINDOW = WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX;
export const WS_TILEDWINDOW = WS_OVERLAPPEDWINDOW;
export const WS_POPUPWINDOW = WS_POPUP | WS_BORDER | WS_SYSMENU;
export const WS_CHILDWINDOW = WS_CHILD;

export const WS_MINIMIZED = 0x200000000;

export const WS_EX_DLGMODALFRAME = 0x00000001;
export const WS_EX_NOPARENTNOTIFY = 0x00000004;
export const WS_EX_TOPMOST = 0x00000008;
export const WS_EX_ACCEPTFILES = 0x00000010;
export const WS_EX_TRANSPARENT = 0x00000020;
export const WS_EX_MDICHILD = 0x00000040;
export const WS_EX_TOOLWINDOW = 0x00000080;
export const WS_EX_WINDOWEDGE = 0x00000100;
export const WS_EX_CLIENTEDGE = 0x00000200;
export const WS_EX_CONTEXTHELP = 0x00000400;
export const WS_EX_RIGHT = 0x00001000;
export const WS_EX_LEFT = 0x00000000;
export const WS_EX_RTLREADING = 0x00002000;
export const WS_EX_LTRREADING = 0x00000000;
export const WS_EX_LEFTSCROLLBAR = 0x00004000;
export const WS_EX_RIGHTSCROLLBAR = 0x00000000;
export const WS_EX_CONTROLPARENT = 0x00010000;
export const WS_EX_STATICEDGE = 0x00020000;
export const WS_EX_APPWINDOW = 0x00040000;
export const WS_EX_OVERLAPPEDWINDOW = WS_EX_WINDOWEDGE | WS_EX_CLIENTEDGE;
export const WS_EX_PALETTEWINDOW = WS_EX_WINDOWEDGE | WS_EX_TOOLWINDOW | WS_EX_TOPMOST;

export const WS_EX_LAYERED = 0x00080000;
export const WS_EX_NOINHERITLAYOUT = 0x00100000;
export const WS_EX_NOREDIRECTIONBITMAP = 0x00200000;
export const WS_EX_LAYOUTRTL = 0x00400000;
export const WS_EX_COMPOSITED = 0x02000000;
export const WS_EX_NOACTIVATE = 0x08000000;

export const SM_CXSCREEN = 0;
export const SM_CYSCREEN = 1;
export const SM_CXVSCROLL = 2;
export const SM_CYHSCROLL = 3;
export const SM_CYCAPTION = 4;
export const SM_CXBORDER = 5;
export const SM_CYBORDER = 6;
export const SM_CXDLGFRAME = 7;
export const SM_CYDLGFRAME = 8;
export const SM_CXFRAME = 32;
export const SM_CYFRAME = 33;
export const SM_CXMINIMIZED = 57;
export const SM_CYMINIMIZED = 58;


export type HWND = HANDLE;
export type HINSTANCE = HANDLE;
export type HICON = HANDLE;
export type HCURSOR = HANDLE;
export type HBRUSH = HANDLE;
export type HMENU = HANDLE;

export type WPARAM = number | any;
export type LPARAM = number | any;
export type LRESULT = number | any;

export type ATOM = number;

export type WNDPROC = (hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM) => LRESULT | Promise<LRESULT>;

export interface WNDCLASS {
    style: number;
    lpfnWndProc: WNDPROC;
    cbClsExtra: number;
    cbWndExtra: number;
    hInstance: HINSTANCE;
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    lpszMenuName: number | string;
    lpszClassName: number | string;
}

export interface WNDCLASSEX extends WNDCLASS {
    cbSize: number;
    hIconSm: HANDLE;
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

export interface MINMAXINFO {
    ptReserved: POINT;
    ptMaxSize: POINT;
    ptMaxPosition: POINT;
    ptMinTrackSize: POINT;
    ptMaxTrackSize: POINT;
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

export default USER32;