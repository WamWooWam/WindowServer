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
    PostQuitMessage: 0x00000009,
    GetDC: 0x0000000A,
    GetSystemMetrics: 0x0000000B,
    SetWindowPos: 0x0000000C,
    CreateDesktop: 0x0000000D,
}

export const HWND_BROADCAST = 0xFFFF;

export const CW_USEDEFAULT = 0x80000000;

export namespace WS {
    export const OVERLAPPED = 0x00000000;
    export const POPUP = 0x80000000;
    export const CHILD = 0x40000000;
    export const MINIMIZE = 0x20000000;
    export const VISIBLE = 0x10000000;
    export const DISABLED = 0x08000000;
    export const CLIPSIBLINGS = 0x04000000;
    export const CLIPCHILDREN = 0x02000000;
    export const MAXIMIZE = 0x01000000;
    export const CAPTION = 0x00C00000;
    export const BORDER = 0x00800000;
    export const DLGFRAME = 0x00400000;
    export const VSCROLL = 0x00200000;
    export const HSCROLL = 0x00100000;
    export const SYSMENU = 0x00080000;
    export const THICKFRAME = 0x00040000;
    export const GROUP = 0x00020000;
    export const TABSTOP = 0x00010000;

    export const MINIMIZEBOX = 0x00020000;
    export const MAXIMIZEBOX = 0x00010000;

    export const TILED = OVERLAPPED;
    export const ICONIC = MINIMIZE;
    export const SIZEBOX = THICKFRAME;
    export const OVERLAPPEDWINDOW = OVERLAPPED | CAPTION | SYSMENU | THICKFRAME | MINIMIZEBOX | MAXIMIZEBOX;
    export const TILEDWINDOW = OVERLAPPEDWINDOW;
    export const POPUPWINDOW = POPUP | BORDER | SYSMENU;
    export const CHILDWINDOW = CHILD;

    export const ACTIVE = 0x40000000;
    export const MINIMIZED = 0x200000000;
    export const MAXIMIZED = 0x100000000;


    export namespace EX {
        export const DLGMODALFRAME = 0x00000001;
        export const NOPARENTNOTIFY = 0x00000004;
        export const TOPMOST = 0x00000008;
        export const ACCEPTFILES = 0x00000010;
        export const TRANSPARENT = 0x00000020;
        export const MDICHILD = 0x00000040;
        export const TOOLWINDOW = 0x00000080;
        export const WINDOWEDGE = 0x00000100;
        export const CLIENTEDGE = 0x00000200;
        export const CONTEXTHELP = 0x00000400;
        export const RIGHT = 0x00001000;
        export const LEFT = 0x00000000;
        export const RTLREADING = 0x00002000;
        export const LTRREADING = 0x00000000;
        export const LEFTSCROLLBAR = 0x00004000;
        export const RIGHTSCROLLBAR = 0x00000000;
        export const CONTROLPARENT = 0x00010000;
        export const STATICEDGE = 0x00020000;
        export const APPWINDOW = 0x00040000;
        export const OVERLAPPEDWINDOW = WINDOWEDGE | CLIENTEDGE;
        export const PALETTEWINDOW = WINDOWEDGE | TOOLWINDOW | TOPMOST;

        export const LAYERED = 0x00080000;
        export const NOINHERITLAYOUT = 0x00100000;
        export const NOREDIRECTIONBITMAP = 0x00200000;
        export const LAYOUTRTL = 0x00400000;
        export const COMPOSITED = 0x02000000;
        export const NOACTIVATE = 0x08000000;
    }
}


export enum SM {
    CXSCREEN = 0,
    CYSCREEN = 1,
    CXVSCROLL = 2,
    CYHSCROLL = 3,
    CYCAPTION = 4,
    CXBORDER = 5,
    CYBORDER = 6,
    CXDLGFRAME = 7,
    CYDLGFRAME = 8,

    CXSIZE = 30,
    CYSIZE = 31,
    CXFRAME = 32,
    CYFRAME = 33,
    CXMINIMIZED = 57,
    CYMINIMIZED = 58,

    CYSMSIZE = 53,
    CXSMSIZE = 54
}


