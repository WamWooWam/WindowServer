import DC from "./dc.js";
import { HDC } from "../../types/gdi32.types.js";
import { ObGetObject } from "../../objects.js";
import REGION from "./rgn.js";

function GreRegionToPath(rgn: REGION) {
    const path = new Path2D();
    const rects = rgn.rects;
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        path.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    }

    return path;
}

export function GreFillRegion(hDC: HDC, reg: REGION) {
    const dc = ObGetObject<DC>(hDC);
    const path = GreRegionToPath(reg);

    dc.pCtx.fill(path);    
}