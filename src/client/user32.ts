import USER32, {
    ATOM,
    CREATE_DESKTOP,
    CREATE_WINDOW_EX,
    CREATE_WINDOW_EX_REPLY,
    GET_MESSAGE,
    GET_MESSAGE_REPLY,
    HINSTANCE,
    LPARAM,
    LRESULT,
    MSG,
    REGISTER_CLASS,
    REGISTER_CLASS_REPLY,
    SET_WINDOW_POS,
    SHOW_WINDOW,
    SHOW_WINDOW_REPLY,
    WNDCLASS,
    WNDCLASS_WIRE,
    WNDPROC,
    WNDPROC_PARAMS,
    WPARAM
} from "../types/user32.types.js";

import Executable from "../types/Executable.js";
import { GetModuleHandle } from "./kernel32.js";
import { HANDLE } from "../types/types.js";
import { HDC } from "../types/gdi32.types.js";
import Message from "../types/Message.js";
import { NtRegisterSubsystem } from "./ntdll.js";
import { SUBSYS_USER32 } from "../types/subsystems.js";

const User32 = await NtRegisterSubsystem(SUBSYS_USER32, User32_HandleMessage);

function User32_HandleMessage(msg: Message) {

}

/**
 * Registers a window class for subsequent use in calls to the {@link CreateWindow} or {@link CreateWindowEx} function.
 * @param lpWndClass A pointer to a {@link WNDCLASS} structure. You must fill the structure with the appropriate class attributes before passing it to the function.
 * @returns If the function succeeds, the return value is a class atom that uniquely identifies the class being registered. 
 * This atom can only be used by the CreateWindow, CreateWindowEx, GetClassInfo, GetClassInfoEx, FindWindow, FindWindowEx, and UnregisterClass functions and the IActiveIMMap::FilterClientWindows method.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclassa
*/
export async function RegisterClass(lpWndClass: WNDCLASS): Promise<ATOM> {
    const lpWndClassWire: WNDCLASS_WIRE = {
        ...lpWndClass,
        lpfnWndProc: User32.RegisterCallback((msg: Message<WNDPROC_PARAMS>) => { return lpWndClass.lpfnWndProc(...msg.data); }, true),
    }

    if (lpWndClassWire.hInstance === 0) {
        lpWndClassWire.hInstance = await GetModuleHandle(null);
    }

    // TODO: Resource lookup

    const msg = await User32.SendMessage<REGISTER_CLASS, REGISTER_CLASS_REPLY>({
        nType: USER32.RegisterClass,
        data: { lpWndClass: lpWndClassWire }
    });

    return msg.data.retVal;
}

/**
 * Creates an overlapped, pop-up, or child window with an extended window style; otherwise, 
 * this function is identical to the CreateWindow function. For more information about creating
 * a window and for full descriptions of the other parameters of CreateWindowEx, see CreateWindow.
 * @param lpClassName A string or a class atom created by a previous call to the RegisterClass or RegisterClassEx function.
 * @param lpWindowName The window name. If the window style specifies a title bar, the window title pointed to by lpWindowName is displayed in the title bar.
 * @param dwStyle The style of the window being created. This parameter can be a combination of the window style values, plus the control styles indicated in the Remarks section.
 * @param x The initial horizontal position of the window. For an overlapped or pop-up window, the x parameter is the initial x-coordinate of the window's upper-left corner, in screen coordinates.
 * @param y The initial vertical position of the window. For an overlapped or pop-up window, the y parameter is the initial y-coordinate of the window's upper-left corner, in screen coordinates.
 * @param nWidth The width, in device units, of the window. For overlapped windows, nWidth is the window's width, in screen coordinates, or CW_USEDEFAULT.
 * @param nHeight The height, in device units, of the window. For overlapped windows, nHeight is the window's height, in screen coordinates, or CW_USEDEFAULT.
 * @param hWndParent A handle to the parent or owner window of the window being created. To create a child window or an owned window, supply a valid window handle.
 * @param hMenu A handle to a menu, or specifies a child-window identifier, depending on the window style. For an overlapped or pop-up window, hMenu identifies the menu to be used with the window;
 * it can be NULL if the class menu is to be used. For a child window, hMenu specifies the child-window identifier, an integer value used by a dialog box control to notify its parent about events.
 * @param hInstance A handle to the instance of the module to be associated with the window.
 * @param lpParam Pointer to a value to be passed to the window through the CREATESTRUCT structure (lpCreateParams member) pointed to by the lParam param of the WM_CREATE message.
 * @returns If the function succeeds, the return value is a handle to the new window. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexa
 */
