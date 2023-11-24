import { HANDLE, PEB, SUBSYSTEM, SUBSYSTEM_DEF } from "../types/types.js";
import { NtCreateWindowEx, NtDestroyWindow, NtSetWindowPos, NtShowWindow, NtUserGetDC } from "../win32k/window.js";
import { NtDispatchMessage, NtGetMessage, NtPostQuitMessage } from "../win32k/msg.js";
import { NtUserCreateDesktop, NtUserDesktopWndProc } from "../win32k/desktop.js";
import USER32, {
    CREATE_DESKTOP,
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    GET_MESSAGE,
    GET_MESSAGE_REPLY,
    HWND,
    LRESULT,
    MSG,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    SET_WINDOW_POS,
    SHOW_WINDOW,
    SHOW_WINDOW_REPLY,
    WNDCLASSEX,
    WNDCLASS_WIRE,
    WNDPROC_PARAMS,
    WS,
} from "../types/user32.types.js";

import { ButtonWndProc } from "./user32/button.js";
import { NtDefWindowProc } from "../win32k/def.js";
import { NtIntGetSystemMetrics } from "../win32k/metrics.js";
import { NtRegisterClassEx } from "../win32k/class.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";
import W32MSG_QUEUE from "../win32k/msgqueue.js";
import { W32PROCINFO } from "../win32k/shared.js";

const DefaultClasses: WNDCLASSEX[] = [
    {
        style: WS.CHILD,
        lpszClassName: 0x8001,
        lpszMenuName: null,
        lpfnWndProc: NtUserDesktopWndProc,
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
            lpMsgQueue: null
        }

        const msgQueue = new W32MSG_QUEUE(peb, procInfo);
        procInfo.lpMsgQueue = msgQueue;

        lpSubsystem.lpParams = procInfo;
    }

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
    await NtShowWindow(peb, data.hWnd, data.nCmdShow);

    return { retVal: true };
}

async function UserGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    const msg = await NtGetMessage(peb, data);
    return msg;
}

async function UserPeekMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    return { retVal: false, lpMsg: data.lpMsg };
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
    return NtIntGetSystemMetrics(nIndex);
}

function UserSetWindowPos(peb: PEB, params: SET_WINDOW_POS) {
    return NtSetWindowPos(peb, params.hWnd, params.hWndInsertAfter, params.x, params.y, params.cx, params.cy, params.uFlags);
}

async function UserCreateDesktop(peb: PEB, params: CREATE_DESKTOP): Promise<HANDLE> {
    return await NtUserCreateDesktop(peb, params);
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
        [USER32.CreateDesktop]: UserCreateDesktop
    }
};

export default USER32_SUBSYSTEM;