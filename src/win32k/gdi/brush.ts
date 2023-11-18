import { BS, DC_BRUSH, HS } from "../../types/gdi32.types.js";

import DC from "./dc.js";
import { GDIOBJ } from "./ntgdi.js";
import { GreGetStockObject } from "./obj.js";
import { HANDLE } from "../../types/types.js";
import { ObjCreateObject } from "../../objects.js";

export default interface BRUSH extends GDIOBJ {
    _type: "BRUSH";
    lbStyle: BS;
    lbColor: number;
    lbHatch?: HS;
    pValue: string | CanvasPattern | CanvasGradient;
}

export function GreCreateBrush() {
    return ObjCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.NULL,
        lbColor: 0,
        pValue: null
    }), 0, () => { })
}

export function GreCreateSolidBrush(color: number): BRUSH {
    return ObjCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.SOLID,
        lbColor: color,
        pValue: null
    }), 0, () => { })
}

export function GreCreateHatchBrush(style: HS, color: number): BRUSH {
    return ObjCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.HATCHED,
        lbColor: color,
        lbHatch: style,
        pValue: null
    }), 0, () => { })
}

// turns a brush into a canvas pattern
export function GreRealiseBrush(dc: DC, br: BRUSH) : string | CanvasPattern | CanvasGradient {
    if (br == GreGetStockObject(DC_BRUSH)) {
        return GreRealiseBrush(dc, dc.pbrFill);
    }

    if (br.pValue) return br.pValue;

    switch (br.lbStyle) {
        case BS.SOLID:
            return br.pValue = `#${br.lbColor.toString(16).padStart(6, "0")}`;
        case BS.HATCHED:
            {
                const canvas = document.createElement("canvas");
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = `#${br.lbColor.toString(16).padStart(6, "0")}`;
                ctx.fillRect(0, 0, 8, 8);
                ctx.fillStyle = "#000000";
                switch (br.lbHatch) {
                    case HS.BDIAGONAL:
                        ctx.moveTo(0, 0);
                        ctx.lineTo(8, 8);
                        ctx.stroke();
                        break;
                    case HS.CROSS:
                        ctx.moveTo(0, 4);
                        ctx.lineTo(8, 4);
                        ctx.stroke();
                        ctx.moveTo(4, 0);
                        ctx.lineTo(4, 8);
                        ctx.stroke();
                        break;
                    case HS.DIAGCROSS:
                        ctx.moveTo(0, 0);
                        ctx.lineTo(8, 8);
                        ctx.stroke();
                        ctx.moveTo(8, 0);
                        ctx.lineTo(0, 8);
                        ctx.stroke();
                        break;
                    case HS.FDIAGONAL:
                        ctx.moveTo(0, 8);
                        ctx.lineTo(8, 0);
                        ctx.stroke();
                        break;
                    case HS.HORIZONTAL:
                        ctx.moveTo(0, 4);
                        ctx.lineTo(8, 4);
                        ctx.stroke();
                        break;
                    case HS.VERTICAL:
                        ctx.moveTo(4, 0);
                        ctx.lineTo(4, 8);
                        ctx.stroke();
                        break;
                    default:
                        throw new Error(`GreRealiseBrush: unknown hatch style ${br.lbHatch}`);
                }
                return br.pValue = ctx.createPattern(canvas, "repeat");
            }
        case BS.PATTERN:
        case BS.DIBPATTERN:
        case BS.DIBPATTERNPT:
        case BS.DIBPATTERN8X8:
        case BS.PATTERN8X8:
            return br.pValue;
        default:
            throw new Error(`GreRealiseBrush: unknown brush style ${br.lbStyle}`);
    }
}