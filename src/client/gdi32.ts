import { GDI32, HRGN } from "../types/gdi32.types.js";

import { HANDLE } from "../types/types.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_GDI32 } from "../types/subsystems.js";

const Gdi32 = await NtRegisterSubsystem(SUBSYS_GDI32, () => { });

export function GetStockObject(nIndex: number): HANDLE {
    return 0x80000000 + nIndex;
}

export async function CreateRectRgn(x1: number, y1: number, x2: number, y2: number): Promise<HRGN> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CreateRectRgn,
        data: { x1, y1, x2, y2 }
    })).data;
}

export async function CombineRgn(hrgnDest: HRGN, hrgnSrc1: HRGN, hrgnSrc2: HRGN, fnCombineMode: number): Promise<number> {
    return (await Gdi32.SendMessage({
        nType: GDI32.CombineRgn,
        data: { hrgnDest, hrgnSrc1, hrgnSrc2, fnCombineMode }
    })).data as number;
}

export async function FillRgn(hDC: number, hrgn: number): Promise<boolean> {
    return (await Gdi32.SendMessage({
        nType: GDI32.FillRgn,
        data: { hDC, hrgn }
    })).data as boolean;
}