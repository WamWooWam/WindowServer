import { BLACK_PEN, HDC, POINT, RECT, RGN, SYSTEM_FONT, TRANSPARENT, WHITE_BRUSH } from "../../subsystems/gdi32.js";
import BRUSH, { GreCreateBrush } from "./brush.js";
import { COLOR, HWND, SPI } from "../../subsystems/user32.js";
import FONT, { GreCreateFontIndirect } from "./font.js";
import { GreCombineRgn, GreCreateRectRgn } from "./rgn.js";
import { HANDLE, PEB } from "@window-server/sdk/types/types.js";
import { ObCloseHandle, ObDuplicateHandle, ObEnumHandlesByType, ObGetObject, ObSetHandleOwner, ObSetObject } from "../../objects.js";
import PEN, { GreRealisePen } from "./pen.js";

import CLIP from "./clip.js";
import DESKTOP from "../desktop.js";
import { GDIOBJ } from "./ntgdi.js";
import { GreFillRegion } from "./draw.js";
import { GreGetStockObject } from "./obj.js";
import { IntGetSysColor } from "../brush.js";
import { MATRIX } from "./trans.js";
import { NtUserSystemParametersInfo } from "../metrics.js";
import WND from "../wnd.js";

// represents a device context
interface DC {
    hDC: HDC;
    pSurface: HTMLCanvasElement | OffscreenCanvas;
    pCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    pbrFill: BRUSH;
    pbrLine: PEN;
    pfntText: FONT;

    pdcParent: DC | null;
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

    pdcParent: DC | null;
    prBounds: RECT;
    pcClip: CLIP;
    pmTransform: MATRIX;
    ptCurrent: POINT;

    crText: number;
    dwBkMode: number;

    constructor(peb: PEB | null, hOwner: HANDLE, params: Partial<DC>) {
        this.hDC = ObSetObject(this, "DC", hOwner || params.pdcParent?.hDC || -1, (val) => GreCleanupDC(val));

        const metrics = {};
        NtUserSystemParametersInfo(peb, SPI.GETNONCLIENTMETRICS, metrics)

        this.pSurface = params.pSurface || null!;
        this.pCtx = params.pCtx || null!;
        this.pbrFill = params.pbrFill || GreGetStockObject(WHITE_BRUSH);
        this.pbrLine = params.pbrLine || GreGetStockObject(BLACK_PEN);
        this.pfntText = params.pfntText || GreGetStockObject(SYSTEM_FONT);
        this.pdcParent = params.pdcParent || null;
        this.pcClip = params.pcClip || {};
        this.pmTransform = params.pmTransform || {} as MATRIX; // currently unused
        this.prBounds = params.prBounds || { left: 0, top: 0, right: 1, bottom: 1 };
        this.ptCurrent = { x: 0, y: 0 };

        if (!this.pfntText) {
            const font = GreCreateFontIndirect((metrics as any).lfSmCaptionFont);
            this.pfntText = font;

            ObSetHandleOwner(font._hObj, this.hDC);
        }

        this.crText = IntGetSysColor(COLOR.WINDOWTEXT);
        this.dwBkMode = TRANSPARENT;

        if (this.pdcParent) {
            this.pSurface = this.pdcParent.pSurface;
            this.pCtx = this.pdcParent.pCtx;
        }
    }

    public async Resize(prBounds: RECT) {
        this.prBounds = prBounds;

        if (!this.pdcParent) {
            // retain the original surface content
            const pSurface = this.pSurface;
            const pCtx = this.pCtx;

            if (pSurface.width && pSurface.height) {
                await createImageBitmap(pSurface).then((bitmap) => {
                    pSurface.width = prBounds.right - prBounds.left;
                    pSurface.height = prBounds.bottom - prBounds.top;

                    pCtx.clearRect(0, 0, pSurface.width, pSurface.height);
                    pCtx.drawImage(bitmap, 0, 0);
                });
            }
            else {
                pSurface.width = prBounds.right - prBounds.left;
                pSurface.height = prBounds.bottom - prBounds.top;
            }

            // let oldRgn = GreCreateRectRgn({ left: 0, top: 0, right: pSurface.width, bottom: pSurface.height });
            // let newRgn = GreCreateRectRgn(prBounds);
            // let intersect = GreCreateRectRgn({ left: 0, top: 0, right: 0, bottom: 0 });

            // // calculate the new dirty region
            // GreCombineRgn(intersect, oldRgn, newRgn, RGN.DIFF);

            // // fill the new dirty region with the background color
            // GreClearRgn(this, intersect);
        }
    }
}

let hDCMonitor: HDC = 0;
export function GreAllocDCForMonitor(hMonitor: HANDLE): DC {
    if (hDCMonitor) {
        ObDuplicateHandle(hDCMonitor);
        return ObGetObject<DC>(hDCMonitor)!;
    }

    const pCanvas = document.getElementById("canvas")! as HTMLCanvasElement;
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;

    const pCtx = pCanvas.getContext("2d")!;
    const dc = new DC(null, hMonitor, {
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
    if (!wnd) {
        return -1;
    }

    const pCanvas = new OffscreenCanvas(wnd.rcClient.right - wnd.rcClient.left, wnd.rcClient.bottom - wnd.rcClient.top);
    const pCtx = pCanvas.getContext("2d")!;

    const targetCanvas = document.createElement("canvas")!;
    wnd.pRootElement?.appendChild(targetCanvas);

    return new DC(peb, hWnd, {
        pSurface: pCanvas,
        pCtx
    }).hDC;
}

export function GreReleaseDC(hDC: HDC) {
    ObCloseHandle(hDC);
}

export async function GreResizeDC(hDC: HDC, prBounds: RECT) {
    const dc = ObGetObject<DC>(hDC);
    if (!dc) {
        return;
    }

    await dc.Resize(prBounds);
}

export function GreClearDC(dc: DC) {
    dc.pCtx.clearRect(0, 0, dc.pSurface.width, dc.pSurface.height);
}

function GreCleanupDC(dc: DC) {

}


export function GreSelectObject(dc: DC, h: GDIOBJ): GDIOBJ | null {
    if (!h) {
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

export default DC;