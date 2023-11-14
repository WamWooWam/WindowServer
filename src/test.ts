import { GetModuleHandle } from "./client/kernel32.js";
import { DefWindowProc, RegisterClass } from "./client/user32.js";
import { HINSTANCE, HWND, LPARAM, LRESULT, WNDCLASSEX, WPARAM } from "./types/user32.types.js";

async function WndProc(hwnd: HWND, msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    return await DefWindowProc(hwnd, msg, wParam, lParam);
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

    // next: CreateWindowEx

    // next: ShowWindow

    // next: GetMessage
    // next: TranslateMessage
    // next: DispatchMessage

    return 0;
}

export { main };