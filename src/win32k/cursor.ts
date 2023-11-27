import DESKTOP from "./desktop.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { POINT } from "../types/gdi32.types.js";

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
    const desktop = ObGetObject<DESKTOP>(peb.hDesktop);
    desktop.hCaptureWindow = hWnd;
}

export function NtUserReleaseCapture(peb: PEB) {
    const desktop = ObGetObject<DESKTOP>(peb.hDesktop);
    desktop.hCaptureWindow = 0;
}

export function NtUserGetCapture(peb: PEB) {
    const desktop = ObGetObject<DESKTOP>(peb.hDesktop);
    return desktop.hCaptureWindow;
}