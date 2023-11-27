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
        "STATIC Test Window",  // lpWindowName
        WS.OVERLAPPEDWINDOW,         // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,

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

async function CreateStatic(text: string, x: number, y: number, width: number, height: number, parent: HWND, nId: number, style: number) {
    const button = await CreateWindow("STATIC", text, WS.CHILD | WS.VISIBLE | style,
        x, y, width, height, parent, nId, 0, null);

    return button;
}

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            // create every type of STATIC control
            const statics: HWND[] = [];
            statics.push(await CreateStatic("SS_LEFT", 10, 10, 100, 20, hwnd, 0, SS.LEFT));
            statics.push(await CreateStatic("SS_CENTER", 10, 35, 100, 20, hwnd, 0, SS.CENTER));
            statics.push(await CreateStatic("SS_RIGHT", 10, 60, 100, 20, hwnd, 0, SS.RIGHT));
            statics.push(await CreateStatic("SS_ICON", 10, 85, 100, 20, hwnd, 0, SS.ICON));
            statics.push(await CreateStatic("SS_BLACKRECT", 10, 110, 100, 20, hwnd, 0, SS.BLACKRECT));
            statics.push(await CreateStatic("SS_GRAYRECT", 10, 135, 100, 20, hwnd, 0, SS.GRAYRECT));
            statics.push(await CreateStatic("SS_WHITERECT", 10, 160, 100, 20, hwnd, 0, SS.WHITERECT));
            statics.push(await CreateStatic("SS_BLACKFRAME", 10, 185, 100, 20, hwnd, 0, SS.BLACKFRAME));
            statics.push(await CreateStatic("SS_GRAYFRAME", 10, 210, 100, 20, hwnd, 0, SS.GRAYFRAME));
            statics.push(await CreateStatic("SS_WHITEFRAME", 10, 235, 100, 20, hwnd, 0, SS.WHITEFRAME));
            statics.push(await CreateStatic("SS_USERITEM", 10, 260, 100, 20, hwnd, 0, SS.USERITEM));
            statics.push(await CreateStatic("SS_SIMPLE", 10, 285, 100, 20, hwnd, 0, SS.SIMPLE));
            statics.push(await CreateStatic("SS_LEFTNOWORDWRAP", 10, 310, 100, 20, hwnd, 0, SS.LEFTNOWORDWRAP));
            statics.push(await CreateStatic("SS_OWNERDRAW", 10, 335, 100, 20, hwnd, 0, SS.OWNERDRAW));
            statics.push(await CreateStatic("SS_BITMAP", 10, 360, 100, 20, hwnd, 0, SS.BITMAP));
            statics.push(await CreateStatic("SS_ETCHEDHORZ", 10, 410, 100, 20, hwnd, 0, SS.ETCHEDHORZ));
            statics.push(await CreateStatic("SS_ETCHEDVERT", 10, 435, 100, 20, hwnd, 0, SS.ETCHEDVERT));
            statics.push(await CreateStatic("SS_ETCHEDFRAME", 10, 460, 100, 20, hwnd, 0, SS.ETCHEDFRAME));

            return 0;
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

export { main };