export async function CreateWindow(
    lpClassName: string,
    lpWindowName: string,
    dwStyle: number,
    x: number,
    y: number,
    nWidth: number,
    nHeight: number,
    hWndParent: HANDLE,
    hMenu: HANDLE,
    hInstance: HINSTANCE,
    lpParam: any
): Promise<HANDLE> {
    return CreateWindowEx(0, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam);
}

/**
 * Creates an overlapped, pop-up, or child window with an extended window style; otherwise, 
 * this function is identical to the CreateWindow function. For more information about creating
 * a window and for full descriptions of the other parameters of CreateWindowEx, see CreateWindow.
 * @param dwExStyle The extended window style of the window being created. For a list of values, see Extended Window Styles.
 * @param lpClassName A string or a class atom created by a previous call to the RegisterClass or RegisterClassEx function.
 * @param lpWindowName The window name. If the window style specifies a title bar, the window title pointed to by lpWindowName is displayed in the title bar.
 * @param dwStyle The style of the window being created. This parameter can be a combination of the window style values, plus the control styles indicated in the Remarks section.
 * @param x The initial horizontal position of the window. For an overlapped or pop-up window, the x parameter is the initial x-coordinate of the window's upper-left corner, in screen coordinates.
 * @param y The initial vertical position of the window. For an overlapped or pop-up window, the y parameter is the initial y-coordinate of the window's upper-left corner, in screen coordinates.
 * @param nWidth The width, in device units, of the window. For overlapped windows, nWidth is the window's width, in screen coordinates, or CW_USEDEFAULT.
 * @param nHeight The height, in device units, of the window. For overlapped windows, nHeight is the window's height, in screen coordinates, or CW_USEDEFAULT.
 * @param hWndParent A handle to the parent or owner window of the window being created. To create a child window or an owned window, supply a valid window handle.
 * @param hMenu A handle to a menu, or specifies a child-window identifier, depending on the window style. For an overlapped or pop-up window, hMenu identifies the menu to be used with the window;
 * it can be NULL if the class menu is to be used. For a child window, hMenu specifies the child-window identifier, an integer value used by a dialog box control to notify its parent about events.
 * @param hInstance A handle to the instance of the module to be associated with the window.
 * @param lpParam Pointer to a value to be passed to the window through the CREATESTRUCT structure (lpCreateParams member) pointed to by the lParam param of the WM_CREATE message.
 * @returns If the function succeeds, the return value is a handle to the new window. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexa
 */
export async function CreateWindowEx(
    dwExStyle: number,
    lpClassName: string,
    lpWindowName: string,
    dwStyle: number,
    x: number,
    y: number,
    nWidth: number,
    nHeight: number,
    hWndParent: HANDLE,
    hMenu: HANDLE,
    hInstance: HINSTANCE,
    lpParam: any
): Promise<HANDLE> {
    const msg = await User32.SendMessage<CREATE_WINDOW_EX, CREATE_WINDOW_EX_REPLY>({
        nType: USER32.CreateWindowEx,
        data: {
            dwExStyle,
            lpClassName,
            lpWindowName,
            dwStyle,
            x,
            y,
            nWidth,
            nHeight,
            hWndParent,
            hMenu,
            hInstance,
            lpParam
        }
    });

    return msg.data.hWnd;
}

/**
 * Calls the default window procedure to provide default processing for any window messages that an application does not process.
 * This function ensures that every message is processed. DefWindowProc is called with the same parameters received by the window procedure.
 * @param hWnd A handle to the window procedure that received the message.
 * @param uMsg The message.
 * @param wParam Additional message information. The content of this parameter depends on the value of the uMsg parameter.
 * @param lParam Additional message information. The content of this parameter depends on the value of the uMsg parameter.
 * @returns The return value is the result of the message processing and depends on the message.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defwindowproca
*/
export async function DefWindowProc(hWnd: HANDLE, uMsg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
    const msg = await User32.SendMessage<WNDPROC_PARAMS, number>({
        nType: USER32.DefWindowProc,
        data: [hWnd, uMsg, wParam, lParam]
    });

    return msg.data;
}

/**
 * Sets the specified window's show state.
 * @param hWnd A handle to the window.
 * @param nCmdShow Controls how the window is to be shown. This parameter is ignored the first time an application calls ShowWindow, 
 * if the program that launched the application provides a STARTUPINFO structure. Otherwise, the first time ShowWindow is called,
 * the value should be the value obtained by the WinMain function in its nCmdShow parameter. In subsequent calls, this parameter can be one of the following values.
 * @category User32
 * @returns If the window was previously visible, the return value is nonzero. If the window was previously hidden, the return value is zero.
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow
 */
export async function ShowWindow(hWnd: HANDLE, nCmdShow: number): Promise<boolean> {
    const msg = await User32.SendMessage<SHOW_WINDOW, SHOW_WINDOW_REPLY>({
        nType: USER32.ShowWindow,
        data: { hWnd, nCmdShow }
    });

    return msg.data.retVal;
}

