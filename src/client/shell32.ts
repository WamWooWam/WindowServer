import Message from "../types/Message.js";
import SHELL32 from "../types/shell32.types.js";
import { SUBSYS_SHELL32 } from "../types/subsystems.js";
import { NtRegisterSubsystem } from "./ntdll.js";

const [Shell32_SendMessage, Shell32_PostMessage] = await NtRegisterSubsystem(SUBSYS_SHELL32, Shell32_HandleMessage);

function Shell32_HandleMessage(msg: Message) {

}

// TOOD: this should really be client-side
export async function SHCreateDirectoryEx(
    hwnd: number,
    pszPath: string,
    psa: number
): Promise<number> {
    const msg = await Shell32_SendMessage({
        type: SHELL32.SHCreateDirectoryEx,
        data: {
            hwnd: hwnd,
            pszPath: pszPath,
            psa: psa
        }
    });

    return msg.data.retVal;
}
