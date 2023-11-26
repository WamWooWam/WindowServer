import { GDI32, HRGN } from "../types/gdi32.types.js";
import { HANDLE, PEB, SUBSYSTEM_DEF } from "../types/types.js";
import { NtGdiDeleteObject, NtGdiSelectObject, NtGdiSetTextColor, NtGdiTextOut } from "../win32k/gdi/ntgdi.js";
import { ObGetObject, ObSetHandleOwner, ObSetObject } from "../objects.js";
import REGION, { GreCombineRgn, GreCreateRectRgn } from "../win32k/gdi/rgn.js";

import DC from "../win32k/gdi/dc.js";
import { GreCreatePen } from "../win32k/gdi/pen.js";
import { GreCreateSolidBrush } from "../win32k/gdi/brush.js";
import { GreFillRegion } from "../win32k/gdi/draw.js";
import { SUBSYS_GDI32 } from "../types/subsystems.js";

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

    return GreCombineRgn(rgnDest, rgnSrc1, rgnSrc2, fnCombineMode);
}

function GdiFillRegion(peb: PEB, params: { hDC: number, hrgn: number }): boolean {
    const { hDC, hrgn } = params;

    const dc = ObGetObject<DC>(hDC);
    const rgn = ObGetObject<REGION>(hrgn);

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
        [GDI32.SetTextColor]: GdiSetTextColor
    }
};

export default GDI32_SUBSYSTEM;