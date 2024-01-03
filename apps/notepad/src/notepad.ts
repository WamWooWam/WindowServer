import {
    CreateWindow,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    GetMonitorInfo,
    GetSystemMetrics,
    HWND,
    LPARAM,
    LRESULT,
    LoadCursor,
    LoadIcon,
    LoadImage,
    MAKEINTRESOURCE,
    MONITOR,
    MSG,
    MonitorFromRect,
    RegisterClass,
    SW,
    SendMessage,
    ShowWindow,
    TranslateMessage,
    WPARAM,
    WS,
    COLOR,
    CW_USEDEFAULT,
    HINSTANCE,
    IDC,
    IMAGE,
    SM,
    WM,
    WNDCLASSEX,
    PostQuitMessage
} from "@window-server/user32";
import { IntersectRect, RECT, LOGFONT } from "@window-server/gdi32";
import { GetModuleHandle } from "@window-server/kernel32";

import Globals from "./globals.js";
import { InitData, LoadSettingsFromRegistry } from "./settings.js";


async function WndProc(hWnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            break;
        }
        case WM.DESTROY: {
            await SendMessage(Globals.hEdit, WM.DESTROY, 0, 0);
            await PostQuitMessage(0);
            break;
        }
        default: {
            return await DefWindowProc(hWnd, msg, wParam, lParam);
        }
    }

    return 0;
}

export async function WinMain(hInstance: HINSTANCE, hPrevInstance: HINSTANCE, lpCmdLine: string, nCmdShow: number) {
    const className = "Notepad";
    const winName = "Notepad";

    await InitData(hInstance);
    await LoadSettingsFromRegistry();

    const wndClass: WNDCLASSEX = {
        lpfnWndProc: WndProc,
        hInstance: Globals.hInstance,
        hIcon: await LoadIcon(hInstance, "IDI_NOTEPAD"),
        hCursor: await LoadCursor(0, MAKEINTRESOURCE(IDC.ARROW)),
        hbrBackground: COLOR.WINDOW + 1,
        lpszMenuName: "IDR_MENU",
        lpszClassName: className,
        hIconSm: await LoadImage(hInstance,
            "IDI_NOTEPAD",
            IMAGE.ICON,
            GetSystemMetrics(SM.CXSMICON),
            GetSystemMetrics(SM.CYSMICON),
            0),
        cbClsExtra: 0,
        cbWndExtra: 0,
        cbSize: 0,
        style: 0,
    };

    if (!RegisterClass(wndClass)) {
        return 1;
    }

    let hMonitor = await MonitorFromRect(Globals.mainRect, MONITOR.DEFAULTTOPRIMARY);
    let mi = await GetMonitorInfo(hMonitor);
    if (!mi) {
        return 1;
    }

    let x = Globals.mainRect.top;
    let y = Globals.mainRect.left;
    let rcIntersect = {} as RECT;
    if (!IntersectRect(rcIntersect, Globals.mainRect, mi.rcWork)) {
        x = CW_USEDEFAULT;
        y = CW_USEDEFAULT;
    }

    let hWnd = await CreateWindow(className,
        winName,
        WS.OVERLAPPEDWINDOW,
        x, y,
        Globals.mainRect.right - Globals.mainRect.left,
        Globals.mainRect.bottom - Globals.mainRect.top,
        0,
        0,
        hInstance,
        0);

    if (!hWnd) {
        return 1;
    }

    await ShowWindow(hWnd, SW.SHOWDEFAULT);

    // load accelerator table

    let msg = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return <number>msg.wParam;
}

export default async function main() {
    return WinMain(await GetModuleHandle(null), 0, "", 0);
}