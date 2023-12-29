import USER32, {
    CALL_WINDOW_PROC_PARAMS,
    CALL_WINDOW_PROC_REPLY,
    CREATE_DESKTOP,
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    FIND_WINDOW,
    GET_CLIENT_RECT,
    GET_CLIENT_RECT_REPLY,
    GET_MESSAGE,
    GET_MESSAGE_REPLY,
    GET_MONITOR_INFO_PARAMS,
    GET_MONITOR_INFO_REPLY,
    GET_PROP_PARAMS,
    GET_PROP_REPLY,
    GET_WINDOW_LONG_PARAMS,
    GET_WINDOW_LONG_REPLY,
    LOAD_IMAGE_PARAMS,
    LOAD_IMAGE_REPLY,
    PEEK_MESSAGE,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    REMOVE_PROP_PARAMS,
    REMOVE_PROP_REPLY,
    SCREEN_TO_CLIENT,
    SCREEN_TO_CLIENT_REPLY,
    SET_PARENT_PARAMS,
    SET_PROP_PARAMS,
    SET_PROP_REPLY,
    SET_WINDOW_LONG_PARAMS,
    SET_WINDOW_LONG_REPLY,
    SET_WINDOW_POS,
    SHOW_WINDOW,
    SHOW_WINDOW_REPLY,
    WNDCLASS_WIRE,
    WNDPROC_PARAMS,
    HWND,
    LRESULT,
    MONITORINFO,
    MONITORINFOEX,
    MSG,
    WNDCLASSEX,
    WS,
    BEGIN_PAINT_PARAMS,
    BEGIN_PAINT_REPLY,
    END_PAINT_PARAMS,
    END_PAINT_REPLY,
    INVALIDATE_RECT_PARAMS,
    INVALIDATE_RECT_REPLY,
    ADJUST_WINDOW_RECT_PARAMS,
    ADJUST_WINDOW_RECT_REPLY,
    COLOR,
} from "user32/dist/user32.int.js";
import { HANDLE, PEB, SUBSYSTEM, SUBSYSTEM_DEF } from "ntos-sdk/types/types.js";
import { LPRECT, OffsetRect, POINT, RECT } from "gdi32/dist/gdi32.int.js"
import { NtCallWindowProc, NtCreateWindowEx, NtDestroyWindow, NtFindWindow, NtUserGetDC, NtUserGetWindowRect } from "../win32k/window.js";
import { NtDispatchMessage, NtGetMessage, NtPeekMessage, NtPostMessage, NtPostQuitMessage } from "../win32k/msg.js";
import { NtInitSysMetrics, NtUserGetSystemMetrics } from "../win32k/metrics.js";
import { NtSetWindowPos, NtUserSetWindowPos, NtUserShowWindow } from "../win32k/wndpos.js";
import { NtUserCreateDesktop, NtUserDesktopWndProc } from "../win32k/desktop.js";

import { ButtonWndProc } from "./user32/button.js";
import { NtCreateCallback } from "../callback.js";
import { NtDefWindowProc } from "../win32k/def.js";
import { NtRegisterClassEx } from "../win32k/class.js";
import { NtUserGetWindowLong, NtUserSetWindowLong } from "../win32k/gwl.js";
import { NtUserScreenToClient } from "../win32k/client.js";
import { ObGetObject } from "../objects.js";
import { SUBSYS_USER32 } from "ntos-sdk/types/subsystems.js";
import { StaticWndProc } from "./user32/static.js";
import W32MSG_QUEUE from "../win32k/msgqueue.js";
import { NtUserGetProcInfo, W32PROCINFO } from "../win32k/shared.js";
import WND from "../win32k/wnd.js";
import { MONITOR, NtMonitorFromPoint, NtMonitorFromRect, NtMonitorFromWindow } from "../win32k/monitor.js";
import { NtUserAdjustWindowRectEx } from "../win32k/nc.js";
import { NtUserInvalidateRect } from "../win32k/draw.js";
import { GreReleaseDC } from "../win32k/gdi/dc.js";
import { IntGetSysColorBrush } from "../win32k/brush.js";

export * from 'user32/dist/user32.int.js';

