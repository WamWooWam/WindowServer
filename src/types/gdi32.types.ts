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

export const RGN_AND = 1;
export const RGN_OR = 2;
export const RGN_XOR = 3;
export const RGN_DIFF = 4;
export const RGN_COPY = 5;