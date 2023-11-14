import USER32, {
    ATOM,
    HBRUSH,
    HCURSOR,
    HICON,
    HINSTANCE,
    LPARAM,
    LRESULT,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    WNDCLASS,
    WNDCLASS_WIRE,
    WNDPROC,
    WNDPROC_PARAMS,
    WPARAM
} from "../types/user32.types.js";

import Executable from "../types/Executable.js";
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

    const msg = await User32.SendMessage<REGISTER_CLASS, REGISTER_CLASS_REPLY>({
        nType: USER32.RegisterClass,
        data: { lpWndClass: lpWndClassWire }
    });

    return msg.data.retVal;
}

export async function DefWindowProc(hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const msg = await User32.SendMessage<WNDPROC_PARAMS, number>({
        nType: USER32.DefWindowProc,
        data: [hWnd, uMsg, wParam, lParam]
    });

    return msg.data;
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