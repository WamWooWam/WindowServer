import { GetModuleHandle } from "./client/kernel32.js";
import {
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    GetWindowRect,
    PostQuitMessage,
    RegisterClass,
    ScreenToClient,
    ShowWindow,
    TranslateMessage
} from "./client/user32.js";
import { INRECT } from "./types/gdi32.types.js";
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
    HT,
    LOWORD,
    HIWORD,
    BS,
} from "./types/user32.types.js";

async function CreateButton(text: string, x: number, y: number, width: number, height: number, parent: HWND) {
    const button = await CreateWindowEx(
        0,                      // dwExStyle
        "BUTTON",               // lpClassName
        text,                   // lpWindowName
        BS.PUSHBUTTON | WS.CHILD | WS.VISIBLE, // dwStyle

        // x, y, nWidth, nHeight
        x, y, width, height,

        parent,                 // hWndParent
        0,                      // hMenu      
        0,                      // hInstance
        null                    // lpParam
    );

    return button;
}

const rcButtons = [
    { left: 10, top: 10, right: 110, bottom: 40 },
    { left: 10, top: 50, right: 110, bottom: 80 },
    { left: 10, top: 90, right: 110, bottom: 120 },
    { left: 10, top: 130, right: 110, bottom: 160 },
    { left: 10, top: 170, right: 110, bottom: 200 },
    { left: 10, top: 210, right: 110, bottom: 240 },
];

const lpszButtons = [
    "Caption",
    "Left",
    "Right",
    "Minimize",
    "Maximize",
    "Close",
];

const htButtons = [
    HT.CAPTION,
    HT.LEFT,
    HT.RIGHT,
    HT.MINBUTTON,
    HT.MAXBUTTON,
    HT.CLOSE,
];

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            for (let i = 0; i < 6; i++) {
                await CreateButton(lpszButtons[i], rcButtons[i].left, rcButtons[i].top, rcButtons[i].right - rcButtons[i].left, rcButtons[i].bottom - rcButtons[i].top, hwnd);
            }
            break;
        }

        case WM.NCHITTEST: {
            let hitTest = await DefWindowProc(hwnd, msg, wParam, lParam);
            if (hitTest !== HT.CLIENT) {
                return hitTest;
            }

            // translate client coordinates to window coordinates
            const point = { x: LOWORD(lParam), y: HIWORD(lParam) };
            if (!await ScreenToClient(hwnd, point))
                return;

            for (let i = 0; i < 6; i++) {
                if (INRECT(point.x, point.y, rcButtons[i])) {
                    return htButtons[i];
                }
            }
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