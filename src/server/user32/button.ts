import { BM, BN, BS, HIWORD, HT, HWND, LOWORD, LPARAM, LRESULT, MAKEWPARAM, VK, WM, WPARAM, WS } from "../../types/user32.types.js";
import { NtUserReleaseCapture, NtUserSetCapture } from "../../win32k/cursor.js";

import { ButtonElement } from "../../win32k/html/ButtonElement.js";
import { NtDefWindowProc } from "../../win32k/def.js";
import { NtDispatchMessage } from "../../win32k/msg.js";
import { NtUserGetClientRect } from "../../win32k/window.js";
import { ObGetObject } from "../../objects.js";
import { WMP } from "../../types/user32.int.types.js";
import WND from "../../win32k/wnd.js";

export async function ButtonWndProc(hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        console.error("ButtonWndProc: Invalid window handle");
        return -1;
    }
    
    const element = wnd.pRootElement as ButtonElement;
    switch (uMsg) {
        case WMP.CREATEELEMENT:
            {
                wnd.pRootElement = new ButtonElement(wnd);
                return 0;
            }
        case WM.LBUTTONDOWN:
            NtUserSetCapture(wnd.peb, hWnd);
            // NtUserSetFocus(wnd.peb, hWnd); // TODO
            element.pressState = true;
            await NtDispatchMessage(null, [hWnd, BM.SETSTATE, 1, 0]);
            return 0;
        case WM.KEYUP:
            if (wParam !== VK.SPACE)
                break;
        // fallthrough
        case WM.LBUTTONUP: {
            const state = element.pressState;
            if (!state)
                break;

            NtUserReleaseCapture(wnd.peb);
            element.pressState = false;
            await NtDispatchMessage(null, [hWnd, BM.SETSTATE, 0, 0]);

            const rcClient = NtUserGetClientRect(wnd.peb, hWnd);
            const point = { x: HIWORD(lParam), y: LOWORD(lParam) };
            console.log(point, rcClient);
            if ((point.x >= rcClient.left && point.x < rcClient.right &&
                point.y >= rcClient.top && point.y < rcClient.bottom) || uMsg === WM.KEYUP) {
                switch (wnd.dwStyle & BS.TYPEMASK) {
                    case BS.AUTOCHECKBOX: {
                        const checkState = element.checkState;
                        await NtDispatchMessage(null, [hWnd, BM.SETCHECK, checkState === 0 ? 1 : 0, 0]);
                        break;
                    }
                    case BS.AUTORADIOBUTTON: {
                        // TODO: uncheck other radio buttons in group
                        await NtDispatchMessage(null, [hWnd, BM.SETCHECK, 1, 0]);
                        break;
                    }
                    case BS.AUTO3STATE: {
                        await NtDispatchMessage(null, [hWnd, BM.SETCHECK, (element.checkState + 1) % 3, 0]);
                        break;
                    }
                }
            }

            await NtDispatchMessage(null, [wnd.hParent, WM.COMMAND, MAKEWPARAM(wnd.hMenu, BN.CLICKED), hWnd]);
            break;
        }
        case WM.NCHITTEST:
            return HT.CLIENT;
        case WM.SETTEXT:
            element.setText(<string>lParam);
            return 0;
        case WM.GETTEXT:
            return element.innerText;
        case WM.GETTEXTLENGTH:
            return element.innerText.length;
        case BM.GETCHECK:
            return element.checkState;
        case BM.SETCHECK:
            element.checkState = <number>wParam;
            return 0;
        case BM.GETSTATE:
            return element.pressState ? 1 : 0;
        case BM.SETSTATE:
            element.pressState = wParam === 1;
            return 0;

        default:
            return NtDefWindowProc(hWnd, uMsg, wParam, lParam);
    }

    return 0;
}
