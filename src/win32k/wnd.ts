import {
    CREATE_WINDOW_EX,
    CW_USEDEFAULT,
    HINSTANCE,
    HMENU,
    HWND,
    LPARAM,
    LRESULT,
    MSG,
    SC,
    SM,
    WM,
    WNDPROC,
    WPARAM,
    WS
} from "../types/user32.types.js";
import DC, { GreAllocDCForWindow, GreResizeDC } from "./gdi/dc.js";
import { HANDLE, PEB } from "../types/types.js";
import { HDC, RECT } from "../types/gdi32.types.js";
import { HWNDS, W32CLASSINFO, W32PROCINFO } from "./shared.js";
import { NtPostMessage, NtSendMessage } from "./msg.js";
import {
    ObCloseHandle,
    ObDuplicateHandle,
    ObGetChildHandlesByType,
    ObGetObject,
    ObSetHandleOwner,
    ObSetObject
} from "../objects.js";

import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { WMP } from "../types/user32.int.types.js";

export class WND {
    private _hWnd: HWND;
    private _hInstance: HINSTANCE;
    private _dwStyle: number
    private _dwExStyle: number;
    private _rcWindow: RECT;
    private _rcClient: RECT;
    private _lpfnWndProc: WNDPROC;
    private _pClsInfo: W32CLASSINFO;
    private _lpszName: string;

    private _hParent: HWND; // parent window (if this is a WS.CHILD like a control)
    private _hOwner: HWND; // owner window (if this is a WS.POPUP like a dialog)
    // private phwndChildren: HWND[]; 

    private _hMenu: HMENU;
    private _lpParam: any;

    private _hDC: HDC;
    private _peb: PEB;

    private _stateFlags = {
        sendSizeMoveMsgs: false,
    }

    private _pRootElement: HTMLElement;

    public data: any;

    constructor(
        peb: PEB,
        pti: W32PROCINFO,
        cs: CREATE_WINDOW_EX,
        lpszName: string,
        lpClass: W32CLASSINFO,
        hParent: HWND,
        hOwner: HWND,
    ) {
        // Automatically add WS.EX.WINDOWEDGE if we have a thick frame
        if ((cs.dwExStyle & WS.EX.DLGMODALFRAME) ||
            ((!(cs.dwExStyle & WS.EX.STATICEDGE)) &&
                (cs.dwStyle & (WS.DLGFRAME | WS.THICKFRAME))))
            cs.dwExStyle |= WS.EX.WINDOWEDGE;
        else
            cs.dwExStyle &= ~WS.EX.WINDOWEDGE;

        this._hWnd = ObSetObject(this, "WND", hParent || peb.hProcess, () => this.Dispose());
        this._hInstance = cs.hInstance;
        this._dwStyle = cs.dwStyle;
        this._dwExStyle = cs.dwExStyle;
        this._lpfnWndProc = lpClass.lpfnWndProc;
        this._pClsInfo = lpClass;
        this._hParent = hParent;
        this._hOwner = hOwner;
        this._hMenu = cs.hMenu;
        this._lpParam = cs.lpParam;
        this._lpszName = lpszName;
        this._peb = peb;

        this._rcClient = {
            left: cs.x,
            top: cs.y,
            right: cs.x + cs.nWidth,
            bottom: cs.y + cs.nHeight
        };

        this._rcWindow = {
            left: cs.x,
            top: cs.y,
            right: cs.x + cs.nWidth,
            bottom: cs.y + cs.nHeight
        };

        // ReactOS does funny stuff to specialise creating the desktop window, but I'd rather not do that

        // Correct the window style.
        if ((this.dwStyle & (WS.CHILD | WS.POPUP)) != WS.CHILD) {
            this._dwStyle |= WS.CLIPSIBLINGS;
            if (!(this.dwStyle & WS.POPUP)) {
                this._dwStyle |= WS.CAPTION;
            }
        }

        // WS.EX.WINDOWEDGE depends on some other styles 
        if (this._dwExStyle & WS.EX.DLGMODALFRAME)
            this._dwExStyle |= WS.EX.WINDOWEDGE;
        else if (this.dwStyle & (WS.DLGFRAME | WS.THICKFRAME)) {
            if (!((this._dwExStyle & WS.EX.STATICEDGE) &&
                (this.dwStyle & (WS.CHILD | WS.POPUP))))
                this._dwExStyle |= WS.EX.WINDOWEDGE;
        }
        else
            this._dwExStyle &= ~WS.EX.WINDOWEDGE;

        if (!(this.dwStyle & (WS.CHILD | WS.POPUP)))
            this._stateFlags.sendSizeMoveMsgs = true;

        const parent = ObGetObject<WND>(this._hParent);
        if (parent) {
            parent.AddChild(this._hWnd);
        }

        this.FixWindowCoordinates();

        pti.hWnds.push(this._hWnd);

        // TODO: hacky asf 
        HWNDS.push(this._hWnd);
    }

    public get peb(): PEB {
        return this._peb;
    }

    public get hWnd(): HWND {
        return this._hWnd;
    }

    public get hParent(): HWND {
        return this._hParent;
    }

    public get hOwner(): HWND {
        return this._hOwner;
    }

    public get dwStyle(): number {
        return this._dwStyle;
    }

    public get dwExStyle(): number {
        return this._dwExStyle;
    }

    public get hInstance(): HINSTANCE {
        return this._hInstance;
    }

    public get hMenu(): HMENU {
        return this._hMenu;
    }

    public get rcClient(): RECT {
        return this._rcClient;
    }

    public get rcWindow(): RECT {
        return this._rcWindow;
    }

    public get lpszName(): string {
        return this._lpszName;
    }

    public get hDC(): HDC {
        return this._hDC;
    }

    public get children(): HWND[] {
        return [...ObGetChildHandlesByType(this._hWnd, "WND")];
    }

    public get pRootElement() {
        return this._pRootElement;
    }

    public set pRootElement(value: HTMLElement) {
        this._pRootElement = value;
    }

    public AddChild(hWnd: HWND): void {
        ObSetHandleOwner(hWnd, this._hWnd);
    }

    public WndProc(msg: number, wParam: WPARAM, lParam: LPARAM): LRESULT | Promise<LRESULT> {
        return this._lpfnWndProc(this._hWnd, msg, wParam, lParam);
    }

    public Show(): void {
        this.FixWindowCoordinates();

        this._pRootElement.style.display = "";
    }

    public Hide(): void {
        this._pRootElement.style.display = "none";
    }

    public MoveWindow(x: number, y: number, cx: number, cy: number, bRepaint: boolean): void {
        this.rcWindow.left = x;
        this.rcWindow.top = y;
        this.rcWindow.right = x + cx;
        this.rcWindow.bottom = y + cy;

        this.rcClient.left = 0;
        this.rcClient.top = 0;
        this.rcClient.right = cx;
        this.rcClient.bottom = cy;

        this._pRootElement.style.left = `${this.rcWindow.left}px`;
        this._pRootElement.style.top = `${this.rcWindow.top}px`;
        this._pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
        this._pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;

        if (this._hDC) {
            GreResizeDC(this._hDC, this.rcClient);
        }
    }

    public Dispose(): void {
        this.Hide();

        if (this._hParent)
            ObCloseHandle(this._hParent);

        if (this._hOwner)
            ObCloseHandle(this._hOwner);
    }

    // private OnMinimizeButtonClick(): void {
    //     NtPostMessage(this._peb, {
    //         hWnd: this._hWnd,
    //         message: WM.SYSCOMMAND,
    //         wParam: SC.MINIMIZE,
    //         lParam: 0
    //     });
    // }

    // private OnMaximizeButtonClick(): void {
    //     NtPostMessage(this._peb, {
    //         hWnd: this._hWnd,
    //         message: WM.SYSCOMMAND,
    //         wParam: SC.MAXIMIZE,
    //         lParam: 0
    //     });
    // }

    // private OnCloseButtonClick(): void {
    //     NtPostMessage(this._peb, {
    //         hWnd: this._hWnd,
    //         message: WM.SYSCOMMAND,
    //         wParam: SC.CLOSE,
    //         lParam: 0
    //     });
    // }

    private FixWindowCoordinates(): void {
        let x = this.rcWindow.left;
        let y = this.rcWindow.top;
        let cx = this.rcWindow.right - this.rcWindow.left;
        let cy = this.rcWindow.bottom - this.rcWindow.top;

        if (!(this.dwStyle & (WS.POPUP | WS.CHILD))) {
            const monitor = NtGetPrimaryMonitor();

            if (x === CW_USEDEFAULT) {
                // if((y !== CW_USEDEFAULT) && (y !== 0))
                //     this.rcWindow.left = 0;

                // process parameters start x/y
                if (false) {

                } else {
                    x = monitor.cWndStack * NtIntGetSystemMetrics(SM.CXSIZE) + NtIntGetSystemMetrics(SM.CXFRAME);
                    y = monitor.cWndStack * NtIntGetSystemMetrics(SM.CXSIZE) + NtIntGetSystemMetrics(SM.CXFRAME);

                    if (x > ((monitor.rcWork.right - monitor.rcWork.left) / 4) ||
                        y > ((monitor.rcWork.bottom - monitor.rcWork.top) / 4)) {
                        monitor.cWndStack = x = y = 0;
                    }

                    monitor.cWndStack++;
                }
            }

            if (cx === CW_USEDEFAULT) {
                // process parameters start cx/cy
                if (false) {

                } else {
                    cx = (monitor.rcWork.right - monitor.rcWork.left) * (3 / 4);
                    cy = (monitor.rcWork.bottom - monitor.rcWork.top) * (3 / 4);
                }
            }
        }
        else {
            if (x === CW_USEDEFAULT) {
                x = 0;
                y = 0;
            }

            if (cx === CW_USEDEFAULT) {
                cx = 0;
                cy = 0;
            }
        }

        this.rcWindow.left = x;
        this.rcWindow.top = y;
        this.rcWindow.right = x + cx;
        this.rcWindow.bottom = y + cy;

        this.rcClient.left = 0;
        this.rcClient.top = 0;
        this.rcClient.right = cx;
        this.rcClient.bottom = cy;
    }

    async CreateElement() {
        if (!this._pRootElement) {
            await NtSendMessage(this._peb, [this._hWnd, WMP.CREATEELEMENT, 0, 0])


            if (this._hParent) {
                await NtSendMessage(this._peb, [this._hParent, WMP.ADDCHILD, this._hWnd, 0]);
            }
            else {
                // for now, just add it to the body
                document.body.appendChild(this._pRootElement);
            }
        }

        // for now, dont do a dirty flag, just set the style
        this.pRootElement.style.left = `${this.rcWindow.left}px`;
        this.pRootElement.style.top = `${this.rcWindow.top}px`;
        this.pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
        this.pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
        this.pRootElement.style.position = "absolute";
        // this.pRootElement.style.overflow = "hidden";

        // if we're a top level window, allocate a DC
        if (!(this.dwStyle & WS.CHILD)) {
            this._hDC = GreAllocDCForWindow(this._peb, this._hWnd);
        }
        else {
            // use the parent's DC, with an additional transform
            const parent = ObGetObject<WND>(this._hParent);
            this._hDC = ObDuplicateHandle(parent._hDC);
        }

        if (!this._hDC)
            return;

        GreResizeDC(this._hDC, this.rcClient);
    }
}