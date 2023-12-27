import { HFONT, LOGFONT, RECT } from "gdi32";
import { HINSTANCE, HMENU, HWND, WNDPROC } from "user32";

type NOTEPAD_GLOBALS = {
    hInstance: HINSTANCE;
    hMainWnd: HWND;
    hFindReplaceDlg: HWND;
    hEdit: HWND;
    hStatusBar: HWND;
    hFont: HFONT;
    hMenu: HMENU;
    lfFont: LOGFONT | null;
    bWrapLongLines: boolean;
    bShowStatusBar: boolean;
    szFindText: string | null;
    szReplaceText: string | null;
    szFileName: string | null;
    szFileTitle: string | null;
    szFilter: string | null;
    lMargins: RECT;
    szHeader: string | null;
    szFooter: string | null;
    szStatusBarLineCol: string | null;

    encFile: number;
    iEoln: number;

    find: any; // FINDREPLACE
    editProc: WNDPROC | null;
    mainRect: RECT;
    bWasModified: boolean;
}

const Globals: NOTEPAD_GLOBALS = {
    hInstance: 0,
    hMainWnd: 0,
    hFindReplaceDlg: 0,
    hEdit: 0,
    hStatusBar: 0,
    hFont: 0,
    hMenu: 0,
    lfFont: null,
    bWrapLongLines: false,
    bShowStatusBar: false,
    szFindText: null,
    szReplaceText: null,
    szFileName: null,
    szFileTitle: null,
    szFilter: null,
    lMargins: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    },
    szHeader: null,
    szFooter: null,
    szStatusBarLineCol: null,

    encFile: 0,
    iEoln: 0,

    find: null,
    editProc: null,
    mainRect: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    },
    bWasModified: false,
};

export default Globals;