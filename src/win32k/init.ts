import { GreInit } from "./gdi/ntgdi.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtUserInitCursor } from "./cursor.js";

export async function NtUserInit() {
    GreInit();
    NtGetPrimaryMonitor();
    NtUserInitCursor();
}