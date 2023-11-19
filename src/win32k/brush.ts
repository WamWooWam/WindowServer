import { COLOR } from "../types/user32.types.js";
import { HBRUSH } from "../types/gdi32.types.js";
import { NtGdiCreateSolidBrush } from "./gdi/ntgdi.js";

const SYS_COLORS = [
    0xc0c0c0, 0xa56e3a, 0x800000, 0x808080, 0xc0c0c0, 0xffffff,
    0x000000, 0x000000, 0x000000, 0xffffff, 0xc0c0c0, 0xc0c0c0,
    0x808080, 0x800000, 0xffffff, 0xc0c0c0, 0x808080, 0x808080,
    0x000000, 0xc0c0c0, 0xffffff, 0x000000, 0xc0c0c0, 0x000000,
    0xe1ffff, 0x000000, 0x800000, 0xd08410, 0xb5b5b5, 0x800000,
    0xc0c0c0
];

export function IntGetSysColor(nIndex: COLOR): number {
    // Windows Classic Theme colours
    return SYS_COLORS[nIndex];
}

export function IntGetSysColorBrush(nIndex: COLOR): HBRUSH {
    let color = IntGetSysColor(nIndex);
    return NtGdiCreateSolidBrush(color);
}