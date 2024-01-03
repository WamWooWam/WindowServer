import { GetModuleHandle } from "@window-server/kernel32";
import {
    CW_USEDEFAULT,
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
    SS,
    MINMAXINFO,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage,
    FindWindow,
    SendMessage
} from "@window-server/user32";

const className = "b19563a3-13df-4838-88b2-27a4c3f25e22";
let wndCount = 0;

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            await CreateWindowEx(0,
                "STATIC",
                "This is a single instance application. When launched, it looks for another window of the same type, if it finds one, it sends a message to it to create a new window, then exits.",
                WS.CHILD | WS.VISIBLE | SS.CENTER,
                10, 10, 220, 220,
                hwnd,
                0,
                0,
                null
            );
            break;
        }

        case WM.USER: {
            await CreateWindow();
            break;
        }

        case WM.GETMINMAXINFO: {
            const minmax = <MINMAXINFO>lParam;
            minmax.ptMinTrackSize.x = 250;
            minmax.ptMinTrackSize.y = 200;
            minmax.ptMaxTrackSize.x = 250;
            minmax.ptMaxTrackSize.y = 250;
            return minmax;
        }

        case WM.DESTROY: {
            // if there are no more windows, quit
            wndCount--;
            if (wndCount === 0) {
                await PostQuitMessage(0);
            }
            break;
        }

        default:
            return await DefWindowProc(hwnd, msg, wParam, lParam);
    }

    return 0;
}

async function CreateWindow() {
    const hModule = await GetModuleHandle(null);

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
    const hWnd = await CreateWindowEx(
        0,                           // dwExStyle
        className,                   // lpClassName
        "WM_GETMINMAXINFO Test Window",  // lpWindowName
        WS.OVERLAPPEDWINDOW,         // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, 350, 350,

        0,          // hWndParent
        0,          // hMenu      
        hModule,    // hInstance
        null        // lpParam
    );

    await ShowWindow(hWnd, SW.SHOWDEFAULT);

    wndCount++;
}

async function main() {
    let otherWindow = await FindWindow(className, null);
    if (otherWindow) {
        await SendMessage(otherWindow, WM.USER, 0, 0);
        return -1;
    }

    await CreateWindow();

    let msg: MSG = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}

export default main;