import DC, { GreSelectObject } from "./gdi/dc.js";
import { GreGetObj, GreGetStockObject } from "./gdi/obj.js";
import { HBRUSH, HDC, NULL_PEN, RECT } from "../types/gdi32.types.js";

import BRUSH from "./gdi/brush.js";
import { GreRectangle } from "./gdi/draw.js";
import PEN from "./gdi/pen.js";

export function NtUserFillRect(hDC: HDC, prc: RECT, hbr: HBRUSH) {
    const dc = GreGetObj<DC>(hDC);
    const brush = GreGetObj<BRUSH>(hbr);
    const pen = GreGetStockObject<PEN>(NULL_PEN);

    const previousBrush = GreSelectObject(dc, brush);
    const previousPen = GreSelectObject(dc, pen);
    GreRectangle(dc, prc);

    GreSelectObject(dc, previousBrush);
    GreSelectObject(dc, previousPen);
}
