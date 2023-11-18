import { GDI32, HRGN } from "../types/gdi32.types.js";
import { ObGetObject, ObSetObject } from "../objects.js";
import { PEB, SUBSYSTEM_DEF } from "../types/types.js";
import REGION, { GreCombineRgn, GreCreateRectRgn } from "../win32k/gdi/rgn.js";

import DC from "../win32k/gdi/dc.js";
import { GreFillRegion } from "../win32k/gdi/draw.js";
import { SUBSYS_GDI32 } from "../types/subsystems.js";

function GdiCreateRectRgn(peb: PEB, { x1, x2, y1, y2 }: { x1: number, y1: number, x2: number, y2: number }): HRGN {
    const rgn = GreCreateRectRgn({ left: x1, top: y1, right: x2, bottom: y2 });
    return ObSetObject(rgn, "HRGN", peb.hProcess, null);
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
    const rgn = ObGetObject<REGION>(hrgn);

    GreFillRegion(hDC, rgn);

    return true;
}

const GDI32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_GDI32,
    lpExports: {
        [GDI32.CreateRectRgn]: GdiCreateRectRgn,
        [GDI32.CombineRgn]: GdiCombineRgn,
        [GDI32.FillRgn]: GdiFillRegion,
    }
};

export default GDI32_SUBSYSTEM;