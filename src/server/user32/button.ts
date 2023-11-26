import { HWND, LPARAM, LRESULT, WM, WPARAM } from "../../types/user32.types.js";

import { NtDefWindowProc } from "../../win32k/def.js";
import { ObGetObject } from "../../objects.js";
import { WMP } from "../../types/user32.int.types.js";
import { WND } from "../../win32k/wnd.js";

export function ButtonWndProc(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    switch (uMsg) {
        case WMP.CREATEELEMENT:
            {
                const wnd = ObGetObject<WND>(hWnd);
                const pElement = document.createElement("button");
                pElement.innerText = wnd.lpszName;
                wnd.pRootElement = pElement;
                
                return 0;
            }
        default:
            return NtDefWindowProc(hWnd, uMsg, wParam, lParam);
    }
}