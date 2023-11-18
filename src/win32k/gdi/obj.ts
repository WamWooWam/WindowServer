import {
    ANSI_FIXED_FONT,
    ANSI_VAR_FONT,
    BLACK_BRUSH,
    BLACK_PEN,
    DC_BRUSH,
    DC_PEN,
    DEFAULT_GUI_FONT,
    DEFAULT_PALETTE,
    DEVICE_DEFAULT_FONT,
    DKGRAY_BRUSH,
    GRAY_BRUSH,
    HBRUSH,
    LTGRAY_BRUSH,
    NULL_BRUSH,
    NULL_PEN,
    OEM_FIXED_FONT,
    PS,
    SYSTEM_FIXED_FONT,
    SYSTEM_FONT,
    WHITE_BRUSH,
    WHITE_PEN
} from "../../types/gdi32.types.js";
import BRUSH, { GreCreateBrush, GreCreateSolidBrush } from "./brush.js";
import { ObGetObject, ObSetHandleOwner } from "../../objects.js";
import PEN, { GreCreatePen } from "./pen.js";

import FONT from "./font.js";
import { GDIOBJ } from "./ntgdi.js";
import { HANDLE } from "../../types/types.js";

const STOCK_HANDLE_BASE = 0x80000000;

const STOCK_OBJECTS = {
    [STOCK_HANDLE_BASE + WHITE_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + LTGRAY_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + GRAY_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + DKGRAY_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + BLACK_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + NULL_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + WHITE_PEN]: null as PEN,
    [STOCK_HANDLE_BASE + BLACK_PEN]: null as PEN,
    [STOCK_HANDLE_BASE + NULL_PEN]: null as PEN,
    [STOCK_HANDLE_BASE + OEM_FIXED_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + ANSI_FIXED_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + ANSI_VAR_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + SYSTEM_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + DEVICE_DEFAULT_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + DEFAULT_PALETTE]: null as GDIOBJ,
    [STOCK_HANDLE_BASE + SYSTEM_FIXED_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + DEFAULT_GUI_FONT]: null as FONT,
    [STOCK_HANDLE_BASE + DC_BRUSH]: null as BRUSH,
    [STOCK_HANDLE_BASE + DC_PEN]: null as PEN,
}

export function GreInitStockObjects() {
    function SetStockObject<T extends GDIOBJ>(i: number, obj: T) {
        STOCK_OBJECTS[(i + STOCK_HANDLE_BASE) as keyof typeof STOCK_OBJECTS] = obj;
    }

    SetStockObject(WHITE_BRUSH, GreCreateSolidBrush(0xffffff));
    SetStockObject(LTGRAY_BRUSH, GreCreateSolidBrush(0xc0c0c0));
    SetStockObject(GRAY_BRUSH, GreCreateSolidBrush(0x808080));
    SetStockObject(DKGRAY_BRUSH, GreCreateSolidBrush(0x404040));
    SetStockObject(BLACK_BRUSH, GreCreateSolidBrush(0x000000));
    SetStockObject(NULL_BRUSH, GreCreateBrush());

    SetStockObject(WHITE_PEN, GreCreatePen(PS.SOLID, 1, 0xffffff));
    SetStockObject(BLACK_PEN, GreCreatePen(PS.SOLID, 1, 0x000000));
    SetStockObject(NULL_PEN, GreCreatePen(PS.NULL, 1, 0x000000));

    SetStockObject(OEM_FIXED_FONT, null);
    SetStockObject(ANSI_FIXED_FONT, null);
    SetStockObject(ANSI_VAR_FONT, null);
    SetStockObject(SYSTEM_FONT, null);
    SetStockObject(DEVICE_DEFAULT_FONT, null);
    SetStockObject(DEFAULT_PALETTE, null);
    SetStockObject(SYSTEM_FIXED_FONT, null);
    SetStockObject(DEFAULT_GUI_FONT, null);

    SetStockObject(DC_BRUSH, GreCreateBrush());
    SetStockObject(DC_PEN, GreCreatePen(PS.NULL, 1, 0x000000));
}


export function GreGetStockObject<T>(nIndex: number): T {
    return GreGetObj<T>(0x80000000 + nIndex);
}

export function GreGetObj<T>(hObj: HANDLE): T {
    if (hObj in STOCK_OBJECTS) {
        return STOCK_OBJECTS[hObj as keyof typeof STOCK_OBJECTS] as T;
    }

    return ObGetObject<T>(hObj);
}