const DefaultClasses: WNDCLASSEX[] = [
    {
        style: WS.CHILD,
        lpszClassName: 0x8001,
        lpszMenuName: null,
        lpfnWndProc: NtUserDesktopWndProc,
        hIcon: 0,
        hCursor: 0,
        hbrBackground: IntGetSysColorBrush(COLOR.DESKTOP),
        hInstance: 0,
        hIconSm: 0,
        cbClsExtra: 0,
        cbWndExtra: 0,
        cbSize: 0
    },
    {
        style: WS.CHILD,
        lpszClassName: "STATIC",
        lpszMenuName: null,
        lpfnWndProc: StaticWndProc,
        hIcon: 0,
        hCursor: 0,
        hbrBackground: 0,
        hInstance: 0,
        hIconSm: 0,
        cbClsExtra: 0,
        cbWndExtra: 0,
        cbSize: 0
    },
    {
        style: WS.CHILD,
        lpszClassName: "BUTTON",
        lpszMenuName: null,
        lpfnWndProc: ButtonWndProc,
        hIcon: 0,
        hCursor: 0,
        hbrBackground: 0,
        hInstance: 0,
        hIconSm: 0,
        cbClsExtra: 0,
        cbWndExtra: 0,
        cbSize: 0
    }
];


function NtUser32Initialize(peb: PEB, lpSubsystem: SUBSYSTEM) {
    let procInfo = lpSubsystem.lpParams as W32PROCINFO;
    if (!procInfo) {
        procInfo = {
            classes: [],
            hWnds: [],
            lpMsgQueue: null!,
            hwndFocus: 0,
            hwndActive: 0,
            hwndActivePrev: 0,
            hwndCapture: 0,
            nVisibleWindows: 0,
            flags: {
                bInActivateAppMsg: false,
                bAllowForegroundActivate: false,
            }
        }

        const msgQueue = new W32MSG_QUEUE(peb, procInfo);
        procInfo.lpMsgQueue = msgQueue;

        lpSubsystem.lpParams = procInfo;
    }

    NtInitSysMetrics(peb);

    for (const wndClass of DefaultClasses) {
        NtRegisterClassEx(peb, wndClass);
    }
}

async function NtUser32Uninitialize(peb: PEB, lpSubsystem: SUBSYSTEM) {
    const procInfo = lpSubsystem.lpParams as W32PROCINFO;
    if (!procInfo) {
        return;
    }

    for (const hWnd of procInfo.hWnds) {
        await NtDestroyWindow(peb, hWnd);
    }
}

async function UserRegisterClass(peb: PEB, { lpWndClass }: REGISTER_CLASS): Promise<REGISTER_CLASS_REPLY> {
    const atom = NtRegisterClassEx(peb, lpWndClass as WNDCLASS_WIRE);
    return { retVal: atom };
}

async function UserDefWindowProc(peb: PEB, data: WNDPROC_PARAMS): Promise<LRESULT> {
    return await NtDefWindowProc(...data);
}

async function UserCreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<CREATE_WINDOW_EX_REPLY> {
    const window = await NtCreateWindowEx(peb, data);
    return { hWnd: window };
}

async function UserShowWindow(peb: PEB, data: SHOW_WINDOW): Promise<SHOW_WINDOW_REPLY> {
    let retVal = await NtUserShowWindow(peb, data.hWnd, data.nCmdShow);

    return { retVal };
}

async function UserGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    return await NtGetMessage(peb, data);
}

async function UserPeekMessage(peb: PEB, data: PEEK_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    return await NtPeekMessage(peb, data);
}

async function UserTranslateMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    return { retVal: false, lpMsg: data.lpMsg };
}

async function UserDispatchMessage(peb: PEB, data: MSG): Promise<GET_MESSAGE_REPLY> {
    await NtDispatchMessage(peb, data);
    return { retVal: false, lpMsg: data };
}

async function UserPostQuitMessage(peb: PEB, data: number) {
    await NtPostQuitMessage(peb, data);
}

async function UserGetDC(peb: PEB, data: HWND) {
    return NtUserGetDC(peb, data);
}

function UserGetSystemMetrics(peb: PEB, nIndex: number): number {
    return NtUserGetSystemMetrics(peb, nIndex);
}

function UserSetWindowPos(peb: PEB, params: SET_WINDOW_POS) {
    return NtSetWindowPos(peb, params.hWnd, params.hWndInsertAfter, params.x, params.y, params.cx, params.cy, params.uFlags);
}

async function UserCreateDesktop(peb: PEB, params: CREATE_DESKTOP): Promise<HANDLE> {
    return await NtUserCreateDesktop(peb, params);
}

function UserGetWindowRect(peb: PEB, params: HWND): LPRECT {
    return NtUserGetWindowRect(peb, params);
}

