import { HWND, LPARAM, LRESULT, SC, SW, WM, WPARAM, WS } from "../types/user32.types.js";
import { NtDestroyWindow, NtShowWindow } from "./window.js";
import { WMP, WND_DATA } from "../types/user32.int.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { NtSendMessage } from "./msg.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

async function NtDefWndHandleSysCommand(peb: PEB, wnd: WND, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (wParam & 0xFFF0) {
        case SC.MINIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW.MINIMIZE);
            return 0;
        case SC.MAXIMIZE:
            await NtShowWindow(peb, wnd.hWnd, SW.MAXIMIZE);
            return 0;
        case SC.RESTORE:
            await NtShowWindow(peb, wnd.hWnd, SW.RESTORE);
            return 0;
        case SC.CLOSE:
            return await NtSendMessage(peb, {
                hWnd: wnd.hWnd,
                message: WM.CLOSE,
                wParam: 0,
                lParam: 0
            });
    }

    return 0; // TODO
}

export async function NtDefWindowProc(peb: PEB, hWnd: HWND, Msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const state = GetW32ProcInfo(peb);

    if (Msg > WM.USER && Msg < WMP.CREATEELEMENT) // not for us!
        return 0;

    const wnd = ObGetObject<WND>(hWnd);
    if (!wnd) {
        return -1;
    }

    console.warn(`NtDefWindowProc: Msg=0x${Msg.toString(16)}`);

    switch (Msg) {
        case WMP.CREATEELEMENT:
            console.log("WMP_CREATEELEMENT");
            return NtDefCreateElement(peb, hWnd, Msg, wParam, lParam);
        case WMP.ADDCHILD:
            console.log("WMP_ADDCHILD");
            return NtDefAddChild(peb, hWnd, wParam);
        case WMP.REMOVECHILD:
            console.log("WMP_REMOVECHILD");
            return NtDefRemoveChild(peb, hWnd, wParam);
        case WM.NCCREATE:
            console.log("WM_NCCREATE");
            return 0;
        case WM.CREATE:
            console.log("WM_CREATE");
            return 0;
        case WM.CLOSE:
            console.log("WM_CLOSE");
            await NtDestroyWindow(peb, hWnd);
            return 0;
        case WM.SYSCOMMAND:
            console.log("WM_SYSCOMMAND");
            return await NtDefWndHandleSysCommand(peb, wnd, wParam, lParam);
    }

    return 0; // TODO
}

function NtDefAddChild(peb: PEB, hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if ((wnd.data as WND_DATA)?.pWindowBody) {
        wnd.data.pWindowBody.appendChild(childWnd.pRootElement);
    }
    else if (wnd.pRootElement) {
        wnd.pRootElement.appendChild(childWnd.pRootElement);
    }

    return 0;
}

function NtDefRemoveChild(peb: PEB, hWnd: HWND, hWndChild: HWND): LRESULT {
    const wnd = ObGetObject<WND>(hWnd);
    const childWnd = ObGetObject<WND>(hWndChild);
    if (!wnd || !childWnd) {
        return -1;
    }

    if ((wnd.data as WND_DATA)?.pWindowBody) {
        wnd.data.pWindowBody.removeChild(childWnd.pRootElement);
    }
    else if (wnd.pRootElement) {
        wnd.pRootElement.removeChild(childWnd.pRootElement);
    }

    return 0;
}

function NtDefCreateWindowTitleBar(pRootElement: HTMLElement, wnd: WND, data: WND_DATA): LRESULT {
    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";

    const titleBarText = document.createElement("div");
    titleBarText.className = "title-bar-text";
    titleBarText.innerText = wnd.lpszName;

    const titleBarControls = document.createElement("div");
    titleBarControls.className = "title-bar-controls";

    if ((wnd.dwStyle & WS.MINIMIZEBOX)) {
        const minimizeButton = document.createElement("button");
        minimizeButton.setAttribute("aria-label", "Minimize");
        // minimizeButton.addEventListener("click", () => wnd.OnMinimizeButtonClick());

        titleBarControls.appendChild(minimizeButton);

        data.pMinimizeButton = minimizeButton;
    }

    if ((wnd.dwStyle & WS.MAXIMIZEBOX)) {
        const maximizeButton = document.createElement("button");
        maximizeButton.setAttribute("aria-label", "Maximize");
        // maximizeButton.addEventListener("click", () => wnd.OnMaximizeButtonClick());

        titleBarControls.appendChild(maximizeButton);

        data.pMaximizeButton = maximizeButton;
    }

    const closeButton = document.createElement("button");
    closeButton.setAttribute("aria-label", "Close");
    // closeButton.addEventListener("click", () => wnd.OnCloseButtonClick());
    titleBarControls.appendChild(closeButton);

    titleBar.appendChild(titleBarText);
    titleBar.appendChild(titleBarControls);

    const windowBody = document.createElement("div");
    windowBody.className = "window-body";

    pRootElement.appendChild(titleBar);
    pRootElement.appendChild(windowBody);

    data.pTitleBar = titleBar;
    data.pTitleBarText = titleBarText;
    data.pTitleBarControls = titleBarControls;
    data.pCloseButton = closeButton;
    data.pWindowBody = windowBody;

    return 0;
}

function NtDefCreateElement(peb: PEB, hWnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM): LRESULT {
    const state = GetW32ProcInfo(peb);
    const wnd = ObGetObject<WND>(hWnd);

    let data = wnd.data as WND_DATA;  
    if (!data) {
        data = wnd.data = {
            pTitleBar: null,
            pTitleBarText: null,
            pTitleBarControls: null,
            pCloseButton: null,
            pMinimizeButton: null,
            pMaximizeButton: null,
            pWindowBody: null
        };
    }

    const pRootElement = document.createElement("div");

    // use 98.css styles
    if (wnd.dwStyle & WS.SIZEBOX) {
        pRootElement.style.resize = "both";
    }
    else {
        pRootElement.style.resize = "none";
    }

    if (wnd.dwStyle & WS.CAPTION) {
        NtDefCreateWindowTitleBar(pRootElement, wnd, data);
    }

    if (wnd.dwStyle & WS.THICKFRAME) {
        pRootElement.classList.add("window");
    }

    wnd.pRootElement = pRootElement;  

    return 1;
}