import { CREATE_WINDOW_EX, HINSTANCE, HMENU, HWND, LPARAM, LRESULT, MSG, WNDPROC, WPARAM, WS_CAPTION, WS_CHILD, WS_CLIPSIBLINGS, WS_DLGFRAME, WS_EX_DLGMODALFRAME, WS_EX_STATICEDGE, WS_EX_WINDOWEDGE, WS_POPUP, WS_SIZEBOX, WS_THICKFRAME } from "../types/user32.types.js";
import { HANDLE, PEB } from "../types/types.js";
import { ObGetChildHandlesByType, ObGetObject, ObSetHandleOwner, ObSetObject } from "../objects.js";
import { W32CLASSINFO, W32PROCINFO } from "./shared.js";

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

    private _lpszName: string;

    private _hParent: HWND; // parent window (if this is a WS_CHILD like a control)
    private _hOwner: HWND; // owner window (if this is a WS_POPUP like a dialog)
    // private phwndChildren: HWND[]; 

    private _hMenu: HMENU;
    private _lpParam: any;

    private _stateFlags = {
        sendSizeMoveMsgs: false,
    }

    private pRootElement: HTMLElement;

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

        this._hWnd = ObSetObject(this, "WND", hParent || peb.hProcess, () => this.destroy());
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

        // ReactOS does funny stuff to specialise creating the desktop window, but I'd rather not do that

        /* Correct the window style. */
        if ((this.dwStyle & (WS_CHILD | WS_POPUP)) != WS_CHILD) {
            this._dwStyle |= WS_CLIPSIBLINGS;
            if (!(this.dwStyle & WS_POPUP)) {
                this._dwStyle |= WS_CAPTION;
            }
        }

        /* WS_EX_WINDOWEDGE depends on some other styles */
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

        this.msgQueuePromise = new Promise((resolve) => {
            this.msgQueueResolve = resolve;
        });

        document.addEventListener("keypress", (ev) => {
            this.EnqueueMessage({
                hWnd: this._hWnd,
                message: 0x0100, // WM_KEYDOWN
                wParam: ev.keyCode,
                lParam: 0,
                time: 0,
                pt: { x: 0, y: 0 }
            });
        });

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

    public AddChild(hWnd: HWND): void {
        ObSetHandleOwner(hWnd, this._hWnd);
    }

    public WndProc(msg: number, wParam: WPARAM, lParam: LPARAM): LRESULT | Promise<LRESULT> {
        return this._lpfnWndProc(this._hWnd, msg, wParam, lParam);
    }

    private msgQueueResolve: (value?: any) => void;
    private msgQueuePromise: Promise<any>;
    private msgQueue: MSG[] = [];

    public EnqueueMessage(msg: MSG): void {
        this.msgQueue.push(msg);
        this.msgQueueResolve();
    }

    public async GetMessage(): Promise<MSG> {
        if (this.msgQueue.length > 0) {
            return this.msgQueue.shift()!;
        }

        await (this.msgQueuePromise = new Promise((resolve) => {
            this.msgQueueResolve = resolve;
        }));
        return this.msgQueue.shift()!;
    }

    public async TranslateMessage(msg: MSG): Promise<boolean> {
        return true;
    }

    public async DispatchMessage(msg: MSG): Promise<LRESULT> {
        return await this.WndProc(msg.message, msg.wParam, msg.lParam);
    }

    public destroy(): void {
    }
}
