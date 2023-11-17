import {
     CREATE_WINDOW_EX,
     CW_USEDEFAULT,
     HINSTANCE,
     HMENU,
     HWND,
     LPARAM,
     LRESULT,
     MSG,
     SM_CXFRAME,
     SM_CXSIZE,
     WNDPROC,
     WPARAM,
     WS_CAPTION,
     WS_CHILD,
     WS_CLIPSIBLINGS,
     WS_DLGFRAME,
     WS_EX_DLGMODALFRAME,
     WS_EX_STATICEDGE,
     WS_EX_WINDOWEDGE,
     WS_POPUP,
     WS_SIZEBOX,
     WS_THICKFRAME
} from "../types/user32.types.js";
import { HANDLE, PEB } from "../types/types.js";
import { ObCloseHandle, ObGetChildHandlesByType, ObGetObject, ObSetHandleOwner, ObSetObject } from "../objects.js";
import { W32CLASSINFO, W32PROCINFO } from "./shared.js";

import { NtDispatchMessage } from "./msg.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtIntGetSystemMetrics } from "./metrics.js";
import { RECT } from "../types/gdi32.types.js";

export class WND {
    private _hWnd: HWND;
    private _hInstance: HINSTANCE;
    private _dwStyle: number
    private _dwExStyle: number;
    private _rcWindow: RECT;
    private _rcClient: RECT;
    private _lpfnWndProc: WNDPROC;
    private _pClsInfo: W32CLASSINFO;

    private _peb: PEB;

    private _lpszName: string;

    private _hParent: HWND; // parent window (if this is a WS_CHILD like a control)
    private _hOwner: HWND; // owner window (if this is a WS_POPUP like a dialog)
    // private phwndChildren: HWND[]; 

    private _hMenu: HMENU;
    private _lpParam: any;

    private _stateFlags = {
        sendSizeMoveMsgs: false,
    }

    private _pRootElement: HTMLElement;

    constructor(
        peb: PEB,
        pti: W32PROCINFO,
        cs: CREATE_WINDOW_EX,
        lpszName: string,
        lpClass: W32CLASSINFO,
        hParent: HWND,
        hOwner: HWND,
    ) {
        // Automatically add WS_EX_WINDOWEDGE if we have a thick frame
        if ((cs.dwExStyle & WS_EX_DLGMODALFRAME) ||
            ((!(cs.dwExStyle & WS_EX_STATICEDGE)) &&
                (cs.dwStyle & (WS_DLGFRAME | WS_THICKFRAME))))
            cs.dwExStyle |= WS_EX_WINDOWEDGE;
        else
            cs.dwExStyle &= ~WS_EX_WINDOWEDGE;

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
        if ((this.dwStyle & (WS_CHILD | WS_POPUP)) != WS_CHILD) {
            this._dwStyle |= WS_CLIPSIBLINGS;
            if (!(this.dwStyle & WS_POPUP)) {
                this._dwStyle |= WS_CAPTION;
            }
        }

        // WS_EX_WINDOWEDGE depends on some other styles 
        if (this._dwExStyle & WS_EX_DLGMODALFRAME)
            this._dwExStyle |= WS_EX_WINDOWEDGE;
        else if (this.dwStyle & (WS_DLGFRAME | WS_THICKFRAME)) {
            if (!((this._dwExStyle & WS_EX_STATICEDGE) &&
                (this.dwStyle & (WS_CHILD | WS_POPUP))))
                this._dwExStyle |= WS_EX_WINDOWEDGE;
        }
        else
            this._dwExStyle &= ~WS_EX_WINDOWEDGE;

        if (!(this.dwStyle & (WS_CHILD | WS_POPUP)))
            this._stateFlags.sendSizeMoveMsgs = true;

        const parent = ObGetObject<WND>(this._hParent);
        if (parent) {
            parent.AddChild(this._hWnd);
        }

        pti.hWnds.push(this._hWnd);

        document.addEventListener("keypress", (ev) => {
            NtDispatchMessage(peb, {
                hWnd: this._hWnd,
                message: 0x0100, // WM_KEYDOWN
                wParam: ev.keyCode,
                lParam: 0
            });
        });

        this._pRootElement = document.createElement("div");

        // document.addEventListener("keyup", (ev) => {
        //     this.EnqueueMessage({
        //         hWnd: this._hWnd,
        //         message: 0x0101, // WM_KEYUP
        //         wParam: ev.keyCode,
        //         lParam: 0,
        //         time: 0,
        //         pt: { x: 0, y: 0 }
        //     });
        // });
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

    public get children(): HWND[] {
        return [...ObGetChildHandlesByType(this._hWnd, "WND")];
    }

    public get pRootElement(): HTMLElement {
        return this._pRootElement;
    }

    public AddChild(hWnd: HWND): void {
        ObSetHandleOwner(hWnd, this._hWnd);
    }

    public WndProc(msg: number, wParam: WPARAM, lParam: LPARAM): LRESULT | Promise<LRESULT> {
        return this._lpfnWndProc(this._hWnd, msg, wParam, lParam);
    }

    public Show(): void {
        this.FixWindowCoordinates();

        const parent = ObGetObject<WND>(this._hParent);
        if (parent) {
            parent.pRootElement.appendChild(this._pRootElement);
        }
        else if ((this.dwStyle & (WS_CHILD | WS_POPUP)) != WS_CHILD) {
            document.body.appendChild(this._pRootElement);
        }
    }

    public Hide(): void {
        this._pRootElement.remove();
    }

    public Dispose(): void {
        this._pRootElement.remove();

        if (this._hParent)
            ObCloseHandle(this._hParent);

        if (this._hOwner)
            ObCloseHandle(this._hOwner);
    }

    private FixWindowCoordinates(): void {
        let x = this.rcWindow.left;
        let y = this.rcWindow.top;
        let cx = this.rcWindow.right - this.rcWindow.left;
        let cy = this.rcWindow.bottom - this.rcWindow.top;

        if (!(this.dwStyle & (WS_POPUP | WS_CHILD))) {
            const monitor = NtGetPrimaryMonitor();

            if (x === CW_USEDEFAULT) {
                // if((y !== CW_USEDEFAULT) && (y !== 0))
                //     this.rcWindow.left = 0;

                // process parameters start x/y
                if (false) {

                } else {
                    x = monitor.cWndStack * NtIntGetSystemMetrics(this._peb, SM_CXSIZE) + NtIntGetSystemMetrics(this._peb, SM_CXFRAME);
                    y = monitor.cWndStack * NtIntGetSystemMetrics(this._peb, SM_CXSIZE) + NtIntGetSystemMetrics(this._peb, SM_CXFRAME);

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

        this.InvalidateRect();
    }
    
    private InvalidateRect(): void {
        // for now, dont do a dirty flag, just set the style
        this._pRootElement.style.left = `${this.rcWindow.left}px`;
        this._pRootElement.style.top = `${this.rcWindow.top}px`;
        this._pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
        this._pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
        this._pRootElement.style.position = ((this.dwStyle & (WS_CHILD | WS_POPUP)) != WS_CHILD) ? "absolute" : "relative";
        this._pRootElement.style.border = "1px solid black";
        this._pRootElement.style.boxSizing = "border-box";
        this._pRootElement.style.overflow = "hidden";
        this._pRootElement.style.backgroundColor = "white";
    }
}
