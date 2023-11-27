import { HDC, POINT, RECT } from "./gdi32.types.js";

import { HANDLE } from "./types.js";

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
}

export const HWND_TOP = 0;
export const HWND_BOTTOM = 1;
export const HWND_TOPMOST = -1;
export const HWND_NOTOPMOST = -2;
export const HWND_MESSAGE = -3;
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

    export const ACTIVE = 0x00000001;
    export const MAXIMIZED = 0x00000002;

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
    CYVTHUMB = 9,
    CXHTHUMB = 10,
    CXICON = 11,
    CYICON = 12,
    CXCURSOR = 13,
    CYCURSOR = 14,
    CYMENU = 15,
    CXFULLSCREEN = 16,
    CYFULLSCREEN = 17,
    CYKANJIWINDOW = 18,
    MOUSEPRESENT = 19,
    CYVSCROLL = 20,
    CXHSCROLL = 21,
    DEBUG = 22,
    SWAPBUTTON = 23,
    RESERVED1 = 24,
    RESERVED2 = 25,
    RESERVED3 = 26,
    RESERVED4 = 27,
    CXMIN = 28,
    CYMIN = 29,
    CXSIZE = 30,
    CYSIZE = 31,
    CXFRAME = 32,
    CYFRAME = 33,
    CXMINTRACK = 34,
    CYMINTRACK = 35,
    CXDOUBLECLK = 36,
    CYDOUBLECLK = 37,
    CXICONSPACING = 38,
    CYICONSPACING = 39,
    MENUDROPALIGNMENT = 40,
    PENWINDOWS = 41,
    DBCSENABLED = 42,
    CMOUSEBUTTONS = 43,
    CXFIXEDFRAME = CXDLGFRAME,
    CYFIXEDFRAME = CYDLGFRAME,
    CXSIZEFRAME = CXFRAME,
    CYSIZEFRAME = CYFRAME,
    SECURE = 44,
    CXEDGE = 45,
    CYEDGE = 46,
    CXMINSPACING = 47,
    CYMINSPACING = 48,
    CXSMICON = 49,
    CYSMICON = 50,
    CYSMCAPTION = 51,
    CXSMSIZE = 52,
    CYSMSIZE = 53,
    CXMENUSIZE = 54,
    CYMENUSIZE = 55,
    ARRANGE = 56,
    CXMINIMIZED = 57,
    CYMINIMIZED = 58,
    CXMAXTRACK = 59,
    CYMAXTRACK = 60,
    CXMAXIMIZED = 61,
    CYMAXIMIZED = 62,
    NETWORK = 63,
    CLEANBOOT = 67,
    CXDRAG = 68,
    CYDRAG = 69,
    SHOWSOUNDS = 70,
    CXMENUCHECK = 71,
    CYMENUCHECK = 72,
    SLOWMACHINE = 73,
    MIDEASTENABLED = 74,
    MOUSEWHEELPRESENT = 75,
    XVIRTUALSCREEN = 76,
    YVIRTUALSCREEN = 77,
    CXVIRTUALSCREEN = 78,
    CYVIRTUALSCREEN = 79,
    CMONITORS = 80,
    SAMEDISPLAYFORMAT = 81,
    IMMENABLED = 82,
    CXFOCUSBORDER = 83,
    CYFOCUSBORDER = 84,
    TABLETPC = 86,
    MEDIACENTER = 87,
    STARTER = 88,
    SERVERR2 = 89,
    MOUSEHORIZONTALWHEELPRESENT = 91,
    CXPADDEDBORDER = 92,
    DIGITIZER = 94,
    MAXIMUMTOUCHES = 95,
    CMETRICS = 97,

    REMOTESESSION = 0x1000,
    SHUTTINGDOWN = 0x2000,
    REMOTECONTROL = 0x2001,
    CARETBLINKINGENABLED = 0x2002,
    CONVERTIBLESLATEMODE = 0x2003,
    SYSTEMDOCKED = 0x2004,
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
    GETDLGCODE = 0x0087,
    SYNCPAINT = 0x0088,
    NCMOUSEMOVE = 0x00A0,
    NCLBUTTONDOWN = 0x00A1,
    NCLBUTTONUP = 0x00A2,
    NCLBUTTONDBLCLK = 0x00A3,
    NCRBUTTONDOWN = 0x00A4,
    NCRBUTTONUP = 0x00A5,
    NCRBUTTONDBLCLK = 0x00A6,
    NCMBUTTONDOWN = 0x00A7,
    NCMBUTTONUP = 0x00A8,
    NCMBUTTONDBLCLK = 0x00A9,
    NCXBUTTONDOWN = 0x00AB,
    NCXBUTTONUP = 0x00AC,
    NCXBUTTONDBLCLK = 0x00AD,
    INPUT_DEVICE_CHANGE = 0x00FE,
    INPUT = 0x00FF,
    KEYDOWN = 0x0100,
    KEYUP = 0x0101,
    CHAR = 0x0102,
    DEADCHAR = 0x0103,
    SYSCOMMAND = 0x0112,

    MOUSEMOVE = 0x0200,
    LBUTTONDOWN = 0x0201,
    LBUTTONUP = 0x0202,
    LBUTTONDBLCLK = 0x0203,
    RBUTTONDOWN = 0x0204,
    RBUTTONUP = 0x0205,
    RBUTTONDBLCLK = 0x0206,
    MBUTTONDOWN = 0x0207,
    MBUTTONUP = 0x0208,
    MBUTTONDBLCLK = 0x0209,

    SIZING = 0x0214,
    MOVING = 0x0216,

    ENTERSIZEMOVE = 0x0231,
    EXITSIZEMOVE = 0x0232,

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

