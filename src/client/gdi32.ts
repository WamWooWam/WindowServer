/**
 * @module gdi32
 * @description GDI Client Library
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/gdi/windows-gdi}
 * @usermode
 */

import { GDI32, HRGN } from "../types/gdi32.types.js";

import { HANDLE } from "../types/types.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_GDI32 } from "../types/subsystems.js";

export * from "../types/gdi32.types.js";

const Gdi32 = await NtRegisterSubsystem(SUBSYS_GDI32, () => { });

/**
 * The GetStockObject function retrieves a handle to one of the stock pens, brushes, fonts, or palettes.
 * @param nIndex The type of stock object.
 * @returns If the function succeeds, the return value is the handle to the requested logical object.
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getstockobject}
 * @category GDI32
 * @example
 * const hBrush = await GetStockObject(WHITE_BRUSH);
 */
export function GetStockObject(nIndex: number): HANDLE {
    return 0x80000000 + nIndex;
}

/**
 * The CreateRectRgn function creates a rectangular region.
 * @param x1 The coordinates of the upper-left corner of the region in logical units.
 * @param y1 The coordinates of the upper-left corner of the region in logical units.
 * @param x2 the coordinates of the lower-right corner of the region in logical units.
 * @param y2 the coordinates of the lower-right corner of the region in logical units.
 * @returns The return value identifies the region in the calling process's region list.
 */
export async function CreateRectRgn(x1: number, y1: number, x2: number, y2: number): Promise<HRGN> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CreateRectRgn,
        data: { x1, y1, x2, y2 }
    })).data;
}

/**
 * The CombineRgn function combines two regions and stores the result in a third region. The two regions are combined according to the specified mode.
 * @param hrgnDest A handle to a new region with dimensions defined by combining two other regions. (This region must exist before CombineRgn is called.)
 * @param hrgnSrc1 A handle to the first of two regions to be combined.
 * @param hrgnSrc2 A handle to the second of two regions to be combined.
 * @param fnCombineMode A mode indicating how the two regions will be combined.
 * @returns The return value specifies the type of the resulting region. 
 */
export async function CombineRgn(hrgnDest: HRGN, hrgnSrc1: HRGN, hrgnSrc2: HRGN, fnCombineMode: number): Promise<number> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CombineRgn,
        data: { hrgnDest, hrgnSrc1, hrgnSrc2, fnCombineMode }
    })).data as number;
}

/**
 * The FillRgn function fills a region by using the specified brush.
 * @param hDC Handle to the device context.
 * @param hrgn Handle to the region to be filled. The region's coordinates are assumed to be device coordinates.
 * @returns If the function succeeds, the return value is nonzero.
 */
export async function FillRgn(hDC: number, hrgn: number): Promise<boolean> {
    return (await Gdi32.SendMessage({
        nType: GDI32.FillRgn,
        data: { hDC, hrgn }
    })).data as boolean;
}

export async function DeleteObject(hObject: HANDLE): Promise<boolean> {
    return (await Gdi32.SendMessage({
        nType: GDI32.DeleteObject,
        data: { hObject }
    })).data as boolean;
}

export async function SelectObject(hDC: HANDLE, hObject: HANDLE): Promise<HANDLE> {
    return (await Gdi32.SendMessage({
        nType: GDI32.SelectObject,
        data: { hDC, hObject }
    })).data as HANDLE;
}

export async function CreateSolidBrush(crColor: number): Promise<HANDLE> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CreateSolidBrush,
        data: { crColor }
    })).data as HANDLE;
}

export async function CreatePen(iStyle: number, cWidth: number, crColor: number): Promise<HANDLE> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CreatePen,
        data: { iStyle, cWidth, crColor }
    })).data as HANDLE;
}

export async function TextOut(hDC: HANDLE, x: number, y: number, text: string): Promise<boolean> {
    return (await Gdi32.SendMessage({
        nType: GDI32.TextOut,
        data: { hDC, x, y, text }
    })).data as boolean;
}

export async function SetTextColor(hDC: HANDLE, crColor: number): Promise<number> {
    return (await Gdi32.SendMessage({
        nType: GDI32.SetTextColor,
        data: { hDC, crColor }
    })).data as number;
}

export async function Rectangle(hDC: HANDLE, left: number, top: number, right: number, bottom: number): Promise<boolean> {
    return (await Gdi32.SendMessage({
        nType: GDI32.Rectangle,
        data: { hDC, left, top, right, bottom }
    })).data as boolean;
}