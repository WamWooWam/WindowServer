import { DC_PEN, PS } from "../../subsystems/gdi32.js";

import DC from "./dc.js";
import { GDIOBJ } from "./ntgdi.js";
import { GreGetStockObject } from "./obj.js";
import { ObCreateObject } from "../../objects.js";

export default interface PEN extends GDIOBJ {
    _type: "PEN";
    iStyle: PS;
    iWidth: number;
    crColor: number;
}

export function GreCreateNullPen(color?: number): PEN {
    return ObCreateObject("PEN", (hObj) => ({
        _type: "PEN",
        _hObj: hObj,
        iStyle: PS.NULL,
        iWidth: 0,
        crColor: 0
    }), 0, () => { });
}

export function GreCreatePen(iStyle: PS, iWidth: number, crColor: number): PEN {
    return ObCreateObject("PEN", (hObj) => ({
        _type: "PEN",
        _hObj: hObj,
        iStyle,
        iWidth,
        crColor
    }), 0, () => { });
}

// create a strokeStyle from a pen
export function GreRealisePen(dc: DC, pen: PEN): void {
    if ((pen._hObj != dc.pbrLine._hObj) && pen._hObj == GreGetStockObject<PEN>(DC_PEN)._hObj) {
        return GreRealisePen(dc, dc.pbrLine);
    }

    const ctx = dc.pCtx;
    const style = pen.iStyle;
    const width = pen.iWidth;
    const color = pen.crColor;

    if (style === PS.NULL) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0)";
    } else {
        ctx.strokeStyle = `rgba(${color & 0xFF}, ${(color >> 8) & 0xFF}, ${(color >> 16) & 0xFF}, 1)`;
    }

    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}