export enum HT {
    ERROR = -2,
    TRANSPARENT = -1,
    NOWHERE = 0,
    CLIENT = 1,
    CAPTION = 2,
    SYSMENU = 3,
    GROWBOX = 4,
    MENU = 5,
    HSCROLL = 6,
    VSCROLL = 7,
    MINBUTTON = 8,
    MAXBUTTON = 9,
    LEFT = 10,
    RIGHT = 11,
    TOP = 12,
    TOPLEFT = 13,
    TOPRIGHT = 14,
    BOTTOM = 15,
    BOTTOMLEFT = 16,
    BOTTOMRIGHT = 17,
    BORDER = 18,
    OBJECT = 19,
    CLOSE = 20,
    HELP = 21,
}

export enum WMSZ {
    LEFT = 1,
    RIGHT = 2,
    TOP = 3,
    TOPLEFT = 4,
    TOPRIGHT = 5,
    BOTTOM = 6,
    BOTTOMLEFT = 7,
    BOTTOMRIGHT = 8,
}

export enum VK {
    LBUTTON = 0x01,
    RBUTTON = 0x02,
    CANCEL = 0x03,
    MBUTTON = 0x04,
    XBUTTON1 = 0x05,
    XBUTTON2 = 0x06,
    BACK = 0x08,
    TAB = 0x09,
    CLEAR = 0x0C,
    RETURN = 0x0D,
    SHIFT = 0x10,
    CONTROL = 0x11,
    MENU = 0x12,
    PAUSE = 0x13,
    CAPITAL = 0x14,
    KANA = 0x15,
    HANGEUL = 0x15,
    HANGUL = 0x15,
    JUNJA = 0x17,
    FINAL = 0x18,
    HANJA = 0x19,
    KANJI = 0x19,
    ESCAPE = 0x1B,
    CONVERT = 0x1C,
    NONCONVERT = 0x1D,
    ACCEPT = 0x1E,
    MODECHANGE = 0x1F,
    SPACE = 0x20,
    PRIOR = 0x21,
    NEXT = 0x22,
    END = 0x23,
    HOME = 0x24,
    LEFT = 0x25,
    UP = 0x26,
    RIGHT = 0x27,
    DOWN = 0x28,
    SELECT = 0x29,
    PRINT = 0x2A,
    EXECUTE = 0x2B,
    SNAPSHOT = 0x2C,
    INSERT = 0x2D,
    DELETE = 0x2E,
    HELP = 0x2F,
    LWIN = 0x5B,
    RWIN = 0x5C,
    APPS = 0x5D,
    SLEEP = 0x5F,
    NUMPAD0 = 0x60,
    NUMPAD1 = 0x61,
    NUMPAD2 = 0x62,
    NUMPAD3 = 0x63,
    NUMPAD4 = 0x64,
    NUMPAD5 = 0x65,
    NUMPAD6 = 0x66,
    NUMPAD7 = 0x67,
    NUMPAD8 = 0x68,
    NUMPAD9 = 0x69,
    MULTIPLY = 0x6A,
    ADD = 0x6B,
    SEPARATOR = 0x6C,
    SUBTRACT = 0x6D,
    DECIMAL = 0x6E,
    DIVIDE = 0x6F,
    F1 = 0x70,
    F2 = 0x71,
    F3 = 0x72,
    F4 = 0x73,
    F5 = 0x74,
    F6 = 0x75,
    F7 = 0x76,
    F8 = 0x77,
    F9 = 0x78,
    F10 = 0x79,
    F11 = 0x7A,
    F12 = 0x7B,
    F13 = 0x7C,
    F14 = 0x7D,
    F15 = 0x7E,
    F16 = 0x7F,
    F17 = 0x80,
    F18 = 0x81,
    F19 = 0x82,
    F20 = 0x83,
    F21 = 0x84,
    F22 = 0x85,
    F23 = 0x86,
    F24 = 0x87,
    NUMLOCK = 0x90,
    SCROLL = 0x91,
    OEM_NEC_EQUAL = 0x92,
    OEM_FJ_JISHO = 0x92,
    OEM_FJ_MASSHOU = 0x93,
    OEM_FJ_TOUROKU = 0x94,
    OEM_FJ_LOYA = 0x95,
    OEM_FJ_ROYA = 0x96,
    LSHIFT = 0xA0,
    RSHIFT = 0xA1,
    LCONTROL = 0xA2,
    RCONTROL = 0xA3,
    LMENU = 0xA4,
    RMENU = 0xA5,
    BROWSER_BACK = 0xA6,
    BROWSER_FORWARD = 0xA7,
    BROWSER_REFRESH = 0xA8,
    BROWSER_STOP = 0xA9,
    BROWSER_SEARCH = 0xAA,
    BROWSER_FAVORITES = 0xAB,
    BROWSER_HOME = 0xAC,
    VOLUME_MUTE = 0xAD,
    VOLUME_DOWN = 0xAE,
    VOLUME_UP = 0xAF,
    MEDIA_NEXT_TRACK = 0xB0,
    MEDIA_PREV_TRACK = 0xB1,
    MEDIA_STOP = 0xB2,
    MEDIA_PLAY_PAUSE = 0xB3,
    LAUNCH_MAIL = 0xB4,
    LAUNCH_MEDIA_SELECT = 0xB5,
    LAUNCH_APP1 = 0xB6,
    LAUNCH_APP2 = 0xB7,
    OEM_1 = 0xBA,
    OEM_PLUS = 0xBB,
    OEM_COMMA = 0xBC,
    OEM_MINUS = 0xBD,
    OEM_PERIOD = 0xBE,
    OEM_2 = 0xBF,
    OEM_3 = 0xC0,
    OEM_4 = 0xDB,
    OEM_5 = 0xDC,
    OEM_6 = 0xDD,
    OEM_7 = 0xDE,
    OEM_8 = 0xDF,
    OEM_AX = 0xE1,
    OEM_102 = 0xE2,
    ICO_HELP = 0xE3,
    ICO_00 = 0xE4,
    PROCESSKEY = 0xE5,
    ICO_CLEAR = 0xE6,
    PACKET = 0xE7,
    OEM_RESET = 0xE9,
    OEM_JUMP = 0xEA,
    OEM_PA1 = 0xEB,
    OEM_PA2 = 0xEC,
    OEM_PA3 = 0xED,
    OEM_WSCTRL = 0xEE,
    OEM_CUSEL = 0xEF,
    OEM_ATTN = 0xF0,
    OEM_FINISH = 0xF1,
    OEM_COPY = 0xF2,
    OEM_AUTO = 0xF3,
    OEM_ENLW = 0xF4,
    OEM_BACKTAB = 0xF5,
    ATTN = 0xF6,
    CRSEL = 0xF7,
    EXSEL = 0xF8,
    EREOF = 0xF9,
    PLAY = 0xFA,
    ZOOM = 0xFB,
    NONAME = 0xFC,
    PA1 = 0xFD,
    OEM_CLEAR = 0xFE,
}

