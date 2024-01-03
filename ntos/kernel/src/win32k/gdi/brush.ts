import { BS, DC_BRUSH, HS, TRANSPARENT } from "../../subsystems/gdi32.js";

import DC from "./dc.js";
import { GDIOBJ } from "./ntgdi.js";
import { GreGetStockObject } from "./obj.js";
import { HANDLE } from "@window-server/sdk/types/types.js";
import { ObCreateObject } from "../../objects.js";

export default interface BRUSH extends GDIOBJ {
    _type: "BRUSH";
    lbStyle: BS;
    lbColor: number;
    lbHatch?: HS;
    pValue: string | CanvasPattern | CanvasGradient | null;
    pData?: any;
}

export function GreCreateBrush() {
    return ObCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.NULL,
        lbColor: 0,
        pValue: null
    }), 0, () => { })
}

export function GreCreateSolidBrush(color: number): BRUSH {
    return ObCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.SOLID,
        lbColor: color,
        pValue: null
    }), 0, () => { })
}

export function GreCreateHatchBrush(style: HS, color: number): BRUSH {
    return ObCreateObject("BRUSH", (hObj: HANDLE) => ({
        _type: "BRUSH",
        _hObj: hObj,
        lbStyle: BS.HATCHED,
        lbColor: color,
        lbHatch: style,
        pValue: null
    }), 0, () => { })
}

// turns a brush into a canvas pattern
export function GreRealiseBrush(dc: DC, br: BRUSH): void {
    if (br == GreGetStockObject(DC_BRUSH)) {
        return GreRealiseBrush(dc, dc.pbrFill);
    }

    if (br.pValue) {
        dc.pCtx.fillStyle = br.pValue;
    }

    switch (br.lbStyle) {
        case BS.SOLID:
            br.pValue = `#${br.lbColor.toString(16).padStart(6, "0")}`;
            break;
        case BS.HATCHED:
            {
                const canvas = document.createElement("canvas");
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext("2d")!;

                if (dc.dwBkMode === TRANSPARENT) {
                    ctx.clearRect(0, 0, 8, 8);
                }
                else {
                    ctx.fillRect(0, 0, 8, 8);
                    // todo: bkColor
                } 
                ctx.fillStyle = `#${br.lbColor.toString(16).padStart(6, "0")}`;
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
                br.pValue = ctx.createPattern(canvas, "repeat");
                break;
            }
        case BS.PATTERN:
        case BS.DIBPATTERN:
        case BS.DIBPATTERNPT:
        case BS.DIBPATTERN8X8:
        case BS.PATTERN8X8:
            break;
        default:
            throw new Error(`GreRealiseBrush: unknown brush style ${br.lbStyle}`);
    }

    dc.pCtx.fillStyle = br.pValue!;
}