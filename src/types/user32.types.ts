import { HANDLE } from "./types.js";

const USER32 = {
    RegisterClass: 0x00000001,
    DefWindowProc: 0x00000002,
}

export type HWND = HANDLE;
export type HINSTANCE = HANDLE;
export type HICON = HANDLE;
export type HCURSOR = HANDLE;
export type HBRUSH = HANDLE;
export type HMENU = HANDLE;

export type WPARAM = number;
export type LPARAM = number;
export type LRESULT = number;

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

export type WNDPROC_PARAMS = [hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM];

export interface REGISTER_CLASS {
    lpWndClass: WNDCLASS | WNDCLASS_WIRE;
}

export interface REGISTER_CLASS_REPLY {
    retVal: ATOM;
}

export default USER32;