import SHELL32, {
    SH_CREATE_DIRECTORY_EX,
    SH_CREATE_DIRECTORY_EX_REPLY
} from "../types/shell32.types.js";

import Executable from "../types/Executable.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_SHELL32 } from "../types/subsystems.js";

const Shell32 = await NtRegisterSubsystem(SUBSYS_SHELL32, Shell32_HandleMessage);

function Shell32_HandleMessage(msg: Message) {

}

// TOOD: this should really be client-side
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