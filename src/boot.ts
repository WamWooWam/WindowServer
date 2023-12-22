import { PsCreateProcess, PsProcessMarkCritical } from "./loader.js";

import { NtInitFileSystem } from "./fs/file.js";
import { NtUserInit } from "./win32k/init.js";
import { NtUserInitInput } from "./win32k/input.js";
import { PEB } from "./types/types.js";

const g_kernelPeb: PEB = {
    id: "ntoskrnl.exe",
    dwProcessId: 0,
    dwThreadId: 0,
    lpSubsystems: new Map(),
    hDesktop: 0,
    hProcess: 0,
    hThread: 0,
}

export function NtGetKernelPeb() {
    return g_kernelPeb;
}

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