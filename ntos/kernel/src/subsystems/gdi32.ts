import GDI32, { HRGN, LOGFONT, LOGPIXELSX, LOGPIXELSY } from "gdi32/dist/gdi32.int.js";
import { GreFillRegion, GreRectangle } from "../win32k/gdi/draw.js";
import { HANDLE, PEB, SUBSYSTEM_DEF } from "ntos-sdk/types/types.js";
import { NtGdiDeleteObject, NtGdiRectangle, NtGdiSelectObject, NtGdiSetTextColor, NtGdiTextOut } from "../win32k/gdi/ntgdi.js";
import { ObGetObject, ObSetHandleOwner, ObSetObject } from "../objects.js";
import REGION, { GreCombineRgn, GreCreateRectRgn } from "../win32k/gdi/rgn.js";

import DC from "../win32k/gdi/dc.js";
import { GreCreateFontIndirect } from "../win32k/gdi/font.js";
import { GreCreatePen } from "../win32k/gdi/pen.js";
import { GreCreateSolidBrush } from "../win32k/gdi/brush.js";
import { SUBSYS_GDI32 } from "ntos-sdk/types/subsystems.js";

export * from "gdi32/dist/gdi32.int.js";

function GdiCreateRectRgn(peb: PEB, { x1, x2, y1, y2 }: { x1: number, y1: number, x2: number, y2: number }): HRGN {
    const rgn = GreCreateRectRgn({ left: x1, top: y1, right: x2, bottom: y2 });
    ObSetHandleOwner(rgn._hObj, peb.hProcess);
    return rgn._hObj;
}

function GdiCombineRgn(peb: PEB, params: { hrgnDest: HRGN, hrgnSrc1: HRGN, hrgnSrc2: HRGN, fnCombineMode: number }): number {
    const { hrgnDest, hrgnSrc1, hrgnSrc2, fnCombineMode } = params;
    const rgnDest = ObGetObject<REGION>(hrgnDest);
    const rgnSrc1 = ObGetObject<REGION>(hrgnSrc1);
    const rgnSrc2 = ObGetObject<REGION>(hrgnSrc2);

    if (!rgnDest || !rgnSrc1 || !rgnSrc2) return 0;


    return GreCombineRgn(rgnDest, rgnSrc1, rgnSrc2, fnCombineMode);
}

function GdiFillRegion(peb: PEB, params: { hDC: number, hrgn: number }): boolean {
    const { hDC, hrgn } = params;

    const dc = ObGetObject<DC>(hDC);
    const rgn = ObGetObject<REGION>(hrgn);

    if (!dc || !rgn) return false;

    GreFillRegion(dc, rgn);

    return true;
}

function GdiDeleteObject(peb: PEB, { hObject }: { hObject: HANDLE }): boolean {
    return NtGdiDeleteObject(hObject);
}

function GdiSelectObject(peb: PEB, { hDC, hObject }: { hDC: HANDLE, hObject: HANDLE }): HANDLE {
    return NtGdiSelectObject(hDC, hObject);
}

function GdiCreateSolidBrush(peb: PEB, { crColor }: { crColor: number }): HANDLE {
    const brush = GreCreateSolidBrush(crColor);
    ObSetHandleOwner(brush._hObj, peb.hProcess);
    return brush._hObj;
}

function GdiCreatePen(peb: PEB, { iStyle, cWidth, crColor }: { iStyle: number, cWidth: number, crColor: number }): HANDLE {
    const pen = GreCreatePen(iStyle, cWidth, crColor);
    ObSetHandleOwner(pen._hObj, peb.hProcess);
    return pen._hObj;
}

function GdiTextOut(peb: PEB, { hDC, x, y, text }: { hDC: HANDLE, x: number, y: number, text: string }): boolean {
    return NtGdiTextOut(hDC, x, y, text);
}

function GdiSetTextColor(peb: PEB, { hDC, crColor }: { hDC: HANDLE, crColor: number }): number {
    return NtGdiSetTextColor(hDC, crColor);
}

function GdiRectangle(peb: PEB, { hDC, left, top, right, bottom }: { hDC: HANDLE, left: number, top: number, right: number, bottom: number }): boolean {
    NtGdiRectangle(hDC, { left, top, right, bottom });
    return true;
}

function GdiGetDeviceCaps(peb: PEB, { hDC, nIndex }: { hDC: HANDLE, nIndex: number }): number {
    let dc = ObGetObject<DC>(hDC);
    if (!dc) return 0;

    switch (nIndex) {
        case LOGPIXELSX:
            return 96;
        case LOGPIXELSY:
            return 96;
        default:
            console.warn("GdiGetDeviceCaps: Unknown nIndex", nIndex);
            return 0;
    }
}

function GdiCreateFontIndirect(peb: PEB, lf: LOGFONT): HANDLE {
    const font = GreCreateFontIndirect(lf);
    ObSetHandleOwner(font._hObj, peb.hProcess);
    return font._hObj;
}

const GDI32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_GDI32,
    lpExports: {
        [GDI32.CreateRectRgn]: GdiCreateRectRgn,
        [GDI32.CombineRgn]: GdiCombineRgn,
        [GDI32.FillRgn]: GdiFillRegion,
        [GDI32.DeleteObject]: GdiDeleteObject,
        [GDI32.SelectObject]: GdiSelectObject,
        [GDI32.CreateSolidBrush]: GdiCreateSolidBrush,
        [GDI32.CreatePen]: GdiCreatePen,
        [GDI32.TextOut]: GdiTextOut,
        [GDI32.SetTextColor]: GdiSetTextColor,
        [GDI32.Rectangle]: GdiRectangle,
        [GDI32.GetDeviceCaps]: GdiGetDeviceCaps,
        [GDI32.CreateFontIndirect]: GdiCreateFontIndirect
    }
};

export default GDI32_SUBSYSTEM;