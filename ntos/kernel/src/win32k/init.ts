import { GreInit } from "./gdi/ntgdi.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtInitSysMetrics } from "./metrics.js";
import { NtUserInitCursor } from "./cursor.js";
import { NtUserInitInput } from "./input.js";

export async function NtUserInit() {
    GreInit();
    NtGetPrimaryMonitor();
    NtUserInitInput();
    NtUserInitCursor();
}