/*
* Stub wininit, which is the first process created by the kernel.
* Currently just creates a desktop and waits for messages.
*/

import {
    CreateDesktop,
    DispatchMessage,
    FindWindow,
    GetMessage,
    TranslateMessage,
    MSG
} from "../client/user32.js";

async function main() {
    const window = await FindWindow(<string><any>0x8001, null);
    if (window) return;

    await CreateDesktop("PrimaryDesktop", '', null, 0, 0, null);

    let msg: MSG = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}

export { main };