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
    CreateWindow,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage
} from "@window-server/user32";


async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (msg) {
        case WM.CREATE: {
            await CreateWindow(
                "STATIC",
                "This window will intentionally asynchronously freeze the UI thread for 100ms, every time it recieves a message.",
                WS.CHILD | WS.VISIBLE | SS.CENTER,
                10, 12, 210, 20,
                hwnd,
                0,
                0,
                null
            );
            break;
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
        "Asynchronous Freeze",  // lpWindowName
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

export default main;