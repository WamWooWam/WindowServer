import { NtCreateDirectory, NtRootPath } from "../file.js";
import SHELL32, {
    SH_CREATE_DIRECTORY_EX,
    SH_CREATE_DIRECTORY_EX_REPLY
} from "../types/shell32.types.js";

import { PEB } from "../types/types.js";

async function SHCreateDirectoryEx(peb: PEB, data: SH_CREATE_DIRECTORY_EX): Promise<SH_CREATE_DIRECTORY_EX_REPLY> {
    const rootedPath = NtRootPath(peb.hProcess, data.pszPath);
    const split = rootedPath.split("\\");
    let path = "";
    for (let i = 0; i < split.length; i++) {
        path += split[i] + "\\";
        await NtCreateDirectory(peb, path, data.psa);
    }

    return { retVal: 0 };
}

const SHELL32_EXPORTS = {
    [SHELL32.SHCreateDirectoryEx]: SHCreateDirectoryEx
};

export default SHELL32_EXPORTS;