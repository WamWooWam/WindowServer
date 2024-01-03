import { NtUserGetDesktop } from "./shared.js";
import { PEB } from "@window-server/sdk/types/types.js";
import { POINT } from "../subsystems/gdi32.js";

let gptCursorPos: POINT = { x: 0, y: 0 };
export function NtUserGetCursorPos(peb: PEB) {
    return gptCursorPos;
}

export function NtUserInitCursor() {
    gptCursorPos = { x: 0, y: 0 };

    window.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        gptCursorPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointermove", (e) => {
        e.preventDefault();
        gptCursorPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointerup", (e) => {
        e.preventDefault();
        gptCursorPos = { x: e.clientX, y: e.clientY };
    });
}

export function NtUserSetCapture(peb: PEB, hWnd: number) {
    const desktop = NtUserGetDesktop(peb);
    if (!desktop) return;

    desktop.hCaptureWindow = hWnd;
}

export function NtUserReleaseCapture(peb: PEB) {
    const desktop = NtUserGetDesktop(peb);
    if (!desktop) return;

    desktop.hCaptureWindow = 0;
}

export function NtUserGetCapture(peb: PEB) {
    const desktop = NtUserGetDesktop(peb);
    if (!desktop) return;

    return desktop.hCaptureWindow;
}