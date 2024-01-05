import {
    CreatePen,
    CreateSolidBrush,
    DeleteObject,
    HBRUSH,
    HDC,
    INRECT,
    PS,
    RECT,
    Rectangle,
    SelectObject,
    TextOut
} from "@window-server/gdi32";
import { GetModuleHandle } from "@window-server/kernel32";
import {
    COLOR,
    CW_USEDEFAULT,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetClientRect,
    GetDC,
    GetMessage,
    HINSTANCE,
    HIWORD,
    HT,
    HWND,
    LOWORD,
    LPARAM,
    LRESULT,
    MSG,
    PostQuitMessage,
    RegisterClass,
    SW,
    ScreenToClient,
    ShowWindow,
    TranslateMessage,
    WM,
    WNDCLASSEX,
    WPARAM,
    WS
} from "@window-server/user32";

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            break;
        }

        case WM.PAINT: {
            const clientRect: RECT = {} as RECT;
            await GetClientRect(hwnd, clientRect);

            const hdc: HDC = await GetDC(hwnd);
            const pen = await CreatePen(PS.NULL, 1, 0x000000);
            const background = await CreateSolidBrush(0x008080);
            const titleBar = await CreateSolidBrush(0xFFFFFF - 0x008080);
            const closeBtn = await CreateSolidBrush(0xFF0000);

            await SelectObject(hdc, pen);
            await SelectObject(hdc, background);
            await Rectangle(hdc, 0, 0, clientRect.right, clientRect.bottom);

            await SelectObject(hdc, titleBar);
            await Rectangle(hdc, 0, 0, clientRect.right, 30);

            await SelectObject(hdc, closeBtn);
            await Rectangle(hdc, clientRect.right - 30, 0, clientRect.right, 30);

            await TextOut(hdc, 10, 10, "Hello, world!");
            await TextOut(hdc, clientRect.right - 20, 10, "X");

            await DeleteObject(titleBar);
            await DeleteObject(closeBtn);
            await DeleteObject(pen);
            await DeleteObject(background);
            await DeleteObject(hdc);
            break;
        }

        case WM.NCHITTEST: {
            let hitTest = await DefWindowProc(hwnd, msg, wParam, lParam);
            if (hitTest !== HT.CLIENT)
                return hitTest;

            // translate client coordinates to window coordinates
            const point = { x: LOWORD(lParam), y: HIWORD(lParam) };
            if (!await ScreenToClient(hwnd, point))
                return hitTest;

            // check if the point is within the titlebar
            const clientRect: RECT = {} as RECT;
            await GetClientRect(hwnd, clientRect);

            const titlebarRect: RECT = { left: 0, top: 0, right: clientRect.right, bottom: 20 };
            const closeRect: RECT = { left: clientRect.right - 30, top: 0, right: clientRect.right, bottom: 30 };

            if (INRECT(point.x, point.y, closeRect)) {
                hitTest = HT.CLOSE;
            }
            else if (INRECT(point.x, point.y, titlebarRect)) {
                hitTest = HT.CAPTION;
            }
            else if (INRECT(point.x, point.y, clientRect)) {
                hitTest = HT.CLIENT;
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
        hbrBackground: await CreateSolidBrush(0x8d69b8),
        lpszMenuName: 0,
        lpszClassName: className,
        hIconSm: 0
    }

    const atom = await RegisterClass(wndClass);
    const hWnd = await CreateWindowEx(
        0,                           // dwExStyle
        className,                   // lpClassName
        "GDI Test Window",           // lpWindowName
        WS.POPUP | WS.THICKFRAME,    // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, 350, 350,

        0,          // hWndParent
        0,          // hMenu      
        hModule,    // hInstance
        null        // lpParam
    );

    await ShowWindow(hWnd, SW.SHOWDEFAULT);

    let msg: MSG = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}

export default main;