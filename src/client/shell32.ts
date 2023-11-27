import { SH_CREATE_DIRECTORY_EX, SH_CREATE_DIRECTORY_EX_REPLY } from "../types/shell32.int.types.js";

import Executable from "../types/Executable.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import SHELL32 from "../types/shell32.types.js";
import { SUBSYS_SHELL32 } from "../types/subsystems.js";

export * from "../types/shell32.types.js";

const Shell32 = await NtRegisterSubsystem(SUBSYS_SHELL32, Shell32_HandleMessage);

function Shell32_HandleMessage(msg: Message) {

}

// TOOD: this should really be client-side
/**
 * Creates a new file system folder with the specified attributes.
 * @deprecated This function is available through Windows XP with Service Pack 2 (SP2) and Windows Server 2003. It might be altered or unavailable in subsequent versions of Windows.
 * @param hwnd A handle to the parent window. This parameter can be set to null if no user interface will be displayed.
 * @param pszPath A string specifying the fully qualified path of the directory. This string is of maximum length of 248 characters.
 * @param psa A pointer to a SECURITY_ATTRIBUTES structure with the directory's security attribute. Set this parameter to NULL if no security attributes need to be set.
 * @returns Returns ERROR_SUCCESS if successful, or an error value otherwise.
 * @async
 * @category Shell32
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedirectoryexa}
*/
export async function SHCreateDirectoryEx(
    hwnd: number,
    pszPath: string,
    psa: number
): Promise<number> {
    const msg = await Shell32.SendMessage<SH_CREATE_DIRECTORY_EX, SH_CREATE_DIRECTORY_EX_REPLY>({
        nType: SHELL32.SHCreateDirectoryEx,
        data: {
            hwnd: hwnd,
            pszPath: pszPath,
            psa: psa
        }
    });

    return msg.data.retVal;
}

const shell32: Executable = {
    file: "shell32.js",
    type: "dll",
    subsystem: "console",
    arch: "js",
    entryPoint: null,
    dependencies: ["ntdll.js", "kernel32.js", "user32.js"],

    name: "shell32",
    version: [1, 0, 0, 0],
    rsrc: {}
};

export default shell32;