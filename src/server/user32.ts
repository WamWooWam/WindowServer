import USER32, { LRESULT, REGISTER_CLASS, REGISTER_CLASS_REPLY, WNDPROC_PARAMS } from "../types/user32.types.js";

import { NtDoCallbackAsync } from "../callback.js";
import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

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

const USER32_EXPORTS = {
    [USER32.RegisterClass]: RegisterClass,
    [USER32.DefWindowProc]: DefWindowProc
};

export default USER32_EXPORTS;