export enum SW {
    HIDE = 0,
    SHOWNORMAL = 1,
    NORMAL = 1,
    SHOWMINIMIZED = 2,
    SHOWMAXIMIZED = 3,
    MAXIMIZE = 3,
    SHOWNOACTIVATE = 4,
    SHOW = 5,
    MINIMIZE = 6,
    SHOWMINNOACTIVE = 7,
    SHOWNA = 8,
    RESTORE = 9,
    SHOWDEFAULT = 10,
    FORCEMINIMIZE = 11,
    MAX = 11,
}

export enum WM {
    NULL = 0x0000,
    CREATE = 0x0001,
    DESTROY = 0x0002,
    MOVE = 0x0003,
    SIZE = 0x0005,
    ACTIVATE = 0x0006,
    SETFOCUS = 0x0007,
    KILLFOCUS = 0x0008,
    ENABLE = 0x000A,
    SETREDRAW = 0x000B,
    SETTEXT = 0x000C,
    GETTEXT = 0x000D,
    GETTEXTLENGTH = 0x000E,
    PAINT = 0x000F,
    CLOSE = 0x0010,
    QUERYENDSESSION = 0x0011,
    QUIT = 0x0012,
    QUERYOPEN = 0x0013,
    ERASEBKGND = 0x0014,
    SYSCOLORCHANGE = 0x0015,
    ENDSESSION = 0x0016,
    SHOWWINDOW = 0x0018,
    CTLCOLOR = 0x0019,
    WININICHANGE = 0x001A,
    SETTINGCHANGE = WININICHANGE,
    DEVMODECHANGE = 0x001B,
    ACTIVATEAPP = 0x001C,
    FONTCHANGE = 0x001D,
    TIMECHANGE = 0x001E,
    CANCELMODE = 0x001F,
    SETCURSOR = 0x0020,
    MOUSEACTIVATE = 0x0021,
    CHILDACTIVATE = 0x0022,
    QUEUESYNC = 0x0023,
    GETMINMAXINFO = 0x0024,
    PAINTICON = 0x0026,
    ICONERASEBKGND = 0x0027,
    NEXTDLGCTL = 0x0028,
    SPOOLERSTATUS = 0x002A,
    DRAWITEM = 0x002B,
    MEASUREITEM = 0x002C,
    DELETEITEM = 0x002D,
    VKEYTOITEM = 0x002E,
    CHARTOITEM = 0x002F,
    SETFONT = 0x0030,
    GETFONT = 0x0031,
    SETHOTKEY = 0x0032,
    GETHOTKEY = 0x0033,
    QUERYDRAGICON = 0x0037,
    COMPAREITEM = 0x0039,
    GETOBJECT = 0x003D,
    COMPACTING = 0x0041,
    COMMNOTIFY = 0x0044,
    WINDOWPOSCHANGING = 0x0046,
    WINDOWPOSCHANGED = 0x0047,
    POWER = 0x0048,
    COPYDATA = 0x004A,
    CANCELJOURNAL = 0x004B,
    NOTIFY = 0x004E,
    INPUTLANGCHANGEREQUEST = 0x0050,
    INPUTLANGCHANGE = 0x0051,
    TCARD = 0x0052,
    HELP = 0x0053,
    USERCHANGED = 0x0054,
    NOTIFYFORMAT = 0x0055,
    CONTEXTMENU = 0x007B,
    STYLECHANGING = 0x007C,
    STYLECHANGED = 0x007D,
    DISPLAYCHANGE = 0x007E,
    GETICON = 0x007F,
    SETICON = 0x0080,
    NCCREATE = 0x0081,
    NCDESTROY = 0x0082,
    NCCALCSIZE = 0x0083,
    NCHITTEST = 0x0084,
    NCPAINT = 0x0085,
    NCACTIVATE = 0x0086,

    KEYDOWN = 0x0100,
    KEYUP = 0x0101,
    SYSCOMMAND = 0x0112,

    // TODO: the rest

    USER = 0x0400,
}

export enum SC {
    SIZE = 0xF000,
    MOVE = 0xF010,
    MINIMIZE = 0xF020,
    MAXIMIZE = 0xF030,
    NEXTWINDOW = 0xF040,
    PREVWINDOW = 0xF050,
    CLOSE = 0xF060,
    VSCROLL = 0xF070,
    HSCROLL = 0xF080,
    MOUSEMENU = 0xF090,
    KEYMENU = 0xF100,
    ARRANGE = 0xF110,
    RESTORE = 0xF120,
    TASKLIST = 0xF130,
    SCREENSAVE = 0xF140,
    HOTKEY = 0xF150,
    DEFAULT = 0xF160,
    MONITORPOWER = 0xF170,
    CONTEXTHELP = 0xF180,
}

