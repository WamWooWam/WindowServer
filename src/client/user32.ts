import USER32, {
    ATOM,
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    GET_MESSAGE,
    GET_MESSAGE_REPLY,
    HINSTANCE,
    LPARAM,
    LRESULT,
    MSG,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    SHOW_WINDOW,
    SHOW_WINDOW_REPLY,
    WNDCLASS,
    WNDCLASS_WIRE,
    WNDPROC,
    WNDPROC_PARAMS,
    WPARAM
} from "../types/user32.types.js";

import Executable from "../types/Executable.js";
import { GetModuleHandle } from "./kernel32.js";
import { HANDLE } from "../types/types.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

const User32 = await NtRegisterSubsystem(SUBSYS_USER32, User32_HandleMessage);

function User32_HandleMessage(msg: Message) {

}

export async function RegisterClass(lpWndClass: WNDCLASS): Promise<ATOM> {
    const lpWndClassWire: WNDCLASS_WIRE = {
        ...lpWndClass,
        lpfnWndProc: User32.RegisterCallback((msg: Message<WNDPROC_PARAMS>) => { return lpWndClass.lpfnWndProc(...msg.data); }, true),
    }

    if (lpWndClassWire.hInstance === 0) {
        lpWndClassWire.hInstance = await GetModuleHandle(null);
    }

    // TODO: Resource lookup

    const msg = await User32.SendMessage<REGISTER_CLASS, REGISTER_CLASS_REPLY>({
        nType: USER32.RegisterClass,
        data: { lpWndClass: lpWndClassWire }
    });

    return msg.data.retVal;
}

export async function CreateWindow(
    lpClassName: string,
    lpWindowName: string,
    dwStyle: number,
    x: number,
    y: number,
    nWidth: number,
    nHeight: number,
    hWndParent: HANDLE,
    hMenu: HANDLE,
    hInstance: HINSTANCE,
    lpParam: any
): Promise<HANDLE> {
    return CreateWindowEx(0, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam);
}

export async function CreateWindowEx(
    dwExStyle: number,
    lpClassName: string,
    lpWindowName: string,
    dwStyle: number,
    x: number,
    y: number,
    nWidth: number,
    nHeight: number,
    hWndParent: HANDLE,
    hMenu: HANDLE,
    hInstance: HINSTANCE,
    lpParam: any
): Promise<HANDLE> {
    const msg = await User32.SendMessage<CREATE_WINDOW_EX, CREATE_WINDOW_EX_REPLY>({
        nType: USER32.CreateWindowEx,
        data: {
            dwExStyle,
            lpClassName,
            lpWindowName,
            dwStyle,
            x,
            y,
            nWidth,
            nHeight,
            hWndParent,
            hMenu,
            hInstance,
            lpParam
        }
    });

    return msg.data.hWnd;
}

export async function DefWindowProc(hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const msg = await User32.SendMessage<WNDPROC_PARAMS, number>({
        nType: USER32.DefWindowProc,
        data: [hWnd, uMsg, wParam, lParam]
    });

    return msg.data;
}

export async function ShowWindow(hWnd: HANDLE, nCmdShow: number): Promise<boolean> {
    const msg = await User32.SendMessage<SHOW_WINDOW, SHOW_WINDOW_REPLY>({
        nType: USER32.ShowWindow,
        data: { hWnd, nCmdShow }
    });

    return msg.data.retVal;
}

export async function GetMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number): Promise<boolean> {
    const msg = await User32.SendMessage<GET_MESSAGE, GET_MESSAGE_REPLY>({
        nType: USER32.GetMessage,
        data: { lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax }
    });

    Object.assign(lpMsg, msg.data.lpMsg);

    return msg.data.retVal;
}

export async function PeekMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number): Promise<boolean> {
    const msg = await User32.SendMessage<GET_MESSAGE, GET_MESSAGE_REPLY>({
        nType: USER32.PeekMessage,
        data: { lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax }
    });

    Object.assign(lpMsg, msg.data.lpMsg);

    return msg.data.retVal;
}

export async function TranslateMessage(lpMsg: MSG): Promise<boolean> {
    const msg = await User32.SendMessage<MSG, boolean>({
        nType: USER32.TranslateMessage,
        data: lpMsg
    });

    return msg.data;
}

export async function DispatchMessage(lpMsg: MSG): Promise<boolean> {
    const msg = await User32.SendMessage<MSG, boolean>({
        nType: USER32.DispatchMessage,
        data: lpMsg
    });

    return msg.data;
}

export async function PostQuitMessage(nExitCode: number) {
    await User32.SendMessage<number>({
        nType: USER32.PostQuitMessage,
        data: nExitCode
    });
}

const user32: Executable = {
    file: "user32.js",
    type: "dll",
    subsystem: "console",
    arch: "js",
    entryPoint: null,
    dependencies: ["ntdll.js", "kernel32.js"],

    name: "user32",
    version: [1, 0, 0, 0],
    rsrc: {}
};

export default user32;