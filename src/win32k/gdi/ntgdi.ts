import { GreCombineRgn, GreCreateRectRgn, GreCreateRgn } from "./rgn.js";
import { RGN_AND, RGN_DIFF, RGN_OR, RGN_XOR } from "../../types/gdi32.types.js";

import { GreAllocDCForMonitor } from "./dc.js";
import { GreFillRegion as GreFillRgn } from "./draw.js";
import { NtGetPrimaryMonitor } from "../monitor.js";

export function GreInit() {
    const monitor = NtGetPrimaryMonitor();
    const desktopDC = GreAllocDCForMonitor(monitor.hMonitor);

    // const rgn1 = GreCreateRectRgn({ left: 0, top: 0, right: 100, bottom: 100 });
    // const rgn2 = GreCreateRectRgn({ left: 50, top: 50, right: 150, bottom: 150 });
    // const intersect = GreCreateRgn();
    // GreCombineRgn(intersect, rgn1, rgn2, RGN_XOR);

    // console.debug(`rgn1 = %O`, rgn1);
    // console.debug(`rgn2 = %O`, rgn2);
    // console.debug(`intersect = %O`, intersect);

    // GreFillRgn(desktopDC, intersect);

    // console.debug(`desktopDC = ${desktopDC}`);    
}