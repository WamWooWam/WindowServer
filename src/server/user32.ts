import USER32, { LRESULT, REGISTER_CLASS, REGISTER_CLASS_REPLY, WNDPROC_PARAMS } from "../types/user32.types.js";

import { NtDoCallbackAsync } from "../callback.js";
import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

export async function RegisterClass(peb: PEB, data: REGISTER_CLASS): Promise<REGISTER_CLASS_REPLY> {

    console.log("RegisterClass", data);

    await NtDoCallbackAsync(peb, SUBSYS_USER32, <number>data.lpWndClass.lpfnWndProc, [data.lpWndClass.hInstance, 0, 0, 0]);

    return { retVal: 0 };
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