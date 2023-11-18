import { DC_PEN, PS } from "../../types/gdi32.types.js";

import DC from "./dc.js";
import { GDIOBJ } from "./ntgdi.js";
import { GreGetStockObject } from "./obj.js";
import { ObjCreateObject } from "../../objects.js";

export default interface PEN extends GDIOBJ {
    _type: "PEN";
    iStyle: PS;
    iWidth: number;
    crColor: number;
}

export function GreCreateNullPen(color?: number): PEN {
    return ObjCreateObject("PEN", (hObj) => ({
        _type: "PEN",
        _hObj: hObj,
        iStyle: PS.NULL,
        iWidth: 0,
        crColor: 0
    }), 0, () => { });
}

export function GreCreatePen(iStyle: PS, iWidth: number, crColor: number): PEN {
    return ObjCreateObject("PEN", (hObj) => ({
        _type: "PEN",
        _hObj: hObj,
        iStyle,
        iWidth,
        crColor
    }), 0, () => { });
}

// create a strokeStyle from a pen
export function GreRealisePen(dc: DC, pen: PEN): { strokeStyle: string, lineWidth: number, lineCap: string, lineJoin: string } {
    if (pen == GreGetStockObject(DC_PEN)) {
        return GreRealisePen(dc, dc.pbrLine);
    }

    const ctx = {
        strokeStyle: null as string,
        lineWidth: 0,
        lineCap: "round",
        lineJoin: "round"
    }
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

    return ctx;
}