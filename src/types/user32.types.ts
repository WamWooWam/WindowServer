import { HANDLE } from "./types.js";
import { POINT } from "./gdi32.types.js";

const USER32 = {
    RegisterClass: 0x00000001,
    DefWindowProc: 0x00000002,
    CreateWindowEx: 0x00000003,
    ShowWindow: 0x00000004,
    GetMessage: 0x00000005,
    PeekMessage: 0x00000006,
    TranslateMessage: 0x00000007,
    DispatchMessage: 0x00000008,
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

export const SM_CXSIZE = 30;
export const SM_CYSIZE = 31;
export const SM_CXFRAME = 32;
export const SM_CYFRAME = 33;
export const SM_CXMINIMIZED = 57;
export const SM_CYMINIMIZED = 58;

export const SW_HIDE = 0;
export const SW_SHOWNORMAL = 1;
export const SW_NORMAL = 1;
export const SW_SHOWMINIMIZED = 2;
export const SW_SHOWMAXIMIZED = 3;
export const SW_MAXIMIZE = 3;
export const SW_SHOWNOACTIVATE = 4;
export const SW_SHOW = 5;
export const SW_MINIMIZE = 6;
export const SW_SHOWMINNOACTIVE = 7;
export const SW_SHOWNA = 8;
export const SW_RESTORE = 9;
export const SW_SHOWDEFAULT = 10;
export const SW_FORCEMINIMIZE = 11;
export const SW_MAX = 11;

export const WM_NULL = 0x0000;
export const WM_CREATE = 0x0001;
export const WM_DESTROY = 0x0002;
export const WM_MOVE = 0x0003;
export const WM_SIZE = 0x0005;
export const WM_ACTIVATE = 0x0006;
export const WM_SETFOCUS = 0x0007;
export const WM_KILLFOCUS = 0x0008;
export const WM_ENABLE = 0x000A;
export const WM_SETREDRAW = 0x000B;
export const WM_SETTEXT = 0x000C;
export const WM_GETTEXT = 0x000D;
export const WM_GETTEXTLENGTH = 0x000E;
export const WM_PAINT = 0x000F;
export const WM_CLOSE = 0x0010;
export const WM_QUERYENDSESSION = 0x0011;
export const WM_QUIT = 0x0012;
export const WM_QUERYOPEN = 0x0013;
export const WM_ERASEBKGND = 0x0014;
export const WM_SYSCOLORCHANGE = 0x0015;
export const WM_ENDSESSION = 0x0016;
export const WM_SHOWWINDOW = 0x0018;
export const WM_CTLCOLOR = 0x0019;
export const WM_WININICHANGE = 0x001A;
export const WM_SETTINGCHANGE = WM_WININICHANGE;
export const WM_DEVMODECHANGE = 0x001B;
export const WM_ACTIVATEAPP = 0x001C;
export const WM_FONTCHANGE = 0x001D;
export const WM_TIMECHANGE = 0x001E;
export const WM_CANCELMODE = 0x001F;
export const WM_SETCURSOR = 0x0020;
export const WM_MOUSEACTIVATE = 0x0021;
export const WM_CHILDACTIVATE = 0x0022;
export const WM_QUEUESYNC = 0x0023;
export const WM_GETMINMAXINFO = 0x0024;
export const WM_PAINTICON = 0x0026;
export const WM_ICONERASEBKGND = 0x0027;
export const WM_NEXTDLGCTL = 0x0028;
export const WM_SPOOLERSTATUS = 0x002A;
export const WM_DRAWITEM = 0x002B;
export const WM_MEASUREITEM = 0x002C;
export const WM_DELETEITEM = 0x002D;
export const WM_VKEYTOITEM = 0x002E;
export const WM_CHARTOITEM = 0x002F;
export const WM_SETFONT = 0x0030;
export const WM_GETFONT = 0x0031;
export const WM_SETHOTKEY = 0x0032;
export const WM_GETHOTKEY = 0x0033;
export const WM_QUERYDRAGICON = 0x0037;
export const WM_COMPAREITEM = 0x0039;
export const WM_GETOBJECT = 0x003D;
export const WM_COMPACTING = 0x0041;
export const WM_COMMNOTIFY = 0x0044;
export const WM_WINDOWPOSCHANGING = 0x0046;
export const WM_WINDOWPOSCHANGED = 0x0047;
export const WM_POWER = 0x0048;
export const WM_COPYDATA = 0x004A;
export const WM_CANCELJOURNAL = 0x004B;
export const WM_NOTIFY = 0x004E;
export const WM_INPUTLANGCHANGEREQUEST = 0x0050;
export const WM_INPUTLANGCHANGE = 0x0051;
export const WM_TCARD = 0x0052;
export const WM_HELP = 0x0053;
export const WM_USERCHANGED = 0x0054;
export const WM_NOTIFYFORMAT = 0x0055;
export const WM_CONTEXTMENU = 0x007B;
export const WM_STYLECHANGING = 0x007C;
export const WM_STYLECHANGED = 0x007D;
export const WM_DISPLAYCHANGE = 0x007E;
export const WM_GETICON = 0x007F;
export const WM_SETICON = 0x0080;
export const WM_NCCREATE = 0x0081;
export const WM_NCDESTROY = 0x0082;
export const WM_NCCALCSIZE = 0x0083;
export const WM_NCHITTEST = 0x0084;
export const WM_NCPAINT = 0x0085;
export const WM_NCACTIVATE = 0x0086;

export const WM_KEYDOWN = 0x0100;
export const WM_KEYUP = 0x0101;

// TODO: the rest

export const WM_USER = 0x0400;

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

export interface MSG {
    hWnd: HWND;
    message: number;
    wParam: WPARAM;
    lParam: LPARAM;
    time?: number;
    pt?: {
        x: number;
        y: number;
    };
}

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

export default USER32;