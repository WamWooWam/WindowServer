import DC from "./dc.js";
import { GDIOBJ } from "./ntgdi.js";
import { LOGFONT } from "../../subsystems/gdi32.js";
import { ObCreateObject } from "../../objects.js";

export default interface FONT extends GDIOBJ {
    _type: "FONT";
    lpLogFont: LOGFONT;
}

export function GreRealiseFont(pDC: DC, pFnt: FONT) {
    pFnt = pFnt || pDC.pfntText;

    let text = `${pFnt.lpLogFont.lfHeight}px '${pFnt.lpLogFont.lfFaceName}'`;

    if (pFnt.lpLogFont.lfWeight > 400) {
        text = `bold ${text}`;
    }

    pDC.pCtx.font = text;
}

export function GreCreateFontIndirect(lf: LOGFONT): FONT {
    return ObCreateObject("FONT", (hObj) => ({
        _type: "FONT",
        _hObj: hObj,
        lpLogFont: { ...lf }
    }), 0, () => { });
}