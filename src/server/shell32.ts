import { NtCreateDirectory, NtRootPath } from "../file.js";
import { PEB, SUBSYSTEM_DEF } from "../types/types.js";
import { SH_CREATE_DIRECTORY_EX, SH_CREATE_DIRECTORY_EX_REPLY } from "../types/shell32.int.types.js";

import SHELL32 from "../types/shell32.types.js";
import { SUBSYS_SHELL32 } from "../types/subsystems.js";

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

const SHELL32_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_SHELL32,
    lpExports: {
        [SHELL32.SHCreateDirectoryEx]: SHCreateDirectoryEx
    }
};

export default SHELL32_SUBSYSTEM;