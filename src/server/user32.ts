import USER32 from "../types/user32.types.js";
import { PEB } from "../types/types.js";

export async function MessageBoxEx(peb: PEB, data: {
    hWnd: number,
    lpText: string,
    lpCaption: string,
    uType: number,
    wLanguageId: number
}): Promise<number> {
    return 0;
}

const USER32_EXPORTS = {
   [USER32.MessageBoxEx]: MessageBoxEx
};

export default USER32_EXPORTS;