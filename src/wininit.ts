/*
* Stub wininit, which is the first process created by the kernel.
* Currently just creates a desktop and waits for messages.
*/

import {
    CreateDesktop,
    DispatchMessage,
    GetMessage,
    TranslateMessage
} from "./client/user32.js";

import { GetModuleHandle } from "./client/kernel32.js";
import {
    MSG,
} from "./types/user32.types.js";

async function main() {
    const hModule = await GetModuleHandle(null);
    const hDesktop = await CreateDesktop("PrimaryDesktop", null, null, 0, 0, null);

    let msg: MSG = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}

export { main };