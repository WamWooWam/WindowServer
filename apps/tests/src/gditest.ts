import { CombineRgn, CreateRectRgn, CreateSolidBrush, DeleteObject, FillRgn, SelectObject, TextOut, HDC, RGN, CreatePen, PS, SetTextColor, Rectangle, RECT } from "gdi32";
import { GetModuleHandle } from "kernel32";
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
    TranslateMessage,
    PostMessage,
    GetClientRect
} from "user32";

function RGB(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
}

function RandInt(max: number): number {
    return Math.floor(Math.random() * (max));
}

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            setInterval(async () => {
                await PostMessage(hwnd, WM.PAINT, 0, 0);
            }, 250);
            break;
        }

        case WM.PAINT: {
            const hdc: HDC = await GetDC(hwnd);
            const rect = {} as RECT;
            await GetClientRect(hwnd, rect);

            const brush = await CreateSolidBrush(0x696db8);
            await SelectObject(hdc, brush);

            // const rgn1 = await CreateRectRgn(0, 0, 100, 100);
            // const rgn2 = await CreateRectRgn(50, 50, 150, 150);
            const rgn1 = await CreateRectRgn(0, 0, (rect.right / 3) * 2, (rect.bottom / 3) * 2);
            const rgn2 = await CreateRectRgn(rect.right / 3, rect.right / 3, rect.right, rect.bottom);
            const intersect = await CreateRectRgn(0, 0, 0, 0);
            await CombineRgn(intersect, rgn1, rgn2, RGN.XOR);
            await FillRgn(hdc, intersect);

            const color = RGB(RandInt(255), RandInt(255), RandInt(255));
            await SetTextColor(hdc, color);
            await TextOut(hdc, 10, 10, "Hello, world!");

            await DeleteObject(rgn1);
            await DeleteObject(rgn2);
            await DeleteObject(intersect);
            await DeleteObject(brush);
            await DeleteObject(hdc);
            // await DeleteObject(pen);
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

export default main;