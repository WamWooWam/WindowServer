import Message from "../types/Message.js";
import USER32 from "../types/user32.types.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";
import { NtRegisterSubsystem } from "./ntdll.js";

const [User32_SendMessage, User32_PostMessage] = await NtRegisterSubsystem(SUBSYS_USER32, User32_HandleMessage);

function User32_HandleMessage(msg: Message) {

}

export const MB_OK = 0x00000000;
export const MB_OKCANCEL = 0x00000001;
export const MB_ABORTRETRYIGNORE = 0x00000002;
export const MB_YESNOCANCEL = 0x00000003;
export const MB_YESNO = 0x00000004;
export const MB_RETRYCANCEL = 0x00000005;
export const MB_CANCELTRYCONTINUE = 0x00000006;
export const MB_ICONHAND = 0x00000010;
export const MB_ICONQUESTION = 0x00000020;
export const MB_ICONEXCLAMATION = 0x00000030;
export const MB_ICONASTERISK = 0x00000040;
export const MB_USERICON = 0x00000080;
export const MB_ICONWARNING = MB_ICONEXCLAMATION;
export const MB_ICONERROR = MB_ICONHAND;
export const MB_ICONINFORMATION = MB_ICONASTERISK;
export const MB_ICONSTOP = MB_ICONHAND;
export const MB_DEFBUTTON1 = 0x00000000;
export const MB_DEFBUTTON2 = 0x00000100;
export const MB_DEFBUTTON3 = 0x00000200;
export const MB_DEFBUTTON4 = 0x00000300;

export type HELPINFO = {
    cbSize: number;
    iContextType: number;
    iCtrlId: number;
    hItemHandle: number;
    dwContextId: number;
    x: number;
    y: number;
}

export type MSGBOXCALLBACK = (lpHelpInfo: HELPINFO) => number;

export interface MSGBOXPARAMS {
    hwndOwner: number;
    hInstance: number;
    lpszText: string;
    lpszCaption: string;
    dwStyle: number;
    lpszIcon: number;
    dwContextHelpId: number;
    lpfnMsgBoxCallback: MSGBOXCALLBACK | null; // TODO: marshal callbacks
    dwLanguageId: number;
}

export async function MessageBox(
    hWnd: number,
    lpText: string,
    lpCaption: string,
    uType: number
): Promise<number> {
    return MessageBoxEx(hWnd, lpText, lpCaption, uType, 0);
}

export async function MessageBoxEx(
    hWnd: number,
    lpText: string,
    lpCaption: string,
    uType: number,
    wLanguageId: number
): Promise<number> {
    const params = {
        hwndOwner: hWnd,
        hInstance: 0,
        lpszText: lpText,
        lpszCaption: lpCaption,
        dwStyle: uType,
        lpszIcon: 0,
        dwContextHelpId: 0,
        lpfnMsgBoxCallback: null as MSGBOXCALLBACK,
        dwLanguageId: wLanguageId
    };

    return MessageBoxIndirect(params);
}

export async function MessageBoxIndirect(
    lpMsgBoxParams: MSGBOXPARAMS
): Promise<number> {
    return 0;
}