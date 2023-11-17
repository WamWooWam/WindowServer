import { NtDispatchMessage, NtGetMessage } from "../win32k/msg.js";
import { PEB, SUBSYSTEM, SUBSYSTEM_DEF } from "../types/types.js";
import USER32, {
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    GET_MESSAGE,
    GET_MESSAGE_REPLY,
    LRESULT,
    MSG,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    SHOW_WINDOW,
    SHOW_WINDOW_REPLY,
    WNDCLASS_WIRE,
    WNDPROC_PARAMS,
} from "../types/user32.types.js";

import { NtCreateWindowEx } from "../win32k/window.js";
import { NtDefWindowProc } from "../win32k/def.js";
import { NtRegisterClassEx } from "../win32k/class.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";
import { W32PROCINFO } from "../win32k/shared.js";

function NtUser32Initialize(peb: PEB, lpSubsystem: SUBSYSTEM) {
    let procInfo = lpSubsystem.lpParams as W32PROCINFO;
    if (!procInfo) {
        procInfo = {
            classes: [],
            hWnds: [],
            hDesktop: 0
        }

        lpSubsystem.lpParams = procInfo;
    }
}

async function UserRegisterClass(peb: PEB, { lpWndClass }: REGISTER_CLASS): Promise<REGISTER_CLASS_REPLY> {
    console.log("RegisterClass", lpWndClass);

    const atom = NtRegisterClassEx(peb, lpWndClass as WNDCLASS_WIRE);
    return { retVal: atom };
}

async function UserDefWindowProc(peb: PEB, data: WNDPROC_PARAMS): Promise<LRESULT> {
    console.log("DefWindowProc", data);

    return await NtDefWindowProc(peb, ...data);
}

async function UserCreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<CREATE_WINDOW_EX_REPLY> {
    console.log("CreateWindowEx", data);

    const window = await NtCreateWindowEx(peb, data);
    return { hWnd: window };
}

async function UserShowWindow(peb: PEB, data: SHOW_WINDOW): Promise<SHOW_WINDOW_REPLY> {
    console.log("ShowWindow", data);

    return { retVal: true };
}

async function UserGetMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    console.log("GetMessage", data);

    const msg = await NtGetMessage(peb, data);
    return msg;
}

async function UserPeekMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    console.log("PeekMessage", data);

    return { retVal: false, lpMsg: data.lpMsg };
}

async function UserTranslateMessage(peb: PEB, data: GET_MESSAGE): Promise<GET_MESSAGE_REPLY> {
    console.log("TranslateMessage", data);

    return { retVal: false, lpMsg: data.lpMsg };
}

async function UserDispatchMessage(peb: PEB, data: MSG): Promise<GET_MESSAGE_REPLY> {
    console.log("DispatchMessage", data);

    await NtDispatchMessage(peb, data);

    return { retVal: false, lpMsg: data };
} 

const USER32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_USER32,
    lpfnInit: NtUser32Initialize,
    lpExports: {
        [USER32.RegisterClass]: UserRegisterClass,
        [USER32.DefWindowProc]: UserDefWindowProc,
        [USER32.CreateWindowEx]: UserCreateWindowEx,
        [USER32.ShowWindow]: UserShowWindow,
        [USER32.GetMessage]: UserGetMessage,
        [USER32.PeekMessage]: UserPeekMessage,
        [USER32.TranslateMessage]: UserTranslateMessage,
        [USER32.DispatchMessage]: UserDispatchMessage

    }
};

export default USER32_SUBSYSTEM;