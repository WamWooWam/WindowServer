import { GetModuleHandle } from "../client/kernel32.js";
import {
    CreateWindow,
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
    SS,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    GetWindowRect,
    PostQuitMessage,
    RegisterClass,
    ScreenToClient,
    ShowWindow,
    TranslateMessage,
    SendMessage,
    GetParent,
    SetWindowLong,
    GWL,
    GetWindowLong,
    CallWindowProc
} from "../client/user32.js";
import { INRECT } from "../types/gdi32.types.js";

async function ButtonWndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.NCHITTEST: {
            return HT.TRANSPARENT;
        }

        default: {
            const oldWndProc = await GetWindowLong(hwnd, GWL.USERDATA);
            return await CallWindowProc(oldWndProc, hwnd, msg, wParam, lParam);
        }
    }

    return 0;
}

async function CreateButton(text: string, x: number, y: number, width: number, height: number, parent: HWND, nId: number) {
    const button = await CreateWindow("BUTTON", text, BS.PUSHBUTTON | WS.CHILD | WS.VISIBLE,
        x, y, width, height, parent, nId, 0, null);

    let oldWndProc = await SetWindowLong(button, GWL.WNDPROC, ButtonWndProc);
    await SetWindowLong(button, GWL.USERDATA, oldWndProc);

    return button;
}

const rcButtons = [
    { left: 10, top: 35, right: 110, bottom: 65 },
    { left: 10, top: 70, right: 110, bottom: 100 },
    { left: 10, top: 105, right: 110, bottom: 135 },
    { left: 120, top: 35, right: 220, bottom: 65 },
    { left: 120, top: 70, right: 220, bottom: 100 },
    { left: 120, top: 105, right: 220, bottom: 135 }

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
            await CreateWindow(
                "STATIC",
                "Click and drag the buttons",
                WS.CHILD | WS.VISIBLE | SS.CENTER,
                10, 12, 210, 20,
                hwnd,
                0,
                0,
                null
            );

            for (let i = 0; i < 6; i++) {
                await CreateButton(lpszButtons[i], rcButtons[i].left, rcButtons[i].top, rcButtons[i].right - rcButtons[i].left, rcButtons[i].bottom - rcButtons[i].top, hwnd, i);
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
                return hitTest;

            for (let i = 0; i < 6; i++) {
                if (INRECT(point.x, point.y, rcButtons[i])) {
                    return htButtons[i];
                }
            }

            return hitTest;
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
        "WM_NCHITTEST Test Window",  // lpWindowName
        WS.OVERLAPPEDWINDOW,         // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, 234, 170,

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