function UserScreenToClient(peb: PEB, params: SCREEN_TO_CLIENT): SCREEN_TO_CLIENT_REPLY {
    const point = { ...params.lpPoint };
    const wnd = ObGetObject<WND>(params.hWnd);

    if (wnd && NtUserScreenToClient(wnd, point)) {
        return { retVal: true, lpPoint: point };
    }
    else {
        return { retVal: false, lpPoint: point };
    }
}

function UserFindWindow(peb: PEB, params: FIND_WINDOW): HWND {
    return NtFindWindow(peb, params.lpClassName, params.lpWindowName);
}

function UserGetClientRect(peb: PEB, { hWnd }: GET_CLIENT_RECT): GET_CLIENT_RECT_REPLY {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) return { retVal: false, lpRect: null };

    const rect = { ...wnd.rcClient };

    // ensure the rect is relative to the client area
    OffsetRect(rect, -wnd.rcClient.left, -wnd.rcClient.top);

    return { retVal: true, lpRect: rect };
}

async function UserSendMessage(peb: PEB, params: WNDPROC_PARAMS): Promise<LRESULT> {
    return await NtDispatchMessage(peb, params);
}

function UserPostMessage(peb: PEB, params: WNDPROC_PARAMS) {
    NtPostMessage(peb, params);
}

function UserGetProp(peb: PEB, params: GET_PROP_PARAMS): GET_PROP_REPLY {
    const wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) return { retVal: 0 };

    let prop = wnd.props.get(params.lpString) || 0;
    if (typeof prop === 'function') {
        prop = { __t: 'callback', __c: NtCreateCallback(peb, prop), __s: 'server' };
    }

    return { retVal: prop };
}

function UserSetProp(peb: PEB, params: SET_PROP_PARAMS): SET_PROP_REPLY {
    const wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) return { retVal: false };

    wnd.props.set(params.lpString, params.hData);

    return { retVal: true };
}

function UserRemoveProp(peb: PEB, params: REMOVE_PROP_PARAMS): REMOVE_PROP_REPLY {
    const wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) return { retVal: 0 };

    const prop = wnd.props.get(params.lpString);
    if (!prop) return { retVal: 0 };

    wnd.props.delete(params.lpString);

    return { retVal: prop };
}

function UserGetWindowLong(peb: PEB, params: GET_WINDOW_LONG_PARAMS): GET_WINDOW_LONG_REPLY {
    const wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) return { retVal: 0 };

    let val = NtUserGetWindowLong(peb, wnd, params.nIndex)
    if (typeof val === 'function') {
        val = NtCreateCallback(peb, <any>val);
    }

    return { retVal: val };
}

async function UserSetWindowLong(peb: PEB, params: SET_WINDOW_LONG_PARAMS): Promise<SET_WINDOW_LONG_REPLY> {
    const wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) return { retVal: 0 };

    let val = await NtUserSetWindowLong(peb, wnd, params.nIndex, params.dwNewLong);
    if (typeof val === 'function') {
        val = NtCreateCallback(peb, <any>val);
    }

    return { retVal: val };
}

function UserGetParent(peb: PEB, params: HWND): HWND {
    const wnd = ObGetObject<WND>(params);
    if (!wnd) return 0;

    return wnd.hParent;
}

function UserSetParent(peb: PEB, params: SET_PARENT_PARAMS): HWND {
    throw new Error("Not implemented");
}

async function UserCallWindowProc(peb: PEB, params: CALL_WINDOW_PROC_PARAMS): Promise<CALL_WINDOW_PROC_REPLY> {
    let result = await NtCallWindowProc(peb, params.lpPrevWndFunc, params.hWnd, params.uMsg, params.wParam, params.lParam);
    return { retVal: result };
}

function UserGetFocus(peb: PEB): HWND {
    const procInfo = NtUserGetProcInfo(peb);
    if (!procInfo) {
        return 0;
    }

    return procInfo.hwndFocus;
}

function UserLoadImage(peb: PEB, params: LOAD_IMAGE_PARAMS): LOAD_IMAGE_REPLY {
    return { retVal: -1 };
}

function UserMonitorFromWindow(peb: PEB, params: { hWnd: HWND, dwFlags: number }): HANDLE {
    return NtMonitorFromWindow(params.hWnd).hMonitor;
}

function UserMonitorFromPoint(peb: PEB, params: { pt: POINT, dwFlags: number }): HANDLE {
    return NtMonitorFromPoint(params.pt).hMonitor;
}

function UserMonitorFromRect(peb: PEB, params: { lprc: RECT, dwFlags: number }): HANDLE {
    return NtMonitorFromRect(params.lprc).hMonitor;
}