export enum SWP {
    NOSIZE = 0x0001,
    NOMOVE = 0x0002,
    NOZORDER = 0x0004,
    NOREDRAW = 0x0008,
    NOACTIVATE = 0x0010,
    FRAMECHANGED = 0x0020,
    SHOWWINDOW = 0x0040,
    HIDEWINDOW = 0x0080,
    NOCOPYBITS = 0x0100,
    NOOWNERZORDER = 0x0200,
    NOSENDCHANGING = 0x0400,
    DRAWFRAME = FRAMECHANGED,
    NOREPOSITION = NOOWNERZORDER,
    DEFERERASE = 0x2000,
    ASYNCWINDOWPOS = 0x4000,
}

export enum BS {
    PUSHBUTTON = 0x00000000,
    DEFPUSHBUTTON = 0x00000001,
    CHECKBOX = 0x00000002,
    AUTOCHECKBOX = 0x00000003,
    RADIOBUTTON = 0x00000004,
    THREESTATE = 0x00000005,
    AUTO3STATE = 0x00000006,
    GROUPBOX = 0x00000007,
    USERBUTTON = 0x00000008,
    AUTORADIOBUTTON = 0x00000009,
    PUSHBOX = 0x0000000A,
    OWNERDRAW = 0x0000000B,
    TYPEMASK = 0x0000000F,
    LEFTTEXT = 0x00000020,
    TEXT = 0x00000000,
    ICON = 0x00000040,
    BITMAP = 0x00000080,
    LEFT = 0x00000100,
    RIGHT = 0x00000200,
    CENTER = 0x00000300,
    TOP = 0x00000400,
    BOTTOM = 0x00000800,
    VCENTER = 0x00000C00,
    PUSHLIKE = 0x00001000,
    MULTILINE = 0x00002000,
    NOTIFY = 0x00004000,
    FLAT = 0x00008000,
    RIGHTBUTTON = LEFTTEXT,
}

export enum DC {
    ACTIVE = 0x0001,
    SMALLCAP = 0x0002,
    ICON = 0x0004,
    TEXT = 0x0008,
    INBUTTON = 0x0010,
    GRADIENT = 0x0020,
    BUTTONS = 0x1000,
}

export enum DFC {
    CAPTION = 1,
    MENU = 2,
    SCROLL = 3,
    BUTTON = 4,
}

export enum DFCS {
    CAPTIONCLOSE = 0x0000,
    CAPTIONMIN = 0x0001,
    CAPTIONMAX = 0x0002,
    CAPTIONRESTORE = 0x0003,
    CAPTIONHELP = 0x0004,

    MENUARROW = 0x0000,
    MENUCHECK = 0x0001,
    MENUBULLET = 0x0002,
    MENUARROWRIGHT = 0x0004,

    SCROLLUP = 0x0000,
    SCROLLDOWN = 0x0001,
    SCROLLLEFT = 0x0002,
    SCROLLRIGHT = 0x0003,
    SCROLLCOMBOBOX = 0x0005,
    SCROLLSIZEGRIP = 0x0008,
    SCROLLSIZEGRIPRIGHT = 0x0010,

    BUTTONCHECK = 0x0000,
    BUTTONRADIOIMAGE = 0x0001,
    BUTTONRADIOMASK = 0x0002,
    BUTTONRADIO = 0x0004,
    BUTTON3STATE = 0x0008,
    BUTTONPUSH = 0x0010,

    INACTIVE = 0x0100,
    PUSHED = 0x0200,
    CHECKED = 0x0400,
    TRANSPARENT = 0x0800,
    HOT = 0x1000,

    ADJUSTRECT = 0x2000,
    FLAT = 0x4000,
    MONO = 0x8000,
}

export enum BDR {
    RAISEDOUTER = 0x0001,
    SUNKENOUTER = 0x0002,
    RAISEDINNER = 0x0004,
    SUNKENINNER = 0x0008,

