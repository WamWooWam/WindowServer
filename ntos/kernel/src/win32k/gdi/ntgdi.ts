import DC, { GreMoveTo, GreSelectObject } from "./dc.js";
import { GreCreateFontIndirect, GreRealiseFont } from "./font.js";
import { GreGetObj, GreGetStockObject, GreInitStockObjects } from "./obj.js";
import { GreLineTo, GreRectangle } from "./draw.js";
import { HDC, HFONT, LOGFONT, LPPOINT, POINT, PS, RECT, SIZE } from "../../subsystems/gdi32.js";
import { ObCloseHandle, ObDestroyHandle } from "../../objects.js";
import PEN, { GreCreatePen } from "./pen.js";

import { GreCreateSolidBrush } from "./brush.js";
import { HANDLE } from "@window-server/sdk/types/types.js";

export interface GDIOBJ {
    _type: string;
    _hObj: HANDLE;
}

export function GreInit() {
    GreInitStockObjects();
}

export function NtGdiGetStockObject(nIndex: number): HANDLE {
    return GreGetStockObject<GDIOBJ>(nIndex)._hObj;
}

export function NtGdiSelectObject(hDC: HDC, hObj: HANDLE): HANDLE {
    const dc = GreGetObj<DC>(hDC);
    const obj = GreGetObj<GDIOBJ>(hObj);
    if (!dc || !obj) return -1;
    const previous = GreSelectObject(dc, obj);
    return previous?._hObj || -1;
}

export function NtGdiCreateSolidBrush(color: number): HANDLE {
    return GreCreateSolidBrush(color)._hObj;
}

export function NtGdiCreatePen(ps: PS, width: number, color: number): HANDLE {
    return GreCreatePen(ps, width, color)._hObj;
}

export function NtGdiMoveTo(hDC: HDC, x: number, y: number): LPPOINT {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return null;
    return GreMoveTo(dc, x, y);
}

export function NtGdiLineTo(hDC: HDC, x: number, y: number): LPPOINT {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return null;
    return GreLineTo(dc, x, y);
}

export function NtGdiSetDCPenColor(hDC: HDC, color: number) {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return false;
    const pen = GreGetObj<PEN>(dc.pbrLine._hObj);
    if (!pen) return false;
    if (pen.iStyle === PS.NULL) {
        dc.pbrLine = GreCreatePen(PS.SOLID, 1, color);
    }
    else {
        pen.crColor = color;
    }
}

type GRADIENT_STOP = {
    dwColor: number;
    dwOffset: number;
}

export function NtGdiFillGradientRect(hDC: HDC, pRect: RECT, pStops: GRADIENT_STOP[], dwAngle: number): boolean {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return false;

    const ctx = dc.pCtx;

    const gradient = ctx.createLinearGradient(pRect.left, pRect.top, pRect.right, pRect.bottom);
    for (const stop of pStops) {
        gradient.addColorStop(stop.dwOffset, `rgba(${stop.dwColor & 0xFF}, ${(stop.dwColor >> 8) & 0xFF}, ${(stop.dwColor >> 16) & 0xFF}, 1)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(pRect.left - 0.5, pRect.top - 0.5, pRect.right - pRect.left, pRect.bottom - pRect.top);

    return true;
}

export function NtGdiCreateFontIndirect(lf: LOGFONT): HFONT {
    return GreCreateFontIndirect(lf)._hObj;
}

export function NtGdiGetTextColor(hDC: HDC): number {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return -1;
    return dc.crText;
}

export function NtGdiGetBkMode(hDC: HDC): number {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return -1;
    return dc.dwBkMode;
}

export function NtGdiSetBkMode(hDC: HDC, mode: number): number {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return -1;
    const previous = dc.dwBkMode;
    dc.dwBkMode = mode;
    return previous;
}

export function NtGdiSetTextColor(hDC: HDC, color: number): number {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return -1;
    const previous = dc.crText;
    dc.crText = color;
    return previous;
}

export function NtGdiTextOut(hDC: HDC, x: number, y: number, text: string): boolean {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return false;

    GreRealiseFont(dc, dc.pfntText);
    dc.pCtx.resetTransform();
    dc.pCtx.fillStyle = `rgba(${dc.crText & 0xFF}, ${(dc.crText >> 8) & 0xFF}, ${(dc.crText >> 16) & 0xFF}, 1)`;
    dc.pCtx.fillText(text, Math.round(x), Math.round(y + dc.pfntText.lpLogFont.lfHeight)); // TODO: what are these numbers?
    dc.pCtx.translate(0.5, 0.5);
    return true;
}

export function NtGdiDeleteObject(hObj: HANDLE): boolean {
    ObCloseHandle(hObj);

    return true;
}

export function NtGdiGetTextExtentEx(hDC: HDC, text: string, dwMax: number): { fit: number, size: SIZE } {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) {
        return { fit: 0, size: { cx: 0, cy: 0 } };
    }

    GreRealiseFont(dc, dc.pfntText);

    // returns the number of characters that will fit in the specified width (dwMax), and the size of the text
    // TODO: wrapping text with <canvas> is hard, so this is a hack for now

    const ctx = dc.pCtx;
    const width = ctx.measureText(text).width;
    const size = { cx: width, cy: dc.pfntText.lpLogFont.lfHeight * (96 / 72) };
    const fit = Math.floor(dwMax / width);

    return { fit, size };
}

export function NtGdiRectangle(hDC: HDC, rect: RECT) {
    const dc = GreGetObj<DC>(hDC);
    if (!dc) return;
    GreRectangle(dc, rect);
}