import { LOGFONT, SM, SPI } from "../types/user32.types.js";
import { MONITOR, NtGetPrimaryMonitor, NtRegisterMonitorHook } from "./monitor.js";

import { PEB } from "../types/types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

const CAPTION_LOGFONT: LOGFONT = {
    lfHeight: 11,
    lfWidth: 0,
    lfEscapement: 0,
    lfOrientation: 0,
    lfWeight: 700,
    lfItalic: 0,
    lfUnderline: 0,
    lfStrikeOut: 0,
    lfCharSet: 1,
    lfOutPrecision: 3,
    lfClipPrecision: 2,
    lfQuality: 1,
    lfPitchAndFamily: 34,
    lfFaceName: "Tahoma"
};

const SMCAPTION_LOGFONT: LOGFONT = {
    lfHeight: 11,
    lfWidth: 0,
    lfEscapement: 0,
    lfOrientation: 0,
    lfWeight: 700,
    lfItalic: 0,
    lfUnderline: 0,
    lfStrikeOut: 0,
    lfCharSet: 1,
    lfOutPrecision: 3,
    lfClipPrecision: 2,
    lfQuality: 1,
    lfPitchAndFamily: 34,
    lfFaceName: "Tahoma"
};

// TODO: these are not the correct defaults
const MENU_LOGFONT: LOGFONT = { ...CAPTION_LOGFONT };
const STATUS_LOGFONT: LOGFONT = { ...CAPTION_LOGFONT };
const MESSAGE_LOGFONT: LOGFONT = { ...CAPTION_LOGFONT };

export function NtInitSysMetrics(peb: PEB) {
    const monitor = NtGetPrimaryMonitor();

    const memory = peb.lpSubsystems.get(SUBSYS_USER32)?.lpSharedMemory;
    if (!memory || !(memory instanceof SharedArrayBuffer)) {
        console.warn("NtInitSysMetrics: shared memory not initialized");
        return;
    }

    const view = new Int32Array(memory);

    // TODO: there are many more metrics to set here
    view[SM.CXSCREEN] = monitor.rcMonitor.right;
    view[SM.CYSCREEN] = monitor.rcMonitor.bottom;
    view[SM.CXMINIMIZED] = 160;
    view[SM.CYMINIMIZED] = 24;
    view[SM.CXSIZE] = 18;
    view[SM.CYSIZE] = 18;
    view[SM.CXFRAME] = 4;
    view[SM.CYFRAME] = 4;
    view[SM.CXMINTRACK] = 160;
    view[SM.CYMINTRACK] = 24;
    view[SM.CXMAXTRACK] = monitor.rcMonitor.right + 12;
    view[SM.CYMAXTRACK] = monitor.rcMonitor.bottom + 12;
    view[SM.CXBORDER] = 1;
    view[SM.CYBORDER] = 1;
    view[SM.CYCAPTION] = 18;
    view[SM.CXDLGFRAME] = 3;
    view[SM.CYDLGFRAME] = 3;
    view[SM.CXMINSPACING] = 8;
    view[SM.CYMINSPACING] = 8;

    const hook = (monitor: MONITOR) => {
        view[SM.CXSCREEN] = monitor.rcMonitor.right;
        view[SM.CYSCREEN] = monitor.rcMonitor.bottom;
        view[SM.CXMAXTRACK] = monitor.rcMonitor.right + 12;
        view[SM.CYMAXTRACK] = monitor.rcMonitor.bottom + 12;
    };

    NtRegisterMonitorHook(hook);
}

export function NtUserGetSystemMetrics(peb: PEB, nIndex: number): number {
    if (nIndex < 0 || nIndex >= SM.CMETRICS) {
        console.warn(`NtIntGetSystemMetrics: unknown nIndex ${nIndex}`);
        return 0;
    }

    const memory = peb.lpSubsystems.get(SUBSYS_USER32)?.lpSharedMemory;
    if (!memory || !(memory instanceof SharedArrayBuffer)) {
        throw new Error("NtUserGetSystemMetrics: shared memory not initialized");
    }

    const view = new Int32Array(memory);

    return view[nIndex];
}

export function NtUserSystemParametersInfo(peb: PEB | null, nParam: SPI, obj: any): boolean {
    switch (nParam) {
        case SPI.GETNONCLIENTMETRICS:
            Object.assign(obj, {
                lfCaptionFont: { ...CAPTION_LOGFONT },
                lfSmCaptionFont: { ...SMCAPTION_LOGFONT },
                lfMenuFont: { ...MENU_LOGFONT },
                lfStatusFont: { ...STATUS_LOGFONT },
                lfMessageFont: { ...MESSAGE_LOGFONT },

                // TODO: these are also all wrong, should be based on GetSystemMetrics
                iBorderWidth: 1,
                iScrollWidth: 12,
                iScrollHeight: 12,
                iCaptionWidth: 18,
                iCaptionHeight: 18,
                iSmCaptionWidth: 18,
                iSmCaptionHeight: 18,
                iMenuWidth: 18,
                iMenuHeight: 18,
                iPaddedBorderWidth: 1
            });
            return true;
        default:
            console.warn(`NtUserSystemParametersInfo: unknown nParam ${nParam}`);
            return false;
    }
}