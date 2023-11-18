import { HANDLE } from "./types.js";

export const GDI32 = {
    // RGN
    CreateRectRgn: 0x00000001,
    CombineRgn: 0x00000002,

    // DC
    FillRgn: 0x00000003,
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
    DIBPATTERN8X8 = 8,
    _MONOPATTERN = 9
}

export enum HS {
    HORIZONTAL = 0,
    VERTICAL = 1,
    FDIAGONAL = 2,
    BDIAGONAL = 3,
    CROSS = 4,
    DIAGCROSS = 5
}