export function ROUND(x: number) {
    // With a bitwise or.
    let rounded = (0.5 + x) | 0;
    // A double bitwise not.
    rounded = ~~(0.5 + x);
    // Finally, a left bitwise shift.
    rounded = (0.5 + x) << 0;

    return rounded;
}

export * from "./gdi32.types"

const GDI32 = {
    CreateRectRgn: 0x00000001,
    CombineRgn: 0x00000002,
    FillRgn: 0x00000003,
    DeleteObject: 0x00000004,
    SelectObject: 0x00000005,
    CreateSolidBrush: 0x00000006,
    CreatePen: 0x00000007,
    TextOut: 0x00000008,
    SetTextColor: 0x00000009,
    Rectangle: 0x0000000A,
    GetDeviceCaps: 0x0000000B,
    CreateFontIndirect: 0x0000000C
}

export default GDI32;