import { PEB, SUBSYSTEM, SUBSYSTEM_DEF } from "../types/types.js";
import USER32, {
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    LRESULT,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    WNDCLASS_WIRE,
    WNDPROC_PARAMS
} from "../types/user32.types.js";

import { NtCreateWindowEx } from "../win32k/window.js";
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

export async function RegisterClass(peb: PEB, { lpWndClass }: REGISTER_CLASS): Promise<REGISTER_CLASS_REPLY> {
    console.log("RegisterClass", lpWndClass);

    const atom = NtRegisterClassEx(peb, lpWndClass as WNDCLASS_WIRE);
    return { retVal: atom };
}

export async function DefWindowProc(peb: PEB, data: WNDPROC_PARAMS): Promise<LRESULT> {
    console.log("DefWindowProc", data);

    return 0;
}

export async function CreateWindowEx(peb: PEB, data: CREATE_WINDOW_EX): Promise<CREATE_WINDOW_EX_REPLY> {
    console.log("CreateWindowEx", data);

    const window = await NtCreateWindowEx(peb, data);
    return { hWnd: window };
}

const USER32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_USER32,
    lpfnInit: NtUser32Initialize,
    lpExports: {
        [USER32.RegisterClass]: RegisterClass,
        [USER32.DefWindowProc]: DefWindowProc,
        [USER32.CreateWindowEx]: CreateWindowEx
    }
};

export default USER32_SUBSYSTEM;