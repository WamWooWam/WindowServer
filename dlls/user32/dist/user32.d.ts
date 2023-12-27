import { POINT, LOGFONT, HDC, RECT } from 'gdi32';
import { HANDLE } from 'ntdll';

declare const HWND_TOP = 0;
declare const HWND_BOTTOM = 1;
declare const HWND_TOPMOST = -1;
declare const HWND_NOTOPMOST = -2;
declare const HWND_MESSAGE = -3;
declare const HWND_BROADCAST = 65535;
declare const CW_USEDEFAULT = 2147483648;
declare namespace WS {
    const OVERLAPPED = 0;
    const POPUP = 2147483648;
    const CHILD = 1073741824;
    const MINIMIZE = 536870912;
    const VISIBLE = 268435456;
    const DISABLED = 134217728;
    const CLIPSIBLINGS = 67108864;
    const CLIPCHILDREN = 33554432;
    const MAXIMIZE = 16777216;
    const CAPTION = 12582912;
    const BORDER = 8388608;
    const DLGFRAME = 4194304;
    const VSCROLL = 2097152;
    const HSCROLL = 1048576;
    const SYSMENU = 524288;
    const THICKFRAME = 262144;
    const GROUP = 131072;
    const TABSTOP = 65536;
    const MINIMIZEBOX = 131072;
    const MAXIMIZEBOX = 65536;
    const TILED = 0;
    const ICONIC = 536870912;
    const SIZEBOX = 262144;
    const OVERLAPPEDWINDOW: number;
    const TILEDWINDOW: number;
    const POPUPWINDOW: number;
    const CHILDWINDOW = 1073741824;
    namespace EX {
        const DLGMODALFRAME = 1;
        const NOPARENTNOTIFY = 4;
        const TOPMOST = 8;
        const ACCEPTFILES = 16;
        const TRANSPARENT = 32;
        const MDICHILD = 64;
        const TOOLWINDOW = 128;
        const WINDOWEDGE = 256;
        const CLIENTEDGE = 512;
        const CONTEXTHELP = 1024;
        const RIGHT = 4096;
        const LEFT = 0;
        const RTLREADING = 8192;
        const LTRREADING = 0;
        const LEFTSCROLLBAR = 16384;
        const RIGHTSCROLLBAR = 0;
        const CONTROLPARENT = 65536;
        const STATICEDGE = 131072;
        const APPWINDOW = 262144;
        const OVERLAPPEDWINDOW: number;
        const PALETTEWINDOW: number;
        const LAYERED = 524288;
        const NOINHERITLAYOUT = 1048576;
        const NOREDIRECTIONBITMAP = 2097152;
        const LAYOUTRTL = 4194304;
        const COMPOSITED = 33554432;
        const NOACTIVATE = 134217728;
    }
}
declare enum SM {
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
    CXFIXEDFRAME = 7,
    CYFIXEDFRAME = 8,
    CXSIZEFRAME = 32,
    CYSIZEFRAME = 33,
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
    REMOTESESSION = 4096,
    SHUTTINGDOWN = 8192,
    REMOTECONTROL = 8193,
    CARETBLINKINGENABLED = 8194,
    CONVERTIBLESLATEMODE = 8195,
    SYSTEMDOCKED = 8196
}
declare enum SW {
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
    MAX = 11
}
declare enum WM {
    NULL = 0,
    CREATE = 1,
    DESTROY = 2,
    MOVE = 3,
    SIZE = 5,
    ACTIVATE = 6,
    SETFOCUS = 7,
    KILLFOCUS = 8,
    ENABLE = 10,
    SETREDRAW = 11,
    SETTEXT = 12,
    GETTEXT = 13,
    GETTEXTLENGTH = 14,
    PAINT = 15,
    CLOSE = 16,
    QUERYENDSESSION = 17,
    QUIT = 18,
    QUERYOPEN = 19,
    ERASEBKGND = 20,
    SYSCOLORCHANGE = 21,
    ENDSESSION = 22,
    SHOWWINDOW = 24,
    CTLCOLOR = 25,
    WININICHANGE = 26,
    SETTINGCHANGE = 26,
    DEVMODECHANGE = 27,
    ACTIVATEAPP = 28,
    FONTCHANGE = 29,
    TIMECHANGE = 30,
    CANCELMODE = 31,
    SETCURSOR = 32,
    MOUSEACTIVATE = 33,
    CHILDACTIVATE = 34,
    QUEUESYNC = 35,
    GETMINMAXINFO = 36,
    PAINTICON = 38,
    ICONERASEBKGND = 39,
    NEXTDLGCTL = 40,
    SPOOLERSTATUS = 42,
    DRAWITEM = 43,
    MEASUREITEM = 44,
    DELETEITEM = 45,
    VKEYTOITEM = 46,
    CHARTOITEM = 47,
    SETFONT = 48,
    GETFONT = 49,
    SETHOTKEY = 50,
    GETHOTKEY = 51,
    QUERYDRAGICON = 55,
    COMPAREITEM = 57,
    GETOBJECT = 61,
    COMPACTING = 65,
    COMMNOTIFY = 68,
    WINDOWPOSCHANGING = 70,
    WINDOWPOSCHANGED = 71,
    POWER = 72,
    COPYDATA = 74,
    CANCELJOURNAL = 75,
    NOTIFY = 78,
    INPUTLANGCHANGEREQUEST = 80,
    INPUTLANGCHANGE = 81,
    TCARD = 82,
    HELP = 83,
    USERCHANGED = 84,
    NOTIFYFORMAT = 85,
    CONTEXTMENU = 123,
    STYLECHANGING = 124,
    STYLECHANGED = 125,
    DISPLAYCHANGE = 126,
    GETICON = 127,
    SETICON = 128,
    NCCREATE = 129,
    NCDESTROY = 130,
    NCCALCSIZE = 131,
    NCHITTEST = 132,
    NCPAINT = 133,
    NCACTIVATE = 134,
    GETDLGCODE = 135,
    SYNCPAINT = 136,
    NCMOUSEMOVE = 160,
    NCLBUTTONDOWN = 161,
    NCLBUTTONUP = 162,
    NCLBUTTONDBLCLK = 163,
    NCRBUTTONDOWN = 164,
    NCRBUTTONUP = 165,
    NCRBUTTONDBLCLK = 166,
    NCMBUTTONDOWN = 167,
    NCMBUTTONUP = 168,
    NCMBUTTONDBLCLK = 169,
    NCXBUTTONDOWN = 171,
    NCXBUTTONUP = 172,
    NCXBUTTONDBLCLK = 173,
    INPUT_DEVICE_CHANGE = 254,
    INPUT = 255,
    KEYDOWN = 256,
    KEYUP = 257,
    CHAR = 258,
    DEADCHAR = 259,
    SYSCOMMAND = 274,
    MOUSEMOVE = 512,
    LBUTTONDOWN = 513,
    LBUTTONUP = 514,
    LBUTTONDBLCLK = 515,
    RBUTTONDOWN = 516,
    RBUTTONUP = 517,
    RBUTTONDBLCLK = 518,
    MBUTTONDOWN = 519,
    MBUTTONUP = 520,
    MBUTTONDBLCLK = 521,
    SIZING = 532,
    MOVING = 534,
    ENTERSIZEMOVE = 561,
    EXITSIZEMOVE = 562,
    COMMAND = 273,
    PARENTNOTIFY = 528,
    USER = 1024
}
declare enum SC {
    SIZE = 61440,
    MOVE = 61456,
    MINIMIZE = 61472,
    MAXIMIZE = 61488,
    NEXTWINDOW = 61504,
    PREVWINDOW = 61520,
    CLOSE = 61536,
    VSCROLL = 61552,
    HSCROLL = 61568,
    MOUSEMENU = 61584,
    KEYMENU = 61696,
    ARRANGE = 61712,
    RESTORE = 61728,
    TASKLIST = 61744,
    SCREENSAVE = 61760,
    HOTKEY = 61776,
    DEFAULT = 61792,
    MONITORPOWER = 61808,
    CONTEXTHELP = 61824
}
declare enum SWP {
    NOSIZE = 1,
    NOMOVE = 2,
    NOZORDER = 4,
    NOREDRAW = 8,
    NOACTIVATE = 16,
    FRAMECHANGED = 32,
    SHOWWINDOW = 64,
    HIDEWINDOW = 128,
    NOCOPYBITS = 256,
    NOOWNERZORDER = 512,
    NOSENDCHANGING = 1024,
    DRAWFRAME = 32,
    NOREPOSITION = 512,
    DEFERERASE = 8192,
    ASYNCWINDOWPOS = 16384,
    NOCLIENTSIZE = 2048,
    NOCLIENTMOVE = 4096,
    STATECHANGED = 32768
}
declare enum BS {
    PUSHBUTTON = 0,
    DEFPUSHBUTTON = 1,
    CHECKBOX = 2,
    AUTOCHECKBOX = 3,
    RADIOBUTTON = 4,
    THREESTATE = 5,
    AUTO3STATE = 6,
    GROUPBOX = 7,
    USERBUTTON = 8,
    AUTORADIOBUTTON = 9,
    PUSHBOX = 10,
    OWNERDRAW = 11,
    TYPEMASK = 15,
    LEFTTEXT = 32,
    TEXT = 0,
    ICON = 64,
    BITMAP = 128,
    LEFT = 256,
    RIGHT = 512,
    CENTER = 768,
    TOP = 1024,
    BOTTOM = 2048,
    VCENTER = 3072,
    PUSHLIKE = 4096,
    MULTILINE = 8192,
    NOTIFY = 16384,
    FLAT = 32768,
    RIGHTBUTTON = 32
}
declare enum BM {
    GETCHECK = 240,
    SETCHECK = 241,
    GETSTATE = 242,
    SETSTATE = 243,
    SETSTYLE = 244,
    CLICK = 245,
    GETIMAGE = 246,
    SETIMAGE = 247
}
declare enum BN {
    CLICKED = 0,
    PAINT = 1,
    HILITE = 2,
    UNHILITE = 3,
    DISABLE = 4,
    DOUBLECLICKED = 5,
    PUSHED = 2,
    UNPUSHED = 3,
    DBLCLK = 5,
    PUSHED_HILITE = 2,
    UNPUSHED_HILITE = 3
}
declare enum DC {
    ACTIVE = 1,
    SMALLCAP = 2,
    ICON = 4,
    TEXT = 8,
    INBUTTON = 16,
    GRADIENT = 32,
    BUTTONS = 4096
}
declare enum DFC {
    CAPTION = 1,
    MENU = 2,
    SCROLL = 3,
    BUTTON = 4
}
declare enum DFCS {
    CAPTIONCLOSE = 0,
    CAPTIONMIN = 1,
    CAPTIONMAX = 2,
    CAPTIONRESTORE = 3,
    CAPTIONHELP = 4,
    MENUARROW = 0,
    MENUCHECK = 1,
    MENUBULLET = 2,
    MENUARROWRIGHT = 4,
    SCROLLUP = 0,
    SCROLLDOWN = 1,
    SCROLLLEFT = 2,
    SCROLLRIGHT = 3,
    SCROLLCOMBOBOX = 5,
    SCROLLSIZEGRIP = 8,
    SCROLLSIZEGRIPRIGHT = 16,
    BUTTONCHECK = 0,
    BUTTONRADIOIMAGE = 1,
    BUTTONRADIOMASK = 2,
    BUTTONRADIO = 4,
    BUTTON3STATE = 8,
    BUTTONPUSH = 16,
    INACTIVE = 256,
    PUSHED = 512,
    CHECKED = 1024,
    TRANSPARENT = 2048,
    HOT = 4096,
    ADJUSTRECT = 8192,
    FLAT = 16384,
    MONO = 32768
}
declare enum BDR {
    RAISEDOUTER = 1,
    SUNKENOUTER = 2,
    RAISEDINNER = 4,
    SUNKENINNER = 8,
    OUTER = 3,
    INNER = 12,
    RAISED = 5,
    SUNKEN = 10
}
declare enum EDGE {
    RAISED = 5,
    SUNKEN = 10,
    ETCHED = 6,
    BUMP = 9
}
declare enum BF {
    LEFT = 1,
    TOP = 2,
    RIGHT = 4,
    BOTTOM = 8,
    TOPLEFT = 3,
    TOPRIGHT = 6,
    BOTTOMLEFT = 9,
    BOTTOMRIGHT = 12,
    RECT = 15,
    DIAGONAL = 16,
    DIAGONAL_ENDTOPRIGHT = 22,
    DIAGONAL_ENDTOPLEFT = 19,
    DIAGONAL_ENDBOTTOMLEFT = 25,
    DIAGONAL_ENDBOTTOMRIGHT = 28,
    MIDDLE = 2048,
    SOFT = 4096,
    ADJUST = 8192,
    FLAT = 16384,
    MONO = 32768
}
declare enum COLOR {
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
    DESKTOP = 1,
    FACE3D = 15,
    SHADOW3D = 16,
    HIGHLIGHT3D = 20,
    HILIGHT3D = 20,
    BTNHILIGHT = 20
}
declare enum SPI {
    GETNONCLIENTMETRICS = 41
}
declare enum HT {
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
    HELP = 21
}
declare enum WMSZ {
    LEFT = 1,
    RIGHT = 2,
    TOP = 3,
    TOPLEFT = 4,
    TOPRIGHT = 5,
    BOTTOM = 6,
    BOTTOMLEFT = 7,
    BOTTOMRIGHT = 8
}
declare enum VK {
    LBUTTON = 1,
    RBUTTON = 2,
    CANCEL = 3,
    MBUTTON = 4,
    XBUTTON1 = 5,
    XBUTTON2 = 6,
    BACK = 8,
    TAB = 9,
    CLEAR = 12,
    RETURN = 13,
    SHIFT = 16,
    CONTROL = 17,
    MENU = 18,
    PAUSE = 19,
    CAPITAL = 20,
    KANA = 21,
    HANGEUL = 21,
    HANGUL = 21,
    JUNJA = 23,
    FINAL = 24,
    HANJA = 25,
    KANJI = 25,
    ESCAPE = 27,
    CONVERT = 28,
    NONCONVERT = 29,
    ACCEPT = 30,
    MODECHANGE = 31,
    SPACE = 32,
    PRIOR = 33,
    NEXT = 34,
    END = 35,
    HOME = 36,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    SELECT = 41,
    PRINT = 42,
    EXECUTE = 43,
    SNAPSHOT = 44,
    INSERT = 45,
    DELETE = 46,
    HELP = 47,
    LWIN = 91,
    RWIN = 92,
    APPS = 93,
    SLEEP = 95,
    NUMPAD0 = 96,
    NUMPAD1 = 97,
    NUMPAD2 = 98,
    NUMPAD3 = 99,
    NUMPAD4 = 100,
    NUMPAD5 = 101,
    NUMPAD6 = 102,
    NUMPAD7 = 103,
    NUMPAD8 = 104,
    NUMPAD9 = 105,
    MULTIPLY = 106,
    ADD = 107,
    SEPARATOR = 108,
    SUBTRACT = 109,
    DECIMAL = 110,
    DIVIDE = 111,
    F1 = 112,
    F2 = 113,
    F3 = 114,
    F4 = 115,
    F5 = 116,
    F6 = 117,
    F7 = 118,
    F8 = 119,
    F9 = 120,
    F10 = 121,
    F11 = 122,
    F12 = 123,
    F13 = 124,
    F14 = 125,
    F15 = 126,
    F16 = 127,
    F17 = 128,
    F18 = 129,
    F19 = 130,
    F20 = 131,
    F21 = 132,
    F22 = 133,
    F23 = 134,
    F24 = 135,
    NUMLOCK = 144,
    SCROLL = 145,
    OEM_NEC_EQUAL = 146,
    OEM_FJ_JISHO = 146,
    OEM_FJ_MASSHOU = 147,
    OEM_FJ_TOUROKU = 148,
    OEM_FJ_LOYA = 149,
    OEM_FJ_ROYA = 150,
    LSHIFT = 160,
    RSHIFT = 161,
    LCONTROL = 162,
    RCONTROL = 163,
    LMENU = 164,
    RMENU = 165,
    BROWSER_BACK = 166,
    BROWSER_FORWARD = 167,
    BROWSER_REFRESH = 168,
    BROWSER_STOP = 169,
    BROWSER_SEARCH = 170,
    BROWSER_FAVORITES = 171,
    BROWSER_HOME = 172,
    VOLUME_MUTE = 173,
    VOLUME_DOWN = 174,
    VOLUME_UP = 175,
    MEDIA_NEXT_TRACK = 176,
    MEDIA_PREV_TRACK = 177,
    MEDIA_STOP = 178,
    MEDIA_PLAY_PAUSE = 179,
    LAUNCH_MAIL = 180,
    LAUNCH_MEDIA_SELECT = 181,
    LAUNCH_APP1 = 182,
    LAUNCH_APP2 = 183,
    OEM_1 = 186,
    OEM_PLUS = 187,
    OEM_COMMA = 188,
    OEM_MINUS = 189,
    OEM_PERIOD = 190,
    OEM_2 = 191,
    OEM_3 = 192,
    OEM_4 = 219,
    OEM_5 = 220,
    OEM_6 = 221,
    OEM_7 = 222,
    OEM_8 = 223,
    OEM_AX = 225,
    OEM_102 = 226,
    ICO_HELP = 227,
    ICO_00 = 228,
    PROCESSKEY = 229,
    ICO_CLEAR = 230,
    PACKET = 231,
    OEM_RESET = 233,
    OEM_JUMP = 234,
    OEM_PA1 = 235,
    OEM_PA2 = 236,
    OEM_PA3 = 237,
    OEM_WSCTRL = 238,
    OEM_CUSEL = 239,
    OEM_ATTN = 240,
    OEM_FINISH = 241,
    OEM_COPY = 242,
    OEM_AUTO = 243,
    OEM_ENLW = 244,
    OEM_BACKTAB = 245,
    ATTN = 246,
    CRSEL = 247,
    EXSEL = 248,
    EREOF = 249,
    PLAY = 250,
    ZOOM = 251,
    NONAME = 252,
    PA1 = 253,
    OEM_CLEAR = 254
}
declare enum SS {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2,
    ICON = 3,
    BLACKRECT = 4,
    GRAYRECT = 5,
    WHITERECT = 6,
    BLACKFRAME = 7,
    GRAYFRAME = 8,
    WHITEFRAME = 9,
    USERITEM = 10,
    SIMPLE = 11,
    LEFTNOWORDWRAP = 12,
    OWNERDRAW = 13,
    BITMAP = 14,
    ENHMETAFILE = 15,
    ETCHEDHORZ = 16,
    ETCHEDVERT = 17,
    ETCHEDFRAME = 18,
    TYPEMASK = 31,
    REALSIZECONTROL = 64,
    NOPREFIX = 128,/* Don't do "&" character translation */
    NOTIFY = 256,
    CENTERIMAGE = 512,
    RIGHTJUST = 1024,
    REALSIZEIMAGE = 2048,
    SUNKEN = 4096,
    EDITCONTROL = 8192,
    ENDELLIPSIS = 16384,
    PATHELLIPSIS = 32768,
    WORDELLIPSIS = 49152,
    ELLIPSISMASK = 49152
}
declare enum ODT {
    MENU = 1,
    LISTBOX = 2,
    COMBOBOX = 3,
    BUTTON = 4,
    STATIC = 5
}
declare enum ODA {
    DRAWENTIRE = 1,
    SELECT = 2,
    FOCUS = 4
}
declare enum ODS {
    SELECTED = 1,
    GRAYED = 2,
    DISABLED = 4,
    CHECKED = 8,
    FOCUS = 16,
    DEFAULT = 32,
    COMBOBOXEDIT = 4096,
    HOTLIGHT = 64,
    INACTIVE = 128,
    NOACCEL = 256,
    NOFOCUSRECT = 512
}
declare enum WA {
    INACTIVE = 0,
    ACTIVE = 1,
    CLICKACTIVE = 2
}
declare enum GA {
    PARENT = 1,
    ROOT = 2,
    ROOTOWNER = 3
}
declare enum GW {
    HWNDFIRST = 0,
    HWNDLAST = 1,
    HWNDNEXT = 2,
    HWNDPREV = 3,
    OWNER = 4,
    CHILD = 5,
    ENABLEDPOPUP = 6
}
declare enum MA {
    ACTIVATE = 1,
    ACTIVATEANDEAT = 2,
    NOACTIVATE = 3,
    NOACTIVATEANDEAT = 4
}
declare enum PM {
    NOREMOVE = 0,
    REMOVE = 1,
    NOYIELD = 2
}
declare enum GWL {
    WNDPROC = -4,
    HINSTANCE = -6,
    HWNDPARENT = -8,
    STYLE = -16,
    EXSTYLE = -20,
    USERDATA = -21,
    ID = -12
}
declare enum LR {
    DEFAULTCOLOR = 0,
    MONOCHROME = 1,
    COLOR = 2,
    COPYRETURNORG = 4,
    COPYDELETEORG = 8,
    LOADFROMFILE = 16,
    LOADTRANSPARENT = 32,
    DEFAULTSIZE = 64,
    VGA_COLOR = 128
}
declare enum IMAGE {
    BITMAP = 0,
    ICON = 1,
    CURSOR = 2
}
declare enum IDI {
    APPLICATION = 32512,
    HAND = 32513,
    QUESTION = 32514,
    EXCLAMATION = 32515,
    ASTERISK = 32516,
    WINLOGO = 32517,
    WARNING = 32515,
    ERROR = 32513
}
declare enum IDC {
    ARROW = 32512,
    IBEAM = 32513,
    WAIT = 32514,
    CROSS = 32515,
    UPARROW = 32516,
    SIZE = 32640,
    ICON = 32641,
    SIZENWSE = 32642,
    SIZENESW = 32643,
    SIZEWE = 32644,
    SIZENS = 32645,
    SIZEALL = 32646,
    NO = 32648,
    HAND = 32649,
    APPSTARTING = 32650,
    HELP = 32651
}
declare enum MONITOR {
    DEFAULTTONULL = 0,
    DEFAULTTOPRIMARY = 1,
    DEFAULTTONEAREST = 2
}
type HWND = HANDLE;
type HINSTANCE = HANDLE;
type HICON = HANDLE;
type HCURSOR = HANDLE;
type HBRUSH = HANDLE;
type HMENU = HANDLE;
type WPARAM = number | object | string | boolean | symbol | null;
type LPARAM = number | object | string | boolean | symbol | null;
type LRESULT = number | object | string | boolean | symbol | null;
type ATOM = number;
type WNDPROC = (hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM) => LRESULT | Promise<LRESULT>;
declare function LOWORD(lParam: LPARAM): number;
declare function HIWORD(lParam: LPARAM): number;
declare function MAKEWPARAM(low: number, high: number): number;
interface POINTS {
    x: number;
    y: number;
}
interface MSG {
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
interface WNDCLASS {
    style: number;
    lpfnWndProc: WNDPROC;
    cbClsExtra: number;
    cbWndExtra: number;
    hInstance: HINSTANCE;
    hIcon: HICON;
    hCursor: HCURSOR;
    hbrBackground: HBRUSH;
    lpszMenuName: number | string | null;
    lpszClassName: number | string | null;
}
interface WNDCLASSEX extends WNDCLASS {
    cbSize: number;
    hIconSm: HANDLE;
}
interface MINMAXINFO {
    ptReserved: POINT;
    ptMaxSize: POINT;
    ptMaxPosition: POINT;
    ptMinTrackSize: POINT;
    ptMaxTrackSize: POINT;
}
interface NONCLIENTMETRICS {
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
interface PAINTSTRUCT {
    hdc: HDC;
    fErase: boolean;
    rcPaint: RECT;
    fRestore: boolean;
    fIncUpdate: boolean;
    rgbReserved: number[];
}
interface CREATESTRUCT {
    lpCreateParams: LPARAM;
    hInstance: HINSTANCE;
    hMenu: HMENU;
    hwndParent: HWND;
    cy: number;
    cx: number;
    y: number;
    x: number;
    style: number;
    lpszName: string;
    lpszClass: string;
    dwExStyle: number;
}
interface DRAWITEMSTRUCT {
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
interface WINDOWPLACEMENT {
    flags: number;
    showCmd: number;
    ptMinPosition: POINT;
    ptMaxPosition: POINT;
    rcNormalPosition: RECT;
}
interface MONITORINFO {
    cbSize: number;
    rcMonitor: RECT;
    rcWork: RECT;
    dwFlags: number;
}
interface MONITORINFOEX extends MONITORINFO {
    szDevice: string;
}

type Version = [major: number, minor: number, build: number, revision: number];//# sourceMappingURL=types.d.ts.map

interface Executable {
    file: string;
    type: "executable" | "dll";
    subsystem: "console" | "windows";
    arch: "js" | "wasm";
    entryPoint: string | Function | null;
    dependencies: string[];
    name: string;
    version: Version;
    rsrc: any;
}

/**
 * @module user32
 * @description Windows USER API Client Library
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/winuser/}
 * @usermode
 */

declare function MAKEINTRESOURCE(id: number): string;
/**
 * Registers a window class for subsequent use in calls to the {@link CreateWindow} or {@link CreateWindowEx} function.
 * @param lpWndClass A pointer to a {@link WNDCLASS} structure. You must fill the structure with the appropriate class attributes before passing it to the function.
 * @returns If the function succeeds, the return value is a class atom that uniquely identifies the class being registered.
 * This atom can only be used by the CreateWindow, CreateWindowEx, GetClassInfo, GetClassInfoEx, FindWindow, FindWindowEx, and UnregisterClass functions and the IActiveIMMap::FilterClientWindows method.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclassa
*/
declare function RegisterClass(lpWndClass: WNDCLASS): Promise<ATOM>;
/**
 * Creates an overlapped, pop-up, or child window with an extended window style; otherwise,
 * this function is identical to the CreateWindow function. For more information about creating
 * a window and for full descriptions of the other parameters of CreateWindowEx, see CreateWindow.
 * @param lpClassName A string or a class atom created by a previous call to the RegisterClass or RegisterClassEx function.
 * @param lpWindowName The window name. If the window style specifies a title bar, the window title pointed to by lpWindowName is displayed in the title bar.
 * @param dwStyle The style of the window being created. This parameter can be a combination of the window style values, plus the control styles indicated in the Remarks section.
 * @param x The initial horizontal position of the window. For an overlapped or pop-up window, the x parameter is the initial x-coordinate of the window's upper-left corner, in screen coordinates.
 * @param y The initial vertical position of the window. For an overlapped or pop-up window, the y parameter is the initial y-coordinate of the window's upper-left corner, in screen coordinates.
 * @param nWidth The width, in device units, of the window. For overlapped windows, nWidth is the window's width, in screen coordinates, or CW_USEDEFAULT.
 * @param nHeight The height, in device units, of the window. For overlapped windows, nHeight is the window's height, in screen coordinates, or CW_USEDEFAULT.
 * @param hWndParent A handle to the parent or owner window of the window being created. To create a child window or an owned window, supply a valid window handle.
 * @param hMenu A handle to a menu, or specifies a child-window identifier, depending on the window style. For an overlapped or pop-up window, hMenu identifies the menu to be used with the window;
 * it can be NULL if the class menu is to be used. For a child window, hMenu specifies the child-window identifier, an integer value used by a dialog box control to notify its parent about events.
 * @param hInstance A handle to the instance of the module to be associated with the window.
 * @param lpParam Pointer to a value to be passed to the window through the CREATESTRUCT structure (lpCreateParams member) pointed to by the lParam param of the WM_CREATE message.
 * @returns If the function succeeds, the return value is a handle to the new window. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexa
 */
declare function CreateWindow(lpClassName: string, lpWindowName: string, dwStyle: number, x: number, y: number, nWidth: number, nHeight: number, hWndParent: HANDLE, hMenu: HANDLE, hInstance: HINSTANCE, lpParam: any): Promise<HANDLE>;
/**
 * Creates an overlapped, pop-up, or child window with an extended window style; otherwise,
 * this function is identical to the CreateWindow function. For more information about creating
 * a window and for full descriptions of the other parameters of CreateWindowEx, see CreateWindow.
 * @param dwExStyle The extended window style of the window being created. For a list of values, see Extended Window Styles.
 * @param lpClassName A string or a class atom created by a previous call to the RegisterClass or RegisterClassEx function.
 * @param lpWindowName The window name. If the window style specifies a title bar, the window title pointed to by lpWindowName is displayed in the title bar.
 * @param dwStyle The style of the window being created. This parameter can be a combination of the window style values, plus the control styles indicated in the Remarks section.
 * @param x The initial horizontal position of the window. For an overlapped or pop-up window, the x parameter is the initial x-coordinate of the window's upper-left corner, in screen coordinates.
 * @param y The initial vertical position of the window. For an overlapped or pop-up window, the y parameter is the initial y-coordinate of the window's upper-left corner, in screen coordinates.
 * @param nWidth The width, in device units, of the window. For overlapped windows, nWidth is the window's width, in screen coordinates, or CW_USEDEFAULT.
 * @param nHeight The height, in device units, of the window. For overlapped windows, nHeight is the window's height, in screen coordinates, or CW_USEDEFAULT.
 * @param hWndParent A handle to the parent or owner window of the window being created. To create a child window or an owned window, supply a valid window handle.
 * @param hMenu A handle to a menu, or specifies a child-window identifier, depending on the window style. For an overlapped or pop-up window, hMenu identifies the menu to be used with the window;
 * it can be NULL if the class menu is to be used. For a child window, hMenu specifies the child-window identifier, an integer value used by a dialog box control to notify its parent about events.
 * @param hInstance A handle to the instance of the module to be associated with the window.
 * @param lpParam Pointer to a value to be passed to the window through the CREATESTRUCT structure (lpCreateParams member) pointed to by the lParam param of the WM_CREATE message.
 * @returns If the function succeeds, the return value is a handle to the new window. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexa
 */
declare function CreateWindowEx(dwExStyle: number, lpClassName: string, lpWindowName: string, dwStyle: number, x: number, y: number, nWidth: number, nHeight: number, hWndParent: HANDLE, hMenu: HANDLE, hInstance: HINSTANCE, lpParam: any): Promise<HANDLE>;
/**
 * Calls the default window procedure to provide default processing for any window messages that an application does not process.
 * This function ensures that every message is processed. DefWindowProc is called with the same parameters received by the window procedure.
 * @param hWnd A handle to the window procedure that received the message.
 * @param uMsg The message.
 * @param wParam Additional message information. The content of this parameter depends on the value of the uMsg parameter.
 * @param lParam Additional message information. The content of this parameter depends on the value of the uMsg parameter.
 * @returns The return value is the result of the message processing and depends on the message.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defwindowproca
*/
declare function DefWindowProc(hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT>;
/**
 * Sets the specified window's show state.
 * @param hWnd A handle to the window.
 * @param nCmdShow Controls how the window is to be shown. This parameter is ignored the first time an application calls ShowWindow,
 * if the program that launched the application provides a STARTUPINFO structure. Otherwise, the first time ShowWindow is called,
 * the value should be the value obtained by the WinMain function in its nCmdShow parameter. In subsequent calls, this parameter can be one of the following values.
 * @category User32
 * @returns If the window was previously visible, the return value is nonzero. If the window was previously hidden, the return value is zero.
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow
 */
declare function ShowWindow(hWnd: HANDLE, nCmdShow: number): Promise<boolean>;
/**
 * Retrieves a message from the calling thread's message queue. The function dispatches incoming sent messages until a posted message is available for retrieval.
 * @param lpMsg A pointer to an {@link MSG} structure that receives message information from the thread's message queue.
 * @param hWnd A handle to the window whose messages are to be retrieved. The window must belong to the current thread.
 * @param wMsgFilterMin The integer value of the lowest message value to be retrieved. Use WM_KEYFIRST (0x0100) to specify the first keyboard message
 * (WM_KEYDOWN). Use WM_MOUSEFIRST (0x0200) to specify the first mouse message (WM_MOUSEMOVE).
 * @param wMsgFilterMax The integer value of the highest message value to be retrieved. Use WM_KEYLAST to specify the last keyboard message.
 * (WM_KEYUP). Use WM_MOUSELAST to specify the last mouse message (WM_MBUTTONDBLCLK).
 * @returns If the function retrieves a message other than WM_QUIT, the return value is nonzero.
 * If the function retrieves the WM_QUIT message, the return value is zero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagea
 */
declare function GetMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number): Promise<boolean>;
/**
 * Dispatches incoming nonqueued messages, checks the thread message queue for a posted message, and retrieves the message (if any exist).
 * @param lpMsg A pointer to an {@link MSG} structure that receives message information.
 * @param hWnd The handle to the window whose messages are to be retrieved. The window must belong to the current thread.
 * If hWnd is NULL, GetMessage retrieves messages for any window that belongs to the current thread, and any messages on the current
 * thread's message queue whose hwnd value is NULL (see the MSG structure). Therefore if hWnd is NULL, both window messages and thread
 * messages are processed.
 * If hWnd is -1, GetMessage retrieves only messages on the current thread's message queue whose hwnd value is NULL, that is, thread messages
 * as posted by PostMessage (when the hWnd parameter is NULL) or PostThreadMessage.
 * @param wMsgFilterMin The integer value of the lowest message value to be retrieved. Use WM_KEYFIRST (0x0100) to specify the first keyboard message
 * (WM_KEYDOWN). Use WM_MOUSEFIRST (0x0200) to specify the first mouse message (WM_MOUSEMOVE).
 * @param wMsgFilterMax The integer value of the highest message value to be retrieved. Use WM_KEYLAST to specify the last keyboard message.
 * (WM_KEYUP). Use WM_MOUSELAST to specify the last mouse message (WM_MBUTTONDBLCLK).
 * @returns If the function retrieves a message other than WM_QUIT, the return value is nonzero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-peekmessagea
 */
declare function PeekMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number, wRemoveMsg: number): Promise<boolean>;
/**
 * Translates virtual-key messages into character messages. The character messages are posted to the calling thread's message queue,
 * to be read the next time the thread calls the {@link GetMessage} or {@link PeekMessage} function.
 * @param lpMsg A pointer to an MSG structure that contains message information retrieved from the calling thread's message queue
 * by using the {@link GetMessage} or {@link PeekMessage} function.
 * @returns If the message is translated (that is, a character message is posted to the thread's message queue), the return value is nonzero.
 * If the message is WM_KEYDOWN, WM_KEYUP, WM_SYSKEYDOWN, or WM_SYSKEYUP, the return value is nonzero, regardless of the translation.
 * If the message is not translated (that is, a character message is not posted to the thread's message queue), the return value is zero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translatemessage
 */
declare function TranslateMessage(lpMsg: MSG): Promise<boolean>;
/**
 * Dispatches a message to a window procedure. It is typically used to dispatch a message retrieved by the GetMessage function.
 * @param lpMsg A pointer to a structure that contains the message.
 * @returns The return value specifies the value returned by the window procedure. Although its meaning depends on the message being dispatched,
 * the return value generally is ignored.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dispatchmessagea
 * @example
 * ```ts
 * while (await GetMessage(lpMsg, null, 0, 0) !== 0) {
 *    await TranslateMessage(lpMsg);
 *    await DispatchMessage(lpMsg);
 * }
 * ```
 */
declare function DispatchMessage(lpMsg: MSG): Promise<boolean>;
/**
 * Posts a message to the message queue of the specified thread. It returns without waiting for the thread to process the message.
 * @param nExitCode The exit code for the thread. Use the GetExitCodeThread function to retrieve a thread's exit value. Use the ExitProcess function to terminate a thread.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postquitmessage
 * @example
 * ```ts
 * case WM.CLOSE:
 *   await PostQuitMessage(0);
 *   break;
 * ```
 */
declare function PostQuitMessage(nExitCode: number): Promise<void>;
/**
 * Retrieves a handle to a display device context (DC) for the client area of the specified window.
 * @param hWnd A handle to the window whose DC is to be retrieved.
 * @returns If the function succeeds, the return value is the handle to the DC for the specified window's client area. If the function fails, the return value is NULL.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdc
 * @example
 * ```ts
 * const dc = await GetDC(hWnd);
 * await Rectangle(dc, 0, 0, 100, 100);
 * ```
 */
declare function GetDC(hWnd: HANDLE): Promise<HDC>;
/**
 * Retrieves the specified system metric or system configuration setting.
 * @param nIndex The system metric or configuration setting to be retrieved. See {@link https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics}
 * @returns If the function succeeds, the return value is the requested system metric or configuration setting. If the function fails, the return value is 0.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics
 */
declare function GetSystemMetrics(nIndex: number): number;
/**
 * Changes the size, position, and Z order of a child, pop-up, or top-level window.
 * These windows are ordered according to their appearance on the screen.
 * The topmost window receives the highest rank and is the first window in the Z order.
 * @param hWnd A handle to the window.
 * @param hWndInsertAfter A handle to the window to precede the positioned window in the Z order.
 * @param x The new position of the left side of the window, in client coordinates.
 * @param y The new position of the top of the window, in client coordinates.
 * @param cx The new width of the window, in pixels.
 * @param cy The new height of the window, in pixels.
 * @param uFlags The window sizing and positioning flags.
 * @returns If the function succeeds, the return value is nonzero, if the function fails, the return value is zero. To get extended error information, call GetLastError.
 * @category User32
*/
declare function SetWindowPos(hWnd: HANDLE, hWndInsertAfter: HANDLE, x: number, y: number, cx: number, cy: number, uFlags: number): Promise<boolean>;
/**
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopa
 * @param lpszDesktop The name of the desktop to be created. This string must be unique among the desktop names for the current session.
 * @param lpszDevice Reserved; must be NULL.
 * @param pDevMode Reserved; must be NULL.
 * @param dwFlags Reserved; must be 0.
 * @param dwDesiredAccess The access to the desktop. For a list of values, see Desktop Security and Access Rights.
 * @param lpsa Reserved; must be NULL.
 * @returns If the function succeeds, the return value is a handle to the newly created desktop. When you are finished using the handle, call the CloseDesktop function to close it. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 */
declare function CreateDesktop(lpszDesktop: string, lpszDevice: string, pDevMode: null, dwFlags: number, dwDesiredAccess: number, lpsa: any): Promise<HANDLE>;
/**
 * Retrieves the dimensions of the bounding rectangle of the specified window. The dimensions are given in screen coordinates that are relative to the upper-left corner of the screen.
 * @param hWnd A handle to the window.
 * @returns A RECT structure that receives the screen coordinates of the upper-left and lower-right corners of the window, or NULL if the function fails.
 * @category User32
 */
declare function GetWindowRect(hWnd: HANDLE): Promise<RECT>;
/**
 * The ScreenToClient function converts the screen coordinates of a specified point on the screen to client-area coordinates.
 * @param hWnd A handle to the window whose client area will be used for the conversion.
 * @param lpPoint A pointer to a POINT structure that specifies the screen coordinates to be converted.
 * @returns If the function succeeds, the return value is nonzero. If the function fails, the return value is zero.
 * @category User32
 */
declare function ScreenToClient(hWnd: HANDLE, lpPoint: POINT): Promise<boolean>;
/**
 * Retrieves a handle to the top-level window whose class name and window name match the specified strings.
 * This function does not search child windows. This function does not perform a case-sensitive search.
 * @param lpClassName The class name or a class atom created by a previous call to the RegisterClass or RegisterClassEx function.
 * @param lpWindowName The window name (the window's title). If this parameter is NULL, all window names match.
 * @returns If the function succeeds, the return value is a handle to the window that has the specified class name and window name.
 * @category User32
 */
declare function FindWindow(lpClassName: string | null, lpWindowName: string | null): Promise<HANDLE>;
declare function GetClientRect(hWnd: HANDLE, lpRect: RECT): Promise<boolean>;
declare function SendMessage(hWnd: HANDLE, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT>;
declare function PostMessage(hWnd: HANDLE, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<void>;
declare function GetProp(hWnd: HANDLE, lpString: string): Promise<any>;
declare function SetProp(hWnd: HANDLE, lpString: string, hData: any): Promise<boolean>;
declare function RemoveProp(hWnd: HANDLE, lpString: string): Promise<any>;
declare function GetWindowLong(hWnd: HANDLE, nIndex: number): Promise<number>;
declare function SetWindowLong(hWnd: HANDLE, nIndex: number, dwNewLong: number | Function): Promise<number>;
declare function GetParent(hWnd: HANDLE): Promise<HANDLE>;
declare function CallWindowProc(lpPrevWndFunc: WNDPROC | number, hWnd: HANDLE, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT>;
declare function LoadImage(hinst: HINSTANCE, lpszName: string, uType: number, cxDesired: number, cyDesired: number, fuLoad: number): Promise<HANDLE>;
declare function LoadCursor(hInstance: HINSTANCE, lpCursorName: string): Promise<HANDLE>;
declare function LoadIcon(hInstance: HINSTANCE, lpIconName: string): Promise<HANDLE>;
declare function MonitorFromRect(lprc: RECT, dwFlags: number): Promise<HANDLE>;
declare function MonitorFromPoint(pt: POINT, dwFlags: number): Promise<HANDLE>;
declare function MonitorFromWindow(hWnd: HANDLE, dwFlags: number): Promise<HANDLE>;
declare function GetMonitorInfo(hMonitor: HANDLE): Promise<MONITORINFO | MONITORINFOEX | null>;
declare const user32: Executable;

export { type ATOM, BDR, BF, BM, BN, BS, COLOR, type CREATESTRUCT, CW_USEDEFAULT, CallWindowProc, CreateDesktop, CreateWindow, CreateWindowEx, DC, DFC, DFCS, type DRAWITEMSTRUCT, DefWindowProc, DispatchMessage, EDGE, FindWindow, GA, GW, GWL, GetClientRect, GetDC, GetMessage, GetMonitorInfo, GetParent, GetProp, GetSystemMetrics, GetWindowLong, GetWindowRect, type HBRUSH, type HCURSOR, type HICON, type HINSTANCE, HIWORD, type HMENU, HT, type HWND, HWND_BOTTOM, HWND_BROADCAST, HWND_MESSAGE, HWND_NOTOPMOST, HWND_TOP, HWND_TOPMOST, IDC, IDI, IMAGE, LOWORD, type LPARAM, LR, type LRESULT, LoadCursor, LoadIcon, LoadImage, MA, MAKEINTRESOURCE, MAKEWPARAM, type MINMAXINFO, MONITOR, type MONITORINFO, type MONITORINFOEX, type MSG, MonitorFromPoint, MonitorFromRect, MonitorFromWindow, type NONCLIENTMETRICS, ODA, ODS, ODT, type PAINTSTRUCT, PM, type POINTS, PeekMessage, PostMessage, PostQuitMessage, RegisterClass, RemoveProp, SC, SM, SPI, SS, SW, SWP, ScreenToClient, SendMessage, SetProp, SetWindowLong, SetWindowPos, ShowWindow, TranslateMessage, VK, WA, type WINDOWPLACEMENT, WM, WMSZ, type WNDCLASS, type WNDCLASSEX, type WNDPROC, type WPARAM, WS, user32 as default };
//# sourceMappingURL=user32.d.ts.map
