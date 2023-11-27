import { GetModuleHandle } from "../client/kernel32.js";
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
    CreateWindow,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage
} from "../client/user32.js";


async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            await CreateWindow(
                "STATIC",
                "This window cannot be bigger than 450x400, or smaller than 250x200.",
                WS.CHILD | WS.VISIBLE | SS.CENTER,
                10, 12, 210, 20,
                hwnd,
                0,
                0,
                null
            );
            break;
        }

        case WM.GETMINMAXINFO: {
            const minmax = <MINMAXINFO>lParam;
            minmax.ptMinTrackSize.x = 250;
            minmax.ptMinTrackSize.y = 200;
            minmax.ptMaxTrackSize.x = 450;
            minmax.ptMaxTrackSize.y = 400;
            return minmax;
        }

        case WM.DESTROY: {
            await PostQuitMessage(0);
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