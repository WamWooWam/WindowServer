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

/**
 * @module gdi32
 * @description GDI Client Library
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/gdi/windows-gdi}
 * @usermode
 */

declare function DllMain(): Promise<void>;
/**
 * The GetStockObject function retrieves a handle to one of the stock pens, brushes, fonts, or palettes.
 * @param nIndex The type of stock object.
 * @returns If the function succeeds, the return value is the handle to the requested logical object.
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getstockobject}
 * @category GDI32
 * @example
 * const hBrush = await GetStockObject(WHITE_BRUSH);
 */
declare function GetStockObject(nIndex: number): HANDLE;
/**
 * The CreateRectRgn function creates a rectangular region.
 * @param x1 The coordinates of the upper-left corner of the region in logical units.
 * @param y1 The coordinates of the upper-left corner of the region in logical units.
 * @param x2 the coordinates of the lower-right corner of the region in logical units.
 * @param y2 the coordinates of the lower-right corner of the region in logical units.
 * @returns The return value identifies the region in the calling process's region list.
 */
declare function CreateRectRgn(x1: number, y1: number, x2: number, y2: number): Promise<HRGN>;
/**
 * The CombineRgn function combines two regions and stores the result in a third region. The two regions are combined according to the specified mode.
 * @param hrgnDest A handle to a new region with dimensions defined by combining two other regions. (This region must exist before CombineRgn is called.)
 * @param hrgnSrc1 A handle to the first of two regions to be combined.
 * @param hrgnSrc2 A handle to the second of two regions to be combined.
 * @param fnCombineMode A mode indicating how the two regions will be combined.
 * @returns The return value specifies the type of the resulting region.
 */
declare function CombineRgn(hrgnDest: HRGN, hrgnSrc1: HRGN, hrgnSrc2: HRGN, fnCombineMode: number): Promise<number>;
/**
 * The FillRgn function fills a region by using the specified brush.
 * @param hDC Handle to the device context.
 * @param hrgn Handle to the region to be filled. The region's coordinates are assumed to be device coordinates.
 * @returns If the function succeeds, the return value is nonzero.
 */
declare function FillRgn(hDC: HDC, hrgn: HRGN): Promise<boolean>;
declare function DeleteObject(hObject: HANDLE): Promise<boolean>;
declare function SelectObject(hDC: HANDLE, hObject: HANDLE): Promise<HANDLE>;
declare function CreateSolidBrush(crColor: number): Promise<HANDLE>;
declare function CreatePen(iStyle: number, cWidth: number, crColor: number): Promise<HANDLE>;
declare function TextOut(hDC: HANDLE, x: number, y: number, text: string): Promise<boolean>;
declare function SetTextColor(hDC: HANDLE, crColor: number): Promise<number>;
declare function Rectangle(hDC: HANDLE, left: number, top: number, right: number, bottom: number): Promise<boolean>;
declare function GetDeviceCaps(hDC: HANDLE, nIndex: number): Promise<number>;
declare function CreateFontIndirect(lf: LOGFONT): Promise<HANDLE>;
declare const gdi32: {
    file: string;
    type: string;
    subsystem: string;
    arch: string;
    entryPoint: typeof DllMain;
    dependencies: string[];
    name: string;
    version: number[];
    rsrc: {};
};

export { ANSI_FIXED_FONT, ANSI_VAR_FONT, BLACK_BRUSH, BLACK_PEN, BS, CombineRgn, CreateFontIndirect, CreatePen, CreateRectRgn, CreateSolidBrush, DC_BRUSH, DC_PEN, DEFAULT_CHARSET, DEFAULT_GUI_FONT, DEFAULT_PALETTE, DEVICE_DEFAULT_FONT, DKGRAY_BRUSH, DeleteObject, FW, FillRgn, GRAY_BRUSH, GetDeviceCaps, GetStockObject, type HBITMAP, type HBRUSH, type HDC, type HFONT, HOLLOW_BRUSH, type HRGN, HS, INRECT, InflateRect, IntersectRect, type LOGFONT, LOGPIXELSX, LOGPIXELSY, type LPPOINT, type LPRECT, type LPSIZE, LTGRAY_BRUSH, NONANTIALIASED_QUALITY, NULL_BRUSH, NULL_PEN, OEM_FIXED_FONT, OPAQUE, OffsetRect, type POINT, PS, type RECT, RGN, Rectangle, type SIZE, SYSTEM_FIXED_FONT, SYSTEM_FONT, SelectObject, SetRect, SetTextColor, TRANSPARENT, TextOut, WHITE_BRUSH, WHITE_PEN, gdi32 as default };
//# sourceMappingURL=gdi32.d.ts.map
