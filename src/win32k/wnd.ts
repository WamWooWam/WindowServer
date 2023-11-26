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
import { HDC, OffsetRect, RECT } from "../types/gdi32.types.js";
import { HWNDS, W32CLASSINFO, W32PROCINFO } from "./shared.js";
import { NtDispatchMessage, NtPostMessage } from "./msg.js";
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
    private _phwndChildren: HWND[];

    private _hMenu: HMENU;
    private _lpParam: any;

    private _hDC: HDC;
    private _peb: PEB;

    private _zIndex: number;

    public stateFlags = {
        sendSizeMoveMsgs: false,
        /**
         * Set if DefWindowProc is called for WM_NCHITTEST, so we can skip a user<->kernel space transition
         * and just return the result of the kernel call
         */
        overrides_NCHITTEST: true,
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

        this._hWnd = ObSetObject(this, "WND", peb.hProcess, () => this.Dispose());
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
        this._phwndChildren = [];

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

        // ReactOS does funny stuff to specialise creating the desktop window,
        // but I'd rather not do that for now

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
            this.stateFlags.sendSizeMoveMsgs = true;

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

    public set dwStyle(value: number) {
        let oldStyle = this._dwStyle;
        this._dwStyle = value;
        this.UpdateWindowStyle(oldStyle, value);
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

    public get rcClient(): Readonly<RECT> {
        return { ...this._rcClient };
    }

    public get rcWindow(): Readonly<RECT> {
        return { ...this._rcWindow };
    }

    public get lpszName(): string {
        return this._lpszName;
    }

    public get hDC(): HDC {
        return this._hDC;
    }

    public get children(): HWND[] {
        return [...this._phwndChildren];
    }

    public get pRootElement() {
        return this._pRootElement;
    }

    public set pRootElement(value: HTMLElement) {
        this._pRootElement = value;
    }

    public get zIndex(): number {
        return this._zIndex;
    }

    public set zIndex(value: number) {
        this._zIndex = value;
        if (this._pRootElement)
            this._pRootElement.style.zIndex = `${value}`;
    }

    public get lpClass(): W32CLASSINFO {
        return this._pClsInfo;
    }

    public AddChild(hWnd: HWND): void {
        this._phwndChildren.splice(0, 0, hWnd);
        this.FixZOrder();
    }

    public RemoveChild(hWnd: HWND): void {
        if (!this._phwndChildren)
            return;

        const index = this._phwndChildren.findIndex(h => h === hWnd);
        if (index !== -1)
            this._phwndChildren.splice(index, 1);

        this.FixZOrder();
    }

    public MoveChild(hWnd: HWND, idx: number): void {
        if (!this._phwndChildren)
            return;

        const index = this._phwndChildren.findIndex(h => h === hWnd);
        if (index !== -1)
            this._phwndChildren.splice(index, 1);

        this._phwndChildren.splice(idx, 0, hWnd);

        this.FixZOrder();
    }

    public async WndProc(msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
        return await this._lpfnWndProc(this._hWnd, msg, wParam, lParam);
    }

    public Show(): void {
        this.dwStyle = this.dwStyle | WS.VISIBLE;
    }

    public Hide(): void {
        this.dwStyle = this.dwStyle & ~WS.VISIBLE;
    }

    public async MoveWindow(x: number, y: number, cx: number, cy: number, bRepaint: boolean): Promise<void> {
        if ((this.dwStyle & (WS.POPUP | WS.CHILD)) === 0) {
            cx = Math.max(cx, NtIntGetSystemMetrics(SM.CXMINTRACK));
            cy = Math.max(cy, NtIntGetSystemMetrics(SM.CYMINTRACK));
        }

        let previousWindow = { ...this.rcWindow };

        this._rcWindow.left = x;
        this._rcWindow.top = y;
        this._rcWindow.right = x + cx;
        this._rcWindow.bottom = y + cy;

        this.FixWindowCoordinates();

        let oldCX = previousWindow.right - previousWindow.left;
        let oldCY = previousWindow.bottom - previousWindow.top;
        let newCX = this.rcWindow.right - this.rcWindow.left;
        let newCY = this.rcWindow.bottom - this.rcWindow.top;

        if (oldCX !== newCX || oldCY !== newCY) {
            await this.CalculateClientSize();
        }

        if (this._pRootElement) {
            this._pRootElement.style.transform = `translate(${this.rcWindow.left}px, ${this.rcWindow.top}px)`;
            this._pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
            this._pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
        }

        if (this._hDC) {
            GreResizeDC(this._hDC, this.rcClient);
        }
    }

    public async CalculateClientSize(): Promise<void> {
        let rect = { ...this.rcWindow };
        rect.right -= rect.left;
        rect.bottom -= rect.top;
        rect.left = rect.top = 0;

        const newRect = await NtDispatchMessage(this._peb, [this._hWnd, WM.NCCALCSIZE, 0, rect]);
        if (newRect) {
            this._rcClient = newRect;
        }
    }

    public FixZOrder(): void {
        let deadWindows = [];
        for (let i = 0; i < this._phwndChildren.length; i++) {
            const hWnd = this._phwndChildren[i];
            const wnd = ObGetObject<WND>(hWnd);
            if (!wnd) {
                deadWindows.push(hWnd);
                continue;
            }

            wnd.zIndex = this._phwndChildren.length - i;
        }

        for (let i = 0; i < deadWindows.length; i++) {
            this.RemoveChild(deadWindows[i]);
        }
    }

    public Dispose(): void {
        this.Hide();

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

        this._rcWindow.left = Math.floor(x);
        this._rcWindow.top = Math.floor(y);
        this._rcWindow.right = Math.floor(x + cx);
        this._rcWindow.bottom = Math.floor(y + cy);
    }

    async CreateElement() {
        if (!this._pRootElement) {
            await NtDispatchMessage(this._peb, [this._hWnd, WMP.CREATEELEMENT, 0, 0])

            if (this._hParent) {
                await NtDispatchMessage(this._peb, [this._hParent, WMP.ADDCHILD, this._hWnd, 0]);
            }
            else {
                // for now, just add it to the body
                document.body.appendChild(this._pRootElement);
            }
        }

        // for now, dont do a dirty flag, just set the style
        this.pRootElement.style.transform = `translate(${this.rcWindow.left}px, ${this.rcWindow.top}px)`;
        this.pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
        this.pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
        this.pRootElement.style.position = "absolute";
        this.pRootElement.style.zIndex = `${this.zIndex}`;

        // if we're a top level window, allocate a DC
        // if (!(this.dwStyle & WS.CHILD)) {
        //     this._hDC = GreAllocDCForWindow(this._peb, this._hWnd);
        // }
        // else {
        //     // use the parent's DC, with an additional transform
        //     const parent = ObGetObject<WND>(this._hParent);
        //     this._hDC = ObDuplicateHandle(parent._hDC);
        // }

        // if (!this._hDC)
        //     return;

        // GreResizeDC(this._hDC, this.rcClient);
    }

    public UpdateWindowStyle(dwOldStyle: number, dwNewStyle: number): void {
        if (!this._pRootElement)
            return;

        this.FixWindowCoordinates();

        NtPostMessage(this._peb, [this._hWnd, WMP.UPDATEWINDOWSTYLE, dwNewStyle, dwOldStyle]);
        NtPostMessage(this._peb, [this._hWnd, WM.STYLECHANGED, -16, { oldStyle: dwOldStyle, newStyle: dwNewStyle }]);
    }
}