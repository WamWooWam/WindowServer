import { NtCreateDirectory, NtRootPath } from "../file.js";

import { PEB } from "../types/types.js";
import SHELL32 from "../types/shell32.types.js";

async function SHCreateDirectoryEx(peb: PEB, data: {
    hwnd: number,
    pszPath: string,
    psa: number
}): Promise<number> {
    const rootedPath = NtRootPath(peb.hProcess, data.pszPath);
    const split = rootedPath.split("\\");
    let path = "";
    for (let i = 0; i < split.length; i++) {
        path += split[i] + "\\";
        await NtCreateDirectory(peb, path, data.psa);
    }
    
    return 0;
}

const SHELL32_EXPORTS = {
   [SHELL32.SHCreateDirectoryEx]: SHCreateDirectoryEx
};

export default SHELL32_EXPORTS;