import USER32, {
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    LRESULT,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    WNDPROC_PARAMS
} from "../types/user32.types.js";

import { NtDoCallbackAsync } from "../callback.js";
import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";
import { Window } from "../window.js";

interface WindowClass {
    style: number;
    lpfnWndProc: number;
    cbClsExtra: number;
    cbWndExtra: number;
    hIcon: number;
    hCursor: number;
    hbrBackground: number;
    lpszMenuName: string | number;
    lpszClassName: string | number;
}

interface User32ProcessState {
    classes: WindowClass[]
}

function GetProcessState(peb: PEB): User32ProcessState {
    const state = peb.lpSubsystems.get(SUBSYS_USER32) as User32ProcessState;
    if (!state) {
        const newState: User32ProcessState = {
            classes: []
        };
        peb.lpSubsystems.set(SUBSYS_USER32, newState);
        return newState;
    }
    return state;

}

export async function RegisterClass(peb: PEB, { lpWndClass }: REGISTER_CLASS): Promise<REGISTER_CLASS_REPLY> {
    console.log("RegisterClass", lpWndClass);

    const state = GetProcessState(peb);
    const wndClass: WindowClass = {
        style: lpWndClass.style,
        lpfnWndProc: <number>lpWndClass.lpfnWndProc,
        cbClsExtra: lpWndClass.cbClsExtra,
        cbWndExtra: lpWndClass.cbWndExtra,
        hIcon: lpWndClass.hIcon,
        hCursor: lpWndClass.hCursor,
        hbrBackground: lpWndClass.hbrBackground,
        lpszMenuName: lpWndClass.lpszMenuName,
        lpszClassName: lpWndClass.lpszClassName
    };

    if (state.classes.find(c => c.lpszClassName === wndClass.lpszClassName)) {
        return { retVal: 0 };
    }

    state.classes.push(wndClass);

    return { retVal: state.classes.indexOf(wndClass) + 1 };
}

export async function DefWindowProc(peb: PEB, data: WNDPROC_PARAMS): Promise<LRESULT> {
    console.log("DefWindowProc", data);

    return 0;
}

export async function CreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<CREATE_WINDOW_EX_REPLY> {
    console.log("CreateWindowEx", data);

    const state = GetProcessState(peb);
    const wndClass = state.classes.find(c => c.lpszClassName === data.lpClassName);
    if (!wndClass) {
        return { hWnd: 0 };
    }

    const window = new Window(
        data.lpClassName,
        data.lpWindowName,
        data.dwStyle,
        data.x,
        data.y,
        data.nWidth,
        data.nHeight,
        data.hWndParent,
        data.hMenu,
        data.hInstance == 0 ? peb.hProcess : data.hInstance,
        data.lpParam);

    return { hWnd: window.getHandle() };
}

const USER32_EXPORTS = {
    [USER32.RegisterClass]: RegisterClass,
    [USER32.DefWindowProc]: DefWindowProc,
    [USER32.CreateWindowEx]: CreateWindowEx
};

export default USER32_EXPORTS;