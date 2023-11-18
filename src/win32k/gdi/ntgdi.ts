import DC, { GreAllocDCForMonitor, GreSelectObject } from "./dc.js";
import { GreCombineRgn, GreCreateRectRgn, GreCreateRgn } from "./rgn.js";
import { GreCreateHatchBrush, GreCreateSolidBrush } from "./brush.js";
import { GreFillRegion as GreFillRgn, GreRectangle } from "./draw.js";
import { GreGetObj, GreGetStockObject, GreInitStockObjects } from "./obj.js";
import { HS, NULL_PEN, RGN } from "../../types/gdi32.types.js";

import { HANDLE } from "../../types/types.js";
import { NtGetPrimaryMonitor } from "../monitor.js";
import PEN from "./pen.js";

export interface GDIOBJ {
    _type: string;
    _hObj: HANDLE;
}

export function GreInit() {
    GreInitStockObjects();

    const monitor = NtGetPrimaryMonitor();
    const desktopDC = GreAllocDCForMonitor(monitor.hMonitor);

    const rgn1 = GreCreateRectRgn({ left: 0, top: 0, right: 100, bottom: 100 });
    const rgn2 = GreCreateRectRgn({ left: 50, top: 50, right: 150, bottom: 150 });
    const intersect = GreCreateRgn();
    GreCombineRgn(intersect, rgn1, rgn2, RGN.XOR);

    console.debug(`rgn1 = %O`, rgn1);
    console.debug(`rgn2 = %O`, rgn2);
    console.debug(`intersect = %O`, intersect);

    const brush = GreCreateHatchBrush(HS.FDIAGONAL, 0xFF00FF);
    const pen = GreGetStockObject<PEN>(NULL_PEN);
    GreSelectObject(desktopDC, brush);
    GreSelectObject(desktopDC, pen);
    
    GreFillRgn(desktopDC, intersect);
}