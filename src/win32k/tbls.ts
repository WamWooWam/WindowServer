import { COLOR } from "../types/user32.types.js";

export const LTInnerNormal = [
    -1,           -1,                 -1,                 -1,
    -1,           COLOR.BTNHIGHLIGHT, COLOR.BTNHIGHLIGHT, -1,
    -1,           COLOR.DKSHADOW3D,   COLOR.DKSHADOW3D,   -1,
    -1,           -1,                 -1,                 -1
];

export const LTOuterNormal= [
    -1,                 COLOR.LIGHT3D,     COLOR.BTNSHADOW, -1,
    COLOR.BTNHIGHLIGHT, COLOR.LIGHT3D,     COLOR.BTNSHADOW, -1,
    COLOR.DKSHADOW3D,   COLOR.LIGHT3D,     COLOR.BTNSHADOW, -1,
    -1,                 COLOR.LIGHT3D,     COLOR.BTNSHADOW, -1
];

export const RBInnerNormal= [
    -1,           -1,                -1,              -1,
    -1,           COLOR.BTNSHADOW,   COLOR.BTNSHADOW, -1,
    -1,           COLOR.LIGHT3D,     COLOR.LIGHT3D,   -1,
    -1,           -1,                -1,              -1
];

export const RBOuterNormal= [
    -1,              COLOR.DKSHADOW3D,  COLOR.BTNHIGHLIGHT, -1,
    COLOR.BTNSHADOW, COLOR.DKSHADOW3D,  COLOR.BTNHIGHLIGHT, -1,
    COLOR.LIGHT3D,   COLOR.DKSHADOW3D,  COLOR.BTNHIGHLIGHT, -1,
    -1,              COLOR.DKSHADOW3D,  COLOR.BTNHIGHLIGHT, -1
];

export const LTInnerSoft= [
    -1,                  -1,                -1,              -1,
    -1,                  COLOR.LIGHT3D,     COLOR.LIGHT3D,   -1,
    -1,                  COLOR.BTNSHADOW,   COLOR.BTNSHADOW, -1,
    -1,                  -1,                -1,              -1
];

export const LTOuterSoft= [
    -1,              COLOR.BTNHIGHLIGHT, COLOR.DKSHADOW3D, -1,
    COLOR.LIGHT3D,   COLOR.BTNHIGHLIGHT, COLOR.DKSHADOW3D, -1,
    COLOR.BTNSHADOW, COLOR.BTNHIGHLIGHT, COLOR.DKSHADOW3D, -1,
    -1,              COLOR.BTNHIGHLIGHT, COLOR.DKSHADOW3D, -1
];

export const RBInnerSoft = [...RBInnerNormal];   /* These are the same */
export const RBOuterSoft = [...RBOuterNormal];

export const LTRBOuterMono= [
    -1,           COLOR.WINDOWFRAME, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME,
    COLOR.WINDOW, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME,
    COLOR.WINDOW, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME,
    COLOR.WINDOW, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME, COLOR.WINDOWFRAME,
];

export const LTRBInnerMono= [
    -1, -1,           -1,           -1,
    -1, COLOR.WINDOW, COLOR.WINDOW, COLOR.WINDOW,
    -1, COLOR.WINDOW, COLOR.WINDOW, COLOR.WINDOW,
    -1, COLOR.WINDOW, COLOR.WINDOW, COLOR.WINDOW,
];

export const LTRBOuterFlat= [
    -1,                COLOR.BTNSHADOW, COLOR.BTNSHADOW, COLOR.BTNSHADOW,
    COLOR.BTNFACE,     COLOR.BTNSHADOW, COLOR.BTNSHADOW, COLOR.BTNSHADOW,
    COLOR.BTNFACE,     COLOR.BTNSHADOW, COLOR.BTNSHADOW, COLOR.BTNSHADOW,
    COLOR.BTNFACE,     COLOR.BTNSHADOW, COLOR.BTNSHADOW, COLOR.BTNSHADOW,
];

export const LTRBInnerFlat= [
    -1, -1,              -1,              -1,
    -1, COLOR.BTNFACE,     COLOR.BTNFACE,     COLOR.BTNFACE,
    -1, COLOR.BTNFACE,     COLOR.BTNFACE,     COLOR.BTNFACE,
    -1, COLOR.BTNFACE,     COLOR.BTNFACE,     COLOR.BTNFACE,
];