import { CombineRgn, CreateRectRgn, CreateSolidBrush, DeleteObject, FillRgn, SelectObject, TextOut, HDC, RGN } from "../client/gdi32.js";
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
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetDC,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage
} from "../client/user32.js";

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            break;
        }

        case WM.PAINT: {
            const hdc: HDC = await GetDC(hwnd);

            const brush = await CreateSolidBrush(0x696db8);
            await SelectObject(hdc, brush);

            const rgn1 = await CreateRectRgn(0, 0, 100, 100);
            const rgn2 = await CreateRectRgn(50, 50, 150, 150);
            const intersect = await CreateRectRgn(0, 0, 0, 0);
            await CombineRgn(intersect, rgn1, rgn2, RGN.XOR);
            await FillRgn(hdc, intersect);

            await TextOut(hdc, 10, 10, "Hello, world!");

            await DeleteObject(rgn1);
            await DeleteObject(rgn2);
            await DeleteObject(intersect);
            await DeleteObject(brush);
            await DeleteObject(hdc);
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
    const hWnd = await CreateWindowEx(
        0,                           // dwExStyle
        className,                   // lpClassName
        "GDI Test Window",           // lpWindowName
        WS.OVERLAPPEDWINDOW,         // dwStyle

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

export { main };