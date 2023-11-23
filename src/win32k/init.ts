import { GreInit } from "./gdi/ntgdi.js";
import { NtGetPrimaryMonitor } from "./monitor.js";

export function NtUserInit() {
    GreInit();

    NtGetPrimaryMonitor();
}