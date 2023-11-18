import { CombineRgn, CreateRectRgn, FillRgn } from "./client/gdi32.js";
import { HDC, RGN_XOR } from "./types/gdi32.types.js";

import { GetDC } from "./client/user32.js";

async function main() {
    const hdc: HDC = await GetDC(null);
    console.log(hdc);

    const rgn1 = await CreateRectRgn(0, 0, 100, 100);
    const rgn2 = await CreateRectRgn(50, 50, 150, 150);

    console.log(rgn1);
    console.log(rgn2);

    const intersect = await CreateRectRgn(0, 0, 0, 0);
    console.log(intersect);

    await CombineRgn(intersect, rgn1, rgn2, RGN_XOR);
    console.log(intersect);

    await FillRgn(hdc, intersect);
}

export { main };