    OUTER = (RAISEDOUTER | SUNKENOUTER),
    INNER = (RAISEDINNER | SUNKENINNER),
    RAISED = (RAISEDOUTER | RAISEDINNER),
    SUNKEN = (SUNKENOUTER | SUNKENINNER),
}

export enum EDGE {
    RAISED = (BDR.RAISEDOUTER | BDR.RAISEDINNER),
    SUNKEN = (BDR.SUNKENOUTER | BDR.SUNKENINNER),
    ETCHED = (BDR.SUNKENOUTER | BDR.RAISEDINNER),
    BUMP = (BDR.RAISEDOUTER | BDR.SUNKENINNER),
}

export enum BF {
    LEFT = 0x0001,
    TOP = 0x0002,
    RIGHT = 0x0004,
    BOTTOM = 0x0008,

    TOPLEFT = (TOP | LEFT),
    TOPRIGHT = (TOP | RIGHT),
    BOTTOMLEFT = (BOTTOM | LEFT),
    BOTTOMRIGHT = (BOTTOM | RIGHT),
    RECT = (LEFT | TOP | RIGHT | BOTTOM),

    DIAGONAL = 0x0010,

    DIAGONAL_ENDTOPRIGHT = (DIAGONAL | TOP | RIGHT),
    DIAGONAL_ENDTOPLEFT = (DIAGONAL | TOP | LEFT),
    DIAGONAL_ENDBOTTOMLEFT = (DIAGONAL | BOTTOM | LEFT),
    DIAGONAL_ENDBOTTOMRIGHT = (DIAGONAL | BOTTOM | RIGHT),

    MIDDLE = 0x0800,
    SOFT = 0x1000,
    ADJUST = 0x2000,
    FLAT = 0x4000,
    MONO = 0x8000,
}

export enum COLOR {
    SCROLLBAR = 0,
    BACKGROUND = 1,
    ACTIVECAPTION = 2,
    INACTIVECAPTION = 3,
    MENU = 4,
    WINDOW = 5,
    WINDOWFRAME = 6,
    MENUTEXT = 7,
    WINDOWTEXT = 8,
    CAPTIONTEXT = 9,
    ACTIVEBORDER = 10,
    INACTIVEBORDER = 11,
    APPWORKSPACE = 12,
    HIGHLIGHT = 13,
    HIGHLIGHTTEXT = 14,
    BTNFACE = 15,
    BTNSHADOW = 16,
    GRAYTEXT = 17,
    BTNTEXT = 18,
    INACTIVECAPTIONTEXT = 19,
    BTNHIGHLIGHT = 20,
    DKSHADOW3D = 21,
    LIGHT3D = 22,
    INFOTEXT = 23,
    INFOBK = 24,

    HOTLIGHT = 26,
    GRADIENTACTIVECAPTION = 27,
    GRADIENTINACTIVECAPTION = 28,
    MENUHILIGHT = 29,
    MENUBAR = 30,
    DESKTOP = BACKGROUND,

    FACE3D = BTNFACE,
    SHADOW3D = BTNSHADOW,
    HIGHLIGHT3D = BTNHIGHLIGHT,
    HILIGHT3D = BTNHIGHLIGHT,
    BTNHILIGHT = BTNHIGHLIGHT,
}

export enum SPI {
    GETNONCLIENTMETRICS = 0x0029,
}

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

export interface LOGFONT {
    lfHeight: number;
    lfWidth: number;
    lfEscapement: number;
    lfOrientation: number;
    lfWeight: number;
    lfItalic: number;
    lfUnderline: number;
    lfStrikeOut: number;
    lfCharSet: number;
    lfOutPrecision: number;
    lfClipPrecision: number;
    lfQuality: number;
    lfPitchAndFamily: number;
    lfFaceName: string;
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

export interface NONCLIENTMETRICS {
    cbSize: number;
    iBorderWidth: number;
    iScrollWidth: number;
    iScrollHeight: number;
    iCaptionWidth: number;
    iCaptionHeight: number;
    lfCaptionFont: LOGFONT;
    iSmCaptionWidth: number;
    iSmCaptionHeight: number;
    lfSmCaptionFont: LOGFONT;
    iMenuWidth: number;
    iMenuHeight: number;
    lfMenuFont: LOGFONT;
    lfStatusFont: LOGFONT;
    lfMessageFont: LOGFONT;
    iPaddedBorderWidth: number;
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

export default USER32;