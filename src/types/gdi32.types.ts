import { HANDLE } from "./types.js";

export const GDI32 = {
    CreateRectRgn: 0x00000001,
    CombineRgn: 0x00000002,
    FillRgn: 0x00000003,
    DeleteObject: 0x00000004,
    SelectObject: 0x00000005,
    CreateSolidBrush: 0x00000006,
    CreatePen: 0x00000007,
    TextOut: 0x00000008,
    SetTextColor: 0x00000009,
}

export type RECT = {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export type POINT = {
    x: number;
    y: number;
}

export type SIZE = {
    cx: number;
    cy: number;
}

export type HDC = HANDLE;
export type HFONT = HANDLE;
export type HBRUSH = HANDLE;
export type HBITMAP = HANDLE;
export type HRGN = HANDLE;

export enum RGN {
    AND = 1,
    OR = 2,
    XOR = 3,
    DIFF = 4,
    COPY = 5
}

export enum PS {
    SOLID = 0,
    DASH = 1,
    DOT = 2,
    DASHDOT = 3,
    DASHDOTDOT = 4,
    NULL = 5,
    INSIDEFRAME = 6
}

export const WHITE_BRUSH = 0;
export const LTGRAY_BRUSH = 1;
export const GRAY_BRUSH = 2;
export const DKGRAY_BRUSH = 3;
export const BLACK_BRUSH = 4;
export const NULL_BRUSH = 5;
export const HOLLOW_BRUSH = NULL_BRUSH;
export const WHITE_PEN = 6;
export const BLACK_PEN = 7;
export const NULL_PEN = 8;
export const OEM_FIXED_FONT = 10;
export const ANSI_FIXED_FONT = 11;
export const ANSI_VAR_FONT = 12;
export const SYSTEM_FONT = 13;
export const DEVICE_DEFAULT_FONT = 14;
export const DEFAULT_PALETTE = 15;
export const SYSTEM_FIXED_FONT = 16;
export const DEFAULT_GUI_FONT = 17;
export const DC_BRUSH = 18;
export const DC_PEN = 19;

export enum BS {
    SOLID = 0,
    NULL = 1,
    HATCHED = 2,
    PATTERN = 3,
    DIBPATTERN = 5,
    DIBPATTERNPT = 6,
    PATTERN8X8 = 7,
    DIBPATTERN8X8 = 8
}

export enum HS {
    HORIZONTAL = 0,
    VERTICAL = 1,
    FDIAGONAL = 2,
    BDIAGONAL = 3,
    CROSS = 4,
    DIAGCROSS = 5
}

export enum FW {
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

export const TRANSPARENT = 1;
export const OPAQUE = 2;

export const DEFAULT_CHARSET = 1;
export const NONANTIALIASED_QUALITY = 3;

export function InflateRect(rect: RECT, x: number, y: number) {
    rect.left -= x;
    rect.top -= y;
    rect.right += x;
    rect.bottom += y;
}

export function OffsetRect(rect: RECT, x: number, y: number) {
    rect.left += x;
    rect.top += y;
    rect.right += x;
    rect.bottom += y;
}

export function INRECT(x: number, y: number, rect: RECT): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}