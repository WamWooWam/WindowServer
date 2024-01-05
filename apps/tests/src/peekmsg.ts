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
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage,
    PeekMessage,
    PM,
    PostMessage
} from "@window-server/user32";

let hText: HWND;
let iCnt: number = 0;

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            hText = await CreateWindowEx(
                0, "STATIC", "0",
                WS.CHILD | WS.VISIBLE,
                10, 10, 100, 20,
                hwnd, 0, 0, null
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
        "PeekMessage Test Window",  // lpWindowName
        WS.OVERLAPPEDWINDOW | WS.VISIBLE,         // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, 234, 170,

        0,          // hWndParent
        0,          // hMenu      
        hModule,    // hInstance
        null        // lpParam
    );
    console.log(hWnd);

    await ShowWindow(hWnd, SW.SHOWDEFAULT);

    for (; ;) {
        let msg: MSG = {} as MSG;
        while (await PeekMessage(msg, 0, 0, 0, PM.REMOVE)) {
            if (msg.message == WM.QUIT)
                return 1;

            await TranslateMessage(msg);
            await DispatchMessage(msg);
        }

        iCnt++;

        await PostMessage(hText, WM.SETTEXT, 0, iCnt.toString());
    }
}

export default main;