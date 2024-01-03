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
    CreateWindow,
    CreateWindowEx,
    DefWindowProc,
    DispatchMessage,
    GetMessage,
    PostQuitMessage,
    RegisterClass,
    ShowWindow,
    TranslateMessage,
    BS,
    LOWORD,
    SendMessage
} from "@window-server/user32";


const BUTTON_NAMES = [
    "BS_PUSHBUTTON",
    "BS_DEFPUSHBUTTON",
    "WS_DISABLED", // never used
    "BS_CHECKBOX",
    "BS_AUTOCHECKBOX",
    "BS_RADIOBUTTON",
    "BS_AUTORADIOBUTTON",
    "BS_3STATE",
    "BS_AUTO3STATE",
    "BS_GROUPBOX"
]

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
        "BUTTON Test Window",  // lpWindowName
        WS.OVERLAPPEDWINDOW,         // dwStyle

        // x, y, nWidth, nHeight
        CW_USEDEFAULT, CW_USEDEFAULT,
        380, 300,

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

async function CreateButton(text: string, x: number, y: number, width: number, height: number, parent: HWND, nId: number, style: number) {
    const button = await CreateWindow("BUTTON", text, WS.CHILD | WS.VISIBLE | style,
        x, y, width, height, parent, nId, 0, null);

    return button;
}

let hStatic = 0;

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    switch (msg) {
        case WM.CREATE: {
            // every type of BUTTON control
            await CreateButton("BS_PUSHBUTTON", 10, 10, 100, 30, hwnd, 0, BS.PUSHBUTTON);
            await CreateButton("BS_DEFPUSHBUTTON", 10, 50, 100, 30, hwnd, 1, BS.DEFPUSHBUTTON);
            await CreateButton("WS_DISABLED", 10, 90, 100, 30, hwnd, 2, BS.PUSHBUTTON | WS.DISABLED);

            await CreateButton("BS_CHECKBOX", 10, 130, 100, 12, hwnd, 3, BS.CHECKBOX);
            await CreateButton("BS_AUTOCHECKBOX", 10, 150, 100, 12, hwnd, 4, BS.AUTOCHECKBOX);
            await CreateButton("BS_RADIOBUTTON", 10, 170, 100, 12, hwnd, 5, BS.RADIOBUTTON);
            await CreateButton("BS_AUTORADIOBUTTON", 10, 190, 100, 12, hwnd, 6, BS.AUTORADIOBUTTON);
            await CreateButton("BS_3STATE", 10, 210, 100, 12, hwnd, 7, BS.THREESTATE);
            await CreateButton("BS_AUTO3STATE", 10, 230, 100, 12, hwnd, 8, BS.AUTO3STATE);
            await CreateButton("BS_GROUPBOX", 160, 10, 200, 200, hwnd, 9, BS.GROUPBOX);

            // static control to show which button was clicked
            hStatic = await CreateWindow("STATIC", "", WS.CHILD | WS.VISIBLE | SS.CENTER,
                160, 104, 200, 12, hwnd, 10, 0, null);

            return 0;
        }

        case WM.COMMAND: {
            await SendMessage(hStatic, WM.SETTEXT, 0, `${BUTTON_NAMES[LOWORD(wParam)]} clicked`);
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

export default main;