import { PsCreateProcess, PsProcessMarkCritical } from "./loader.js";

import { NtInitFileSystem } from "./fs/file.js";
import { NtUserInit } from "./win32k/init.js";

export async function NtPhase1Initialization() {
    
}

export async function NtInit() {
    await NtPhase1Initialization();
    await NtInitFileSystem();

    // TODO: move this to a better place
    await NtUserInit();

    // spawn wininit    
    const hProc = PsCreateProcess("apps/wininit.js", "", false, {}, "C:\\Windows\\System32", null);
    PsProcessMarkCritical(hProc, true);
}