export enum SS {
    LEFT = 0x00000000,
    CENTER = 0x00000001,
    RIGHT = 0x00000002,
    ICON = 0x00000003,
    BLACKRECT = 0x00000004,
    GRAYRECT = 0x00000005,
    WHITERECT = 0x00000006,
    BLACKFRAME = 0x00000007,
    GRAYFRAME = 0x00000008,
    WHITEFRAME = 0x00000009,
    USERITEM = 0x0000000A,
    SIMPLE = 0x0000000B,
    LEFTNOWORDWRAP = 0x0000000C,
    OWNERDRAW = 0x0000000D,
    BITMAP = 0x0000000E,
    ENHMETAFILE = 0x0000000F,
    ETCHEDHORZ = 0x00000010,
    ETCHEDVERT = 0x00000011,
    ETCHEDFRAME = 0x00000012,
    TYPEMASK = 0x0000001F,

    REALSIZECONTROL = 0x00000040,
    NOPREFIX = 0x00000080, /* Don't do "&" character translation */
    NOTIFY = 0x00000100,
    CENTERIMAGE = 0x00000200,
    RIGHTJUST = 0x00000400,
    REALSIZEIMAGE = 0x00000800,
    SUNKEN = 0x00001000,
    EDITCONTROL = 0x00002000,
    ENDELLIPSIS = 0x00004000,
    PATHELLIPSIS = 0x00008000,
    WORDELLIPSIS = 0x0000C000,
    ELLIPSISMASK = 0x0000C000,
}

export enum ODT {
    MENU = 1,
    LISTBOX = 2,
    COMBOBOX = 3,
    BUTTON = 4,
    STATIC = 5,
}

export enum ODA {
    DRAWENTIRE = 1,
    SELECT = 2,
    FOCUS = 4,
}

export enum ODS {
    SELECTED = 1,
    GRAYED = 2,
    DISABLED = 4,
    CHECKED = 8,
    FOCUS = 16,
    DEFAULT = 32,
    COMBOBOXEDIT = 4096,
    HOTLIGHT = 0x0040,
    INACTIVE = 0x0080,
    NOACCEL = 0x0100,
    NOFOCUSRECT = 0x0200,
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

export function LOWORD(lParam: LPARAM) {
    return lParam & 0xFFFF;
}

export function HIWORD(lParam: LPARAM) {
    return (lParam >> 16) & 0xFFFF;
}

export interface POINTS {
    x: number;
    y: number;
}

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
export interface DRAWITEMSTRUCT {
    CtlType: number;
    CtlID: number;
    itemID: number;
    itemAction: number;
    itemState: number;
    hwndItem: HWND;
    hDC: HDC;
    rcItem: RECT;
    itemData: number;
}

export default USER32;