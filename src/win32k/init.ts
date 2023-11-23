import { GreInit } from "./gdi/ntgdi.js";
import { NtGetPrimaryMonitor } from "./monitor.js";

export async function NtUserInit() {
    GreInit();
    NtGetPrimaryMonitor();
}