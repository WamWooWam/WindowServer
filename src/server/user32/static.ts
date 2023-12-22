import { DRAWITEMSTRUCT, HT, HWND, LPARAM, LRESULT, ODA, ODS, ODT, SS, WM, WPARAM, WMP } from "../user32.js";
import { NtDispatchMessage, NtPostMessage } from "../../win32k/msg.js";
import { NtUserGetDC, NtUserIsWindowEnabled } from "../../win32k/window.js";

import { ObGetObject } from "../../objects.js";
import { StaticElement } from "../../win32k/html/StaticElement.js";
import WND from "../../win32k/wnd.js";

export async function StaticWndProc(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    let wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        console.error("StaticWndProc: Invalid window handle");
        return -1;
    }

    let element = wnd.pRootElement as StaticElement;

    switch (uMsg) {
        case WMP.CREATEELEMENT: {
            wnd.pRootElement = new StaticElement(wnd);
            return 0;
        }
        case WM.SETTEXT: {
            element.innerText = <string>lParam;
            return 0;
        }
        case WM.GETTEXT: {
            return element.innerText;
        }
        case WM.GETTEXTLENGTH: {
            return element.innerText.length;
        }
        // TODO: implement
        case WM.CREATE: {
            return 0;
        }
        case WM.SETFONT: {
            return 0;
        }
        case WM.GETFONT: {
            return 0;
        }
        case WM.PAINT: {
            if ((wnd.dwStyle & SS.TYPEMASK) == SS.OWNERDRAW) {
                // tell the parent to draw this control
                const struct: DRAWITEMSTRUCT = {
                    CtlType: ODT.STATIC,
                    CtlID: wnd.hMenu, // TODO: this should be accessed via GetWindowLongPtr
                    itemID: 0,
                    itemAction: ODA.DRAWENTIRE,
                    itemState: NtUserIsWindowEnabled(hWnd) ? 0 : ODS.DISABLED,
                    hwndItem: hWnd,
                    hDC: NtUserGetDC(wnd.peb, hWnd),
                    rcItem: { left: 0, top: 0, right: 0, bottom: 0 },
                    itemData: 0
                };

                await NtDispatchMessage(null, [wnd.hParent, WM.DRAWITEM, wnd.hWnd, struct]);
            }
            else {
            }
        }

        case WM.NCHITTEST:
            return HT.CLIENT;
        default:
            return 0;
    }

}
