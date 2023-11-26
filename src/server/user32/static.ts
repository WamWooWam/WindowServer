import { HT, HWND, LPARAM, LRESULT, WM, WPARAM } from "../../types/user32.types.js";

import { ObGetObject } from "../../objects.js";
import { StaticElement } from "../../win32k/html/StaticElement.js";
import { WMP } from "../../types/user32.int.types.js";
import { WND } from "../../win32k/wnd.js";

export function StaticWndProc(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): LRESULT {
    let wnd = ObGetObject<WND>(hWnd);
    let element = wnd.pRootElement as StaticElement;

    switch (uMsg) {
        case WMP.CREATEELEMENT: {
            element = new StaticElement();
            element.dwStyle = wnd.dwStyle.toString();
            element.dwExStyle = wnd.dwExStyle.toString();
            element.innerText = wnd.lpszName;
            wnd.pRootElement = element;

            return 0;
        }
        case WM.SETTEXT: {
            element.innerText = lParam;
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
        case WM.NCHITTEST:
            return HT.CLIENT;
        default:
            return 0;
    }

}