/**
 * Retrieves a message from the calling thread's message queue. The function dispatches incoming sent messages until a posted message is available for retrieval.
 * @param lpMsg A pointer to an {@link MSG} structure that receives message information from the thread's message queue.
 * @param hWnd A handle to the window whose messages are to be retrieved. The window must belong to the current thread.
 * @param wMsgFilterMin The integer value of the lowest message value to be retrieved. Use WM_KEYFIRST (0x0100) to specify the first keyboard message
 * (WM_KEYDOWN). Use WM_MOUSEFIRST (0x0200) to specify the first mouse message (WM_MOUSEMOVE).
 * @param wMsgFilterMax The integer value of the highest message value to be retrieved. Use WM_KEYLAST to specify the last keyboard message.
 * (WM_KEYUP). Use WM_MOUSELAST to specify the last mouse message (WM_MBUTTONDBLCLK).
 * @returns If the function retrieves a message other than WM_QUIT, the return value is nonzero.
 * If the function retrieves the WM_QUIT message, the return value is zero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagea
 */
export async function GetMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number): Promise<boolean> {
    const msg = await User32.SendMessage<GET_MESSAGE, GET_MESSAGE_REPLY>({
        nType: USER32.GetMessage,
        data: { lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax }
    });

    Object.assign(lpMsg, msg.data.lpMsg);

    return msg.data.retVal;
}

/**
 * Dispatches incoming nonqueued messages, checks the thread message queue for a posted message, and retrieves the message (if any exist).
 * @param lpMsg A pointer to an {@link MSG} structure that receives message information.
 * @param hWnd The handle to the window whose messages are to be retrieved. The window must belong to the current thread.
 * If hWnd is NULL, GetMessage retrieves messages for any window that belongs to the current thread, and any messages on the current 
 * thread's message queue whose hwnd value is NULL (see the MSG structure). Therefore if hWnd is NULL, both window messages and thread 
 * messages are processed.
 * If hWnd is -1, GetMessage retrieves only messages on the current thread's message queue whose hwnd value is NULL, that is, thread messages
 * as posted by PostMessage (when the hWnd parameter is NULL) or PostThreadMessage.
 * @param wMsgFilterMin The integer value of the lowest message value to be retrieved. Use WM_KEYFIRST (0x0100) to specify the first keyboard message
 * (WM_KEYDOWN). Use WM_MOUSEFIRST (0x0200) to specify the first mouse message (WM_MOUSEMOVE).
 * @param wMsgFilterMax The integer value of the highest message value to be retrieved. Use WM_KEYLAST to specify the last keyboard message.
 * (WM_KEYUP). Use WM_MOUSELAST to specify the last mouse message (WM_MBUTTONDBLCLK).
 * @returns If the function retrieves a message other than WM_QUIT, the return value is nonzero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-peekmessagea
 */
export async function PeekMessage(lpMsg: MSG, hWnd: HANDLE, wMsgFilterMin: number, wMsgFilterMax: number): Promise<boolean> {
    const msg = await User32.SendMessage<GET_MESSAGE, GET_MESSAGE_REPLY>({
        nType: USER32.PeekMessage,
        data: { lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax }
    });

    Object.assign(lpMsg, msg.data.lpMsg);

    return msg.data.retVal;
}

/**
 * Translates virtual-key messages into character messages. The character messages are posted to the calling thread's message queue, 
 * to be read the next time the thread calls the {@link GetMessage} or {@link PeekMessage} function.
 * @param lpMsg A pointer to an MSG structure that contains message information retrieved from the calling thread's message queue 
 * by using the {@link GetMessage} or {@link PeekMessage} function.
 * @returns If the message is translated (that is, a character message is posted to the thread's message queue), the return value is nonzero.
 * If the message is WM_KEYDOWN, WM_KEYUP, WM_SYSKEYDOWN, or WM_SYSKEYUP, the return value is nonzero, regardless of the translation.
 * If the message is not translated (that is, a character message is not posted to the thread's message queue), the return value is zero.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translatemessage
 */
export async function TranslateMessage(lpMsg: MSG): Promise<boolean> {
    const msg = await User32.SendMessage<MSG, boolean>({
        nType: USER32.TranslateMessage,
        data: lpMsg
    });

    return msg.data;
}

/**
 * Dispatches a message to a window procedure. It is typically used to dispatch a message retrieved by the GetMessage function.
 * @param lpMsg A pointer to a structure that contains the message.
 * @returns The return value specifies the value returned by the window procedure. Although its meaning depends on the message being dispatched, 
 * the return value generally is ignored.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dispatchmessagea
 * @example
 * ```ts
 * while (await GetMessage(lpMsg, null, 0, 0) !== 0) {
 *    await TranslateMessage(lpMsg);
 *    await DispatchMessage(lpMsg);
 * }
 * ```
 */
