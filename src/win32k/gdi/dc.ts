import { HANDLE, PEB } from "../../types/types.js";
import { HDC, RECT } from "../../types/gdi32.types.js";
import { ObCloseHandle, ObDuplicateHandle, ObGetObject, ObSetObject } from "../../objects.js";

import BRUSH from "./brush.js";
import CLIP from "./clip.js";
import FONT from "./font.js";
import { HWND } from "../../types/user32.types.js";
import { MATRIX } from "./trans.js";
import { WND } from "../wnd.js";

// represents a device context
interface DC {
    hDC: HDC;
    pSurface: HTMLCanvasElement | OffscreenCanvas;
    pCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    pbrFill: BRUSH;
    pbrLine: BRUSH;
    pfntText: FONT;

    pdcParent: DC;
    pcClip: CLIP;
    pmTransform: MATRIX;
}

class DC implements DC {
    hDC: HDC;
    pSurface: HTMLCanvasElement | OffscreenCanvas;
    pCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    pbrFill: BRUSH;
    pbrLine: BRUSH;
    pfntText: FONT;

    pdcParent: DC;
    prBounds: RECT;
    pcClip: CLIP;
    pmTransform: MATRIX;

    constructor(hOwner: HANDLE, params: Partial<DC>) {
        this.hDC = ObSetObject(this, "DC", hOwner || params.pdcParent.hDC, (val) => GreCleanupDC(val));

        this.pSurface = params.pSurface;
        this.pCtx = params.pCtx;
        this.pbrFill = params.pbrFill || null;
        this.pbrLine = params.pbrLine || null;
        this.pfntText = params.pfntText || null;
        this.pdcParent = params.pdcParent || null;
        this.pcClip = params.pcClip || null;
        this.pmTransform = params.pmTransform || null;
        this.prBounds = params.prBounds || { left: 0, top: 0, right: 1, bottom: 1 };

        if (this.pdcParent) {
            this.pSurface = this.pdcParent.pSurface;
            this.pCtx = this.pdcParent.pCtx;
        }
    }

    public Resize(prBounds: RECT) {
        this.prBounds = prBounds;

        if (!this.pdcParent) {
            this.pSurface.width = prBounds.right - prBounds.left;
            this.pSurface.height = prBounds.bottom - prBounds.top;
        }
    }
}

let hDCMonitor: HDC = null;
export function GreAllocDCForMonitor(hMonitor: HANDLE): HDC {
    if (hDCMonitor) {
        return ObDuplicateHandle(hDCMonitor);
    }

    const pCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;

    const pCtx = pCanvas.getContext("2d");
    const dc = new DC(hMonitor, {
        pSurface: pCanvas,
        pCtx
    });

    window.addEventListener("resize", () => {
        dc.Resize({
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight
        });
    });

    return dc.hDC;
}

export function GreAllocDCForWindow(peb: PEB, hWnd: HWND): HDC {
    const wnd = ObGetObject<WND>(hWnd);

    const pCanvas = document.createElement("canvas");
    pCanvas.width = wnd.rcClient.right - wnd.rcClient.left;
    pCanvas.height = wnd.rcClient.bottom - wnd.rcClient.top;

    const pCtx = pCanvas.getContext("2d");
    return new DC(hWnd, {
        pSurface: pCanvas,
        pCtx
    }).hDC;
}

export function GreReleaseDC(hDC: HDC) {
    ObCloseHandle(hDC);
}

export function GreResizeDC(hDC: HDC, prBounds: RECT) {
    const dc = ObGetObject<DC>(hDC);
    dc.Resize(prBounds);
}

function GreCleanupDC(dc: DC) {

}

export default DC;