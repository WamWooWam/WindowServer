import { BS, PS, RECT, ROUND } from "../../subsystems/gdi32.js";

import DC from "./dc.js";
import { GreRealiseBrush } from "./brush.js";
import { GreRealiseFont } from "./font.js";
import { GreRealisePen } from "./pen.js";
import REGION from "./rgn.js";

function GreRegionToPath(rgn: REGION) {
    const path = new Path2D();
    const rects = rgn.rects;
    for (let i = 0; i < rects.length; i++) {
        const prc = rects[i];
        let x = ROUND(prc.left);
        let y = ROUND(prc.top);
        let w = ROUND(prc.right) - x;
        let h = ROUND(prc.bottom) - y;

        path.rect(x, y, w, h);
    }

    return path;
}

export function GreFillRegion(dc: DC, reg: REGION) {
    const path = GreRegionToPath(reg);
    GreRealiseBrush(dc, dc.pbrFill);
    dc.pCtx.fill(path);
}


export function GreRectangle(dc: DC, prc: RECT) {
    let x = ROUND(prc.left);
    let y = ROUND(prc.top);
    let w = ROUND(prc.right) - x;
    let h = ROUND(prc.bottom) - y;

    if (dc.pbrFill.lbStyle !== BS.NULL) {
        GreRealiseBrush(dc, dc.pbrFill);
        dc.pCtx.fillRect(x, y, w, h);
    }

    if (dc.pbrLine.iStyle !== PS.NULL) {
        GreRealisePen(dc, dc.pbrLine);
        dc.pCtx.strokeRect(x, y, w, h);
    }
}


export function GreLineTo(dc: DC, x: number, y: number) {
    GreRealisePen(dc, dc.pbrLine);

    x = ROUND(x);
    y = ROUND(y);

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

export function GreTextOut(dc: DC, x: number, y: number, text: string) {
    GreRealiseBrush(dc, dc.pbrFill);
    GreRealisePen(dc, dc.pbrLine);
    GreRealiseFont(dc, dc.pfntText)
    dc.pCtx.fillText(text, ROUND(x), ROUND(y));
}