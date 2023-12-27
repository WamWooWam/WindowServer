import { HANDLE } from 'ntdll';

type RECT = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
type LPRECT = RECT | null;
type POINT = {
    x: number;
    y: number;
};
type LPPOINT = POINT | null;
type SIZE = {
    cx: number;
    cy: number;
};
type LPSIZE = SIZE | null;
interface LOGFONT {
    lfHeight: number;
    lfWidth: number;
    lfEscapement: number;
    lfOrientation: number;
    lfWeight: number;
    lfItalic: number;
    lfUnderline: number;
    lfStrikeOut: number;
    lfCharSet: number;
    lfOutPrecision: number;
    lfClipPrecision: number;
    lfQuality: number;
    lfPitchAndFamily: number;
    lfFaceName: string;
}
type HDC = HANDLE;
type HFONT = HANDLE;
type HBRUSH = HANDLE;
type HBITMAP = HANDLE;
type HRGN = HANDLE;
declare enum RGN {
    AND = 1,
    OR = 2,
    XOR = 3,
    DIFF = 4,
    COPY = 5
}
declare enum PS {
    SOLID = 0,
    DASH = 1,
    DOT = 2,
    DASHDOT = 3,
    DASHDOTDOT = 4,
    NULL = 5,
    INSIDEFRAME = 6
}
declare const WHITE_BRUSH = 0;
declare const LTGRAY_BRUSH = 1;
declare const GRAY_BRUSH = 2;
declare const DKGRAY_BRUSH = 3;
declare const BLACK_BRUSH = 4;
declare const NULL_BRUSH = 5;
declare const HOLLOW_BRUSH = 5;
declare const WHITE_PEN = 6;
declare const BLACK_PEN = 7;
declare const NULL_PEN = 8;
declare const OEM_FIXED_FONT = 10;
declare const ANSI_FIXED_FONT = 11;
declare const ANSI_VAR_FONT = 12;
declare const SYSTEM_FONT = 13;
declare const DEVICE_DEFAULT_FONT = 14;
declare const DEFAULT_PALETTE = 15;
declare const SYSTEM_FIXED_FONT = 16;
declare const DEFAULT_GUI_FONT = 17;
declare const DC_BRUSH = 18;
declare const DC_PEN = 19;
declare enum BS {
    SOLID = 0,
    NULL = 1,
    HATCHED = 2,
    PATTERN = 3,
    DIBPATTERN = 5,
    DIBPATTERNPT = 6,
    PATTERN8X8 = 7,
    DIBPATTERN8X8 = 8
}
declare enum HS {
    HORIZONTAL = 0,
    VERTICAL = 1,
    FDIAGONAL = 2,
    BDIAGONAL = 3,
    CROSS = 4,
    DIAGCROSS = 5
}
declare enum FW {
    DONTCARE = 0,
    THIN = 100,
    EXTRALIGHT = 200,
    LIGHT = 300,
    NORMAL = 400,
    MEDIUM = 500,
    SEMIBOLD = 600,
    BOLD = 700,
    EXTRABOLD = 800,
    HEAVY = 900
}
declare const LOGPIXELSY = 90;
declare const LOGPIXELSX = 88;
declare const TRANSPARENT = 1;
declare const OPAQUE = 2;
declare const DEFAULT_CHARSET = 1;
declare const NONANTIALIASED_QUALITY = 3;
declare function InflateRect(rect: RECT, x: number, y: number): void;
declare function OffsetRect(rect: RECT, x: number, y: number): void;
declare function IntersectRect(dst: RECT, src1: RECT, src2: RECT): boolean;
declare function INRECT(x: number, y: number, rect: RECT): boolean;
declare function SetRect(rect: RECT, left: number, top: number, right: number, bottom: number): void;

declare function ROUND(x: number): number;

declare const GDI32: {
    CreateRectRgn: number;
    CombineRgn: number;
    FillRgn: number;
    DeleteObject: number;
    SelectObject: number;
    CreateSolidBrush: number;
    CreatePen: number;
    TextOut: number;
    SetTextColor: number;
    Rectangle: number;
    GetDeviceCaps: number;
    CreateFontIndirect: number;
};

export { ANSI_FIXED_FONT, ANSI_VAR_FONT, BLACK_BRUSH, BLACK_PEN, BS, DC_BRUSH, DC_PEN, DEFAULT_CHARSET, DEFAULT_GUI_FONT, DEFAULT_PALETTE, DEVICE_DEFAULT_FONT, DKGRAY_BRUSH, FW, GRAY_BRUSH, type HBITMAP, type HBRUSH, type HDC, type HFONT, HOLLOW_BRUSH, type HRGN, HS, INRECT, InflateRect, IntersectRect, type LOGFONT, LOGPIXELSX, LOGPIXELSY, type LPPOINT, type LPRECT, type LPSIZE, LTGRAY_BRUSH, NONANTIALIASED_QUALITY, NULL_BRUSH, NULL_PEN, OEM_FIXED_FONT, OPAQUE, OffsetRect, type POINT, PS, type RECT, RGN, ROUND, type SIZE, SYSTEM_FIXED_FONT, SYSTEM_FONT, SetRect, TRANSPARENT, WHITE_BRUSH, WHITE_PEN, GDI32 as default };
//# sourceMappingURL=gdi32.int.d.ts.map
