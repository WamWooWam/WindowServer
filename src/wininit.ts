/*
* Stub wininit, which is the first process created by the kernel.
* Currently just creates a window to be the parent of all other windows, and waits for a quit message.
*/

import { GetModuleHandle } from "./client/kernel32.js";
import {
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    GetSystemMetrics,
    PostQuitMessage,
    RegisterClass,
    SetWindowPos,
    ShowWindow,
    TranslateMessage
} from "./client/user32.js";
import {
    HINSTANCE,
    HWND,
    LPARAM,
    LRESULT,
    MSG,
    SW,
    WS,
    WM,
    WNDCLASSEX,
    WPARAM,
    SM,
    SWP,
} from "./types/user32.types.js";

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.DESTROY:
            await PostQuitMessage(0);
            break;

        case WM.DISPLAYCHANGE:
            {
                const screenW = await GetSystemMetrics(SM.CXSCREEN);
                const screenH = await GetSystemMetrics(SM.CYSCREEN);

                console.log("WM_DISPLAYCHANGE", screenW, screenH);

                await SetWindowPos(hwnd, 0, 0, 0, screenW, screenH, SWP.NOZORDER | SWP.NOACTIVATE | SWP.FRAMECHANGED);
                break;
            }
        default:
            return await DefWindowProc(hwnd, msg, wParam, lParam);
    }

    return 0;
}

async function main() {
    const hModule = await GetModuleHandle(null);
    const className = "Test Window Class";

    const wndClass: WNDCLASSEX = {
        cbSize: 0,
        style: 0,
        lpfnWndProc: WndProc,
        cbClsExtra: 0,
        cbWndExtra: 0,
        hInstance: <HINSTANCE>hModule,
        hIcon: 0,
        hCursor: 0,
        hbrBackground: 0,
        lpszMenuName: 0,
        lpszClassName: className,
        hIconSm: 0
    }

    const atom = await RegisterClass(wndClass);
    console.log(atom);

    const screenW = await GetSystemMetrics(SM.CXSCREEN);
    const screenH = await GetSystemMetrics(SM.CYSCREEN);

    const hWnd = await CreateWindowEx(
        0,                      // dwExStyle
        className,              // lpClassName
        "Desktop Window",          // lpWindowName
        WS.POPUP,    // dwStyle

        // x, y, nWidth, nHeight
        0, 0, screenW, screenH,

        0,                      // hWndParent
        0,                      // hMenu      
        hModule,                // hInstance
        null                    // lpParam
    );
    console.log(hWnd);

    await ShowWindow(hWnd, SW.SHOWDEFAULT);

    let msg: MSG = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}

export { main };