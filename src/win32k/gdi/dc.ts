import { BLACK_PEN, DC_BRUSH, HDC, POINT, RECT, TRANSPARENT, WHITE_BRUSH } from "../../types/gdi32.types.js";
import BRUSH, { GreRealiseBrush } from "./brush.js";
import { COLOR, HWND } from "../../types/user32.types.js";
import { GreGetObj, GreGetStockObject } from "./obj.js";
import { HANDLE, PEB } from "../../types/types.js";
import { ObCloseHandle, ObDuplicateHandle, ObGetObject, ObSetObject } from "../../objects.js";
import PEN, { GreRealisePen } from "./pen.js";

import CLIP from "./clip.js";
import FONT from "./font.js";
import { GDIOBJ } from "./ntgdi.js";
import { IntGetSysColor } from "../brush.js";
import { MATRIX } from "./trans.js";
import { WND } from "../wnd.js";

// represents a device context
interface DC {
    hDC: HDC;
    pSurface: HTMLCanvasElement | OffscreenCanvas;
    pCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    pbrFill: BRUSH;
    pbrLine: PEN;
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
    pbrLine: PEN;
    pfntText: FONT;

    pdcParent: DC;
    prBounds: RECT;
    pcClip: CLIP;
    pmTransform: MATRIX;
    ptCurrent: POINT;

    crText: number;
    dwBkMode: number;

    constructor(hOwner: HANDLE, params: Partial<DC>) {
        this.hDC = ObSetObject(this, "DC", hOwner || params.pdcParent.hDC, (val) => GreCleanupDC(val));

        this.pSurface = params.pSurface;
        this.pCtx = params.pCtx;
        this.pbrFill = params.pbrFill || GreGetStockObject(WHITE_BRUSH);
        this.pbrLine = params.pbrLine || GreGetStockObject(BLACK_PEN);
        this.pfntText = params.pfntText || null;
        this.pdcParent = params.pdcParent || null;
        this.pcClip = params.pcClip || null;
        this.pmTransform = params.pmTransform || null;
        this.prBounds = params.prBounds || { left: 0, top: 0, right: 1, bottom: 1 };
        this.ptCurrent = { x: 0, y: 0 };

        this.crText = IntGetSysColor(COLOR.WINDOWTEXT);
        this.dwBkMode = TRANSPARENT;

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
export function GreAllocDCForMonitor(hMonitor: HANDLE): DC {
    if (hDCMonitor) {
        ObDuplicateHandle(hDCMonitor);
        return ObGetObject<DC>(hDCMonitor);
    }

    const pCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;

    const pCtx = pCanvas.getContext("2d");
    pCtx.translate(0.5, 0.5);

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

    hDCMonitor = dc.hDC;

    return dc;
}

export function GreAllocDCForWindow(peb: PEB, hWnd: HWND): HDC {
    const wnd = ObGetObject<WND>(hWnd);

    const pCanvas = document.createElement("canvas");
    pCanvas.width = wnd.rcClient.right - wnd.rcClient.left;
    pCanvas.height = wnd.rcClient.bottom - wnd.rcClient.top;

    const pCtx = pCanvas.getContext("2d");
    wnd.pRootElement.appendChild(pCanvas);

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

export function GreSelectObject(dc: DC, h: GDIOBJ): GDIOBJ {
    if(!h) {
        return null;
    }

    switch (h._type) {
        case "BRUSH":
            const pbr = h as BRUSH;
            const pbrOld = dc.pbrFill;
            dc.pbrFill = pbr;
            return pbrOld;
            break;
        case "FONT":
            const pfnt = h as FONT;
            const pfntOld = dc.pfntText;
            dc.pfntText = pfnt;
            return pfntOld;
            break;
        case "PEN":
            const pen = h as PEN;
            const penOld = dc.pbrLine;
            dc.pbrLine = pen;
            return penOld;
        // case "BITMAP":
        //     const bmp = h as BITMAP;
        //     break;
        // case "REGION":
        //     const rgn = h as REGION;
        //     break;
        default:
            console.warn(`GreSelectObject: unhandled type ${h._type}`);
            return null;
    }

    return null;
}

export function GreMoveTo(dc: DC, x: number, y: number) {
    const ptPrev = { x: dc.ptCurrent.x, y: dc.ptCurrent.y };
    dc.ptCurrent = { x, y };

    return ptPrev;
}

export function GreLineTo(dc: DC, x: number, y: number) {
    GreRealisePen(dc, dc.pbrLine);

    const ptPrev = { x: dc.ptCurrent.x, y: dc.ptCurrent.y };
    dc.ptCurrent = { x, y };
    dc.pCtx.beginPath();

    // there's an off-by-one error somewhere, so we need to draw the line ourselves
    const dx = x - ptPrev.x;
    const dy = y - ptPrev.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i < steps; i++) {
        dc.pCtx.lineTo(ptPrev.x + (dx * i / steps), ptPrev.y + (dy * i / steps));
    }

    dc.pCtx.closePath();
    dc.pCtx.stroke(); 

    return ptPrev;
}

export default DC;