export async function DispatchMessage(lpMsg: MSG): Promise<boolean> {
    const msg = await User32.SendMessage<MSG, boolean>({
        nType: USER32.DispatchMessage,
        data: lpMsg
    });

    return msg.data;
}

/**
 * Posts a message to the message queue of the specified thread. It returns without waiting for the thread to process the message.
 * @param nExitCode The exit code for the thread. Use the GetExitCodeThread function to retrieve a thread's exit value. Use the ExitProcess function to terminate a thread.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postquitmessage
 * @example
 * ```ts
 * case WM.CLOSE:
 *   await PostQuitMessage(0);
 *   break;
 * ```
 */
export async function PostQuitMessage(nExitCode: number) {
    await User32.SendMessage<number>({
        nType: USER32.PostQuitMessage,
        data: nExitCode
    });
}

/**
 * Retrieves a handle to a display device context (DC) for the client area of the specified window.
 * @param hWnd A handle to the window whose DC is to be retrieved.
 * @returns If the function succeeds, the return value is the handle to the DC for the specified window's client area. If the function fails, the return value is NULL.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdc
 * @example
 * ```ts
 * const dc = await GetDC(hWnd);
 * await Rectangle(dc, 0, 0, 100, 100);
 * ```
 */
export async function GetDC(hWnd: HANDLE): Promise<HDC> {
    const msg = await User32.SendMessage<HANDLE>({
        nType: USER32.GetDC,
        data: hWnd
    });

    return msg.data;
}

// TODO: this should not require a syscall, use shared memory
/**
 * Retrieves the specified system metric or system configuration setting.
 * @param nIndex The system metric or configuration setting to be retrieved. See {@link https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics}
 * @returns If the function succeeds, the return value is the requested system metric or configuration setting. If the function fails, the return value is 0.
 * @category User32
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics
 */
export async function GetSystemMetrics(nIndex: number): Promise<number> {
    const msg = await User32.SendMessage<number>({
        nType: USER32.GetSystemMetrics,
        data: nIndex
    });

    return msg.data;
}

/**
 * Changes the size, position, and Z order of a child, pop-up, or top-level window. 
 * These windows are ordered according to their appearance on the screen. 
 * The topmost window receives the highest rank and is the first window in the Z order.
 * @param hWnd A handle to the window.
 * @param hWndInsertAfter A handle to the window to precede the positioned window in the Z order. 
 * @param x The new position of the left side of the window, in client coordinates.
 * @param y The new position of the top of the window, in client coordinates.
 * @param cx The new width of the window, in pixels.
 * @param cy The new height of the window, in pixels.
 * @param uFlags The window sizing and positioning flags.
 * @returns If the function succeeds, the return value is nonzero, if the function fails, the return value is zero. To get extended error information, call GetLastError.
 * @category User32
*/
export async function SetWindowPos(hWnd: HANDLE, hWndInsertAfter: HANDLE, x: number, y: number, cx: number, cy: number, uFlags: number): Promise<boolean> {
    const msg = await User32.SendMessage<SET_WINDOW_POS, boolean>({
        nType: USER32.SetWindowPos,
        data: { hWnd, hWndInsertAfter, x, y, cx, cy, uFlags }
    });

    return msg.data;
}

/**
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopa
 * @param lpszDesktop The name of the desktop to be created. This string must be unique among the desktop names for the current session. 
 * @param lpszDevice Reserved; must be NULL.
 * @param pDevMode Reserved; must be NULL.
 * @param dwFlags Reserved; must be 0.
 * @param dwDesiredAccess The access to the desktop. For a list of values, see Desktop Security and Access Rights.
 * @param lpsa Reserved; must be NULL.
 * @returns If the function succeeds, the return value is a handle to the newly created desktop. When you are finished using the handle, call the CloseDesktop function to close it. If the function fails, the return value is NULL. To get extended error information, call GetLastError.
 * @category User32
 */
export async function CreateDesktop(lpszDesktop: string, lpszDevice: string, pDevMode: null, dwFlags: number, dwDesiredAccess: number, lpsa: any): Promise<HANDLE> {
    const msg = await User32.SendMessage<CREATE_DESKTOP, HANDLE>({
        nType: USER32.CreateDesktop,
        data: { lpszDesktop, lpszDevice, pDevMode, dwFlags, dwDesiredAccess, lpsa }
    });

    return msg.data;
}

const user32: Executable = {
    file: "user32.js",
    type: "dll",
    subsystem: "console",
    arch: "js",
    entryPoint: null,
    dependencies: ["ntdll.js", "kernel32.js"],

    name: "user32",
    version: [1, 0, 0, 0],
    rsrc: {}
};

export default user32;