function UserGetMonitorInfo(peb: PEB, params: GET_MONITOR_INFO_PARAMS): GET_MONITOR_INFO_REPLY {
    let monitor = ObGetObject<MONITOR>(params.hMonitor);
    if (!monitor) {
        return { retVal: false };
    }

    let info: MONITORINFOEX = {
        cbSize: 0,
        rcMonitor: monitor.rcMonitor,
        rcWork: monitor.rcWork,
        dwFlags: 0,
        szDevice: "Browser Monitor"
    };

    return { retVal: true, lpmi: info };
}

async function UserBeginPaint(peb: PEB, params: BEGIN_PAINT_PARAMS): Promise<BEGIN_PAINT_REPLY> {
    let wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) {
        return { retVal: 0, lpPaint: null! };
    }

    let lpPaint = { ...params.lpPaint };
    lpPaint.hDC = NtUserGetDC(peb, params.hWnd);
    lpPaint.rcPaint = wnd.rcClient;
    lpPaint.fErase = true;

    return { retVal: lpPaint.hDC, lpPaint };
}

async function UserEndPaint(peb: PEB, params: END_PAINT_PARAMS): Promise<END_PAINT_REPLY> {
    let wnd = ObGetObject<WND>(params.hWnd);
    if (!wnd) {
        return { retVal: false };
    }

    let lpPaint = params.lpPaint;
    if (!lpPaint) {
        return { retVal: false };
    }

    GreReleaseDC(lpPaint.hDC);

    return { retVal: true };
}

async function UserInvalidateRect(peb: PEB, params: INVALIDATE_RECT_PARAMS): Promise<INVALIDATE_RECT_REPLY> {
    return { retVal: await NtUserInvalidateRect(params.hWnd, params.lpRect, params.bErase) };
}

async function UserAdjustWindowRect(peb: PEB, params: ADJUST_WINDOW_RECT_PARAMS): Promise<ADJUST_WINDOW_RECT_REPLY> {
    let rect = { ...params.lpRect! };
    let result = NtUserAdjustWindowRectEx(peb, rect, params.dwStyle, params.bMenu, 0);
    return { retVal: result, lpRect: { ...rect } };
}

const USER32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_USER32,
    lpfnInit: NtUser32Initialize,
    lpfnExit: NtUser32Uninitialize,
    lpExports: {
        [USER32.RegisterClass]: UserRegisterClass,
        [USER32.DefWindowProc]: UserDefWindowProc,
        [USER32.CreateWindowEx]: UserCreateWindowEx,
        [USER32.ShowWindow]: UserShowWindow,
        [USER32.GetMessage]: UserGetMessage,
        [USER32.PeekMessage]: UserPeekMessage,
        [USER32.TranslateMessage]: UserTranslateMessage,
        [USER32.DispatchMessage]: UserDispatchMessage,
        [USER32.PostQuitMessage]: UserPostQuitMessage,
        [USER32.GetDC]: UserGetDC,
        [USER32.GetSystemMetrics]: UserGetSystemMetrics,
        [USER32.SetWindowPos]: UserSetWindowPos,
        [USER32.CreateDesktop]: UserCreateDesktop,
        [USER32.GetWindowRect]: UserGetWindowRect,
        [USER32.ScreenToClient]: UserScreenToClient,
        [USER32.FindWindow]: UserFindWindow,
        [USER32.GetClientRect]: UserGetClientRect,
        [USER32.SendMessage]: UserSendMessage,
        [USER32.PostMessage]: UserPostMessage,
        [USER32.GetProp]: UserGetProp,
        [USER32.SetProp]: UserSetProp,
        [USER32.RemoveProp]: UserRemoveProp,
        [USER32.GetWindowLong]: UserGetWindowLong,
        [USER32.SetWindowLong]: UserSetWindowLong,
        [USER32.GetParent]: UserGetParent,
        [USER32.SetParent]: UserSetParent,
        // [USER32.GetFocus]: UserGetFocus,
        [USER32.LoadImage]: UserLoadImage,
        [USER32.MonitorFromWindow]: UserMonitorFromWindow,
        [USER32.MonitorFromPoint]: UserMonitorFromPoint,
        [USER32.MonitorFromRect]: UserMonitorFromRect,
        [USER32.CallWindowProc]: UserCallWindowProc,
        [USER32.GetMonitorInfo]: UserGetMonitorInfo,
        [USER32.BeginPaint]: UserBeginPaint,
        [USER32.EndPaint]: UserEndPaint,
        [USER32.InvalidateRect]: UserInvalidateRect,
        [USER32.AdjustWindowRect]: UserAdjustWindowRect,
    }
};

export default USER32_SUBSYSTEM;