import { BS, PS, RECT } from "../../types/gdi32.types.js";

import DC from "./dc.js";
import { GreRealiseBrush } from "./brush.js";
import { GreRealisePen } from "./pen.js";
import REGION from "./rgn.js";

function GreRegionToPath(rgn: REGION) {
    const path = new Path2D();
    const rects = rgn.rects;
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        path.rect(rect.left - 0.5, rect.top - 0.5, rect.right - rect.left, rect.bottom - rect.top);
    }

    return path;
}

export function GreFillRegion(dc: DC, reg: REGION) {
    const path = GreRegionToPath(reg);
    GreRealiseBrush(dc, dc.pbrFill);
    dc.pCtx.fill(path);
}

export function GreRectangle(dc: DC, prc: RECT) {
    if (dc.pbrFill.lbStyle !== BS.NULL) {
        GreRealiseBrush(dc, dc.pbrFill);
        dc.pCtx.fillRect(prc.left - 0.5, prc.top - 0.5, prc.right - prc.left, prc.bottom - prc.top);
    }

    if (dc.pbrLine.iStyle !== PS.NULL) {
        GreRealisePen(dc, dc.pbrLine);
        dc.pCtx.strokeRect(prc.left - 0.5, prc.top - 0.5, prc.right - prc.left, prc.bottom - prc.top);
    }
}

export function GreTextOut(dc: DC, x: number, y: number, text: string) {
    GreRealiseBrush(dc, dc.pbrFill);
    GreRealisePen(dc, dc.pbrLine);
    dc.pCtx.fillText(text, x, y);
}