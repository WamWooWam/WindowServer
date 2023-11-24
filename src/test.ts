import { GetModuleHandle } from "./client/kernel32.js";
import {
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage
} from "./client/user32.js";
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
} from "./types/user32.types.js";

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    console.log(`WndProc: msg=0x${msg.toString(16)}`);

    switch (msg) {
        case WM.CREATE: {
            const button = await CreateWindowEx(
                0,                      // dwExStyle
                "BUTTON",               // lpClassName
                "Test Button",          // lpWindowName
                0x50000000,             // dwStyle

                // x, y, nWidth, nHeight
                10, 10, 100, 30,

                hwnd,                   // hWndParent
                0,                      // hMenu      
                0,                      // hInstance
                null                    // lpParam
            );

            console.log(button);

            await ShowWindow(button, SW.SHOWDEFAULT);

            break;
        }

        case WM.DESTROY:
            await PostQuitMessage(0);
            break;

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
        0,                      // dwExStyle
        className,              // lpClassName
        "Test Window",          // lpWindowName
        WS.OVERLAPPEDWINDOW,    // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,

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