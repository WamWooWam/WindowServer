import { CW_USEDEFAULT, GetDC, GetSystemMetrics, HINSTANCE, SM, SendMessage, WM } from "@window-server/user32";
import { CreateFontIndirect, DEFAULT_CHARSET, DeleteObject, FW, GetDeviceCaps, LOGFONT, LOGPIXELSY, SetRect } from "@window-server/gdi32";

import Globals from "./globals.js";
import { MulDiv } from "@window-server/kernel32";

export function InitData(hInstance: HINSTANCE) {

}

export async function LoadSettingsFromRegistry() {
    let cxScreen = GetSystemMetrics(SM.CXSCREEN), cyScreen = GetSystemMetrics(SM.CYSCREEN);;
    let dwPointSize = 10;

    Globals.bShowStatusBar = true;
    Globals.bWrapLongLines = false;

    SetRect(Globals.lMargins, 750, 1000, 750, 1000);

    Globals.lfFont = {
        lfCharSet: DEFAULT_CHARSET,
        lfWeight: FW.NORMAL,
    } as LOGFONT;

    Globals.mainRect.left = CW_USEDEFAULT;
    Globals.mainRect.top = CW_USEDEFAULT;

    let cx = Math.min(cxScreen * 3 / 4, 640);
    let cy = Math.min(cyScreen * 3 / 4, 480);

    // RegOpenKeyEx(HKEY_CURRENT_USER, s_szRegistryKey, 0, KEY_QUERY_VALUE, &hKey);
    // if (hKey)
    // {
    //     TODO: read settings from registry
    //     RegCloseKey(hKey);
    // }

    let dc = await GetDC(0);

    Globals.lfFont.lfHeight = MulDiv(dwPointSize, await GetDeviceCaps(dc, LOGPIXELSY), 72);
    Globals.mainRect.right = Globals.mainRect.left + cx;
    Globals.mainRect.bottom = Globals.mainRect.top + cy;

    Globals.lfFont.lfFaceName = "Courier New";
    Globals.szHeader = "&f";
    Globals.szFooter = "Page &p";

    let hFont = await CreateFontIndirect(Globals.lfFont);
    await SendMessage(Globals.hEdit, WM.SETFONT, hFont, 1);
    if (hFont) {
        if (Globals.hFont)
            await DeleteObject(Globals.hFont);
        Globals.hFont = hFont;
    }
}
