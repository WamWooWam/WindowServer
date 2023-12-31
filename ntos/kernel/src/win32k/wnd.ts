import {
    CREATE_WINDOW_EX, WMP,
    CW_USEDEFAULT,
    HINSTANCE,
    HMENU,
    HWND,
    LPARAM,
    LRESULT,
    SM,
    WM,
    WNDPROC,
    WPARAM,
    WS,
    COLOR
} from "../subsystems/user32.js";
import DC, { GreAllocDCForWindow, GreResizeDC } from "./gdi/dc.js";
import { HANDLE, PEB } from "@window-server/sdk/types/types.js";
import { HDC, LPRECT, POINT, RECT } from "../subsystems/gdi32.js"
import { NtDispatchMessage, NtPostMessage } from "./msg.js";
import { NtUserIntSetStyle, NtUserUnlinkWindow } from "./window.js";
import { ObCloseHandle, ObDuplicateHandle, ObGetObject, ObSetObject } from "../objects.js";
import { W32CLASSINFO, W32PROCINFO } from "./shared.js";

import { NtCreateWndProcCallback } from "./class.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { NtUserGetSystemMetrics } from "./metrics.js";
import { NtUserInvalidateRect } from "./draw.js";
import { IntGetSysColorBrush } from "./brush.js";

export default class WND {
    private _hWnd: HWND;
    private _hInstance: HINSTANCE;
    private _dwStyle: number
    private _dwExStyle: number;
    private _rcWindow: RECT;
    private _rcClient: RECT;
    private _lpfnWndProc: WNDPROC | number;
    private _lpfnWndProcCallback: WNDPROC;
    private _pClsInfo: W32CLASSINFO;
    private _lpszName: string;

    private _hMenu: HMENU;
    private _lpParam: any;

    private _hDC: HDC;
    private _peb: PEB;

    private _zIndex: number;

    private _hRootElement: HANDLE;

    public stateFlags = {
        bIsLinked: false,
        bSendSizeMoveMsgs: false,
        /**
         * Set if DefWindowProc is called for WM_NCHITTEST, so we can skip a user<->kernel space transition
         * and just return the result of the kernel call
         */
        bOverridesNCHITTEST: true,
        bHasHadInitialPaint: false,
        bMaximizesToMonitor: false,
        bIsBeingActivated: false,
        bIsDestroyed: false,
        bIsActiveFrame: false,
        bInvalidated: true,
    }

    public savedPos: {
        normalRect: RECT,
        iconPos: POINT,
        maxPos: POINT,
        flags: number,
        initialized: boolean
    };

    public props: Map<string, any> = new Map();
    public dwUserData: number = 0;

    public wndLastActive: PWND;

    // windows uses a doubly linked list to keep track of windows and their z-order :D
    #wndNext: PWND = null;
    #wndPrev: PWND = null;
    #wndChild: PWND = null;
    #wndParent: PWND = null;
    #wndOwner: PWND = null;

    public get wndNext(): PWND {
        return this.#wndNext;
    }

    public set wndNext(value: PWND) {
        if (this.#wndNext) {
            ObCloseHandle(this.#wndNext.hWnd);
        }

        this.#wndNext = value;
        if (value) {
            ObDuplicateHandle(value.hWnd);
        }
    }

    public get wndPrev(): PWND {
        return this.#wndPrev;
    }

    public set wndPrev(value: PWND) {
        if (this.#wndPrev) {
            ObCloseHandle(this.#wndPrev.hWnd);
        }

        this.#wndPrev = value;
        if (value) {
            ObDuplicateHandle(value.hWnd);
        }
    }

    public get wndChild(): PWND {
        return this.#wndChild;
    }

    public set wndChild(value: PWND) {
        if (this.#wndChild) {
            ObCloseHandle(this.#wndChild.hWnd);
        }

        this.#wndChild = value;
        if (value) {
            ObDuplicateHandle(value.hWnd);
        }
    }

    public get wndParent(): PWND {
        return this.#wndParent;
    }

    public set wndParent(value: PWND) {
        if (this.#wndParent) {
            ObCloseHandle(this.#wndParent.hWnd);
        }

        this.#wndParent = value;
        if (value) {
            ObDuplicateHandle(value.hWnd);
        }
    }

    public get wndOwner(): PWND {
        return this.#wndOwner;
    }

    public set wndOwner(value: PWND) {
        if (this.#wndOwner) {
            ObCloseHandle(this.#wndOwner.hWnd);
        }

        this.#wndOwner = value;
        if (value) {
            ObDuplicateHandle(value.hWnd);
        }
    }

    public hbrBackground: HANDLE = 0;

    constructor(
        peb: PEB,
        pti: W32PROCINFO,
        cs: CREATE_WINDOW_EX,
        lpszName: string,
        lpClass: W32CLASSINFO,
        wndParent: PWND,
        wndOwner: PWND,
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
        this._lpfnWndProcCallback = NtCreateWndProcCallback(peb, this._lpfnWndProc);
        this._pClsInfo = lpClass;
        this._hMenu = cs.hMenu;
        this._lpParam = cs.lpParam;
        this._lpszName = lpszName;
        this._peb = peb;

        this.wndParent = wndParent;
        this.wndOwner = wndOwner;
        this.wndLastActive = this;

        // this.hbrBackground = lpClass.hbrBackground ObDuplicateHandle(lpClass.hbrBackground);

        // debugger;
        if (lpClass.hbrBackground > 0 && lpClass.hbrBackground < (COLOR.MENUBAR + 1)) {
            this.hbrBackground = IntGetSysColorBrush(lpClass.hbrBackground - 1);
        }
        else {
            this.hbrBackground = lpClass.hbrBackground == 0 ? 0 : ObDuplicateHandle(lpClass.hbrBackground);
        }

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
        else {
            this._dwExStyle &= ~WS.EX.WINDOWEDGE;
        }

        if (!(this.dwStyle & (WS.CHILD | WS.POPUP))) {
            this.stateFlags.bSendSizeMoveMsgs = true;
        }

        this.FixWindowCoordinates();

        this.savedPos = {
            flags: 0,
            iconPos: { x: 0, y: 0 },
            maxPos: { x: 0, y: 0 },
            normalRect: { left: 0, top: 0, right: 0, bottom: 0 },
            initialized: false
        }

        pti.hWnds.push(this._hWnd);
    }

    public get peb(): PEB {
        return this._peb;
    }

    public get hWnd(): HWND {
        return this._hWnd;
    }

    public get hParent(): HWND {
        return this.wndParent?.hWnd ?? 0;
    }

    public get hOwner(): HWND {
        return this.wndOwner?.hWnd ?? 0;
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

    public set dwExStyle(value: number) {
        let oldStyle = this._dwExStyle;
        this._dwExStyle = value;
        // TODO: update window style
        // this.UpdateWindowStyle(oldStyle, value);
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

    public get pRootElement(): HTMLElement | null {
        return ObGetObject<HTMLElement>(this._hRootElement);
    }

    public get pChildren(): HWND[] {
        return [...this.GetChildren()];
    }

    public set pRootElement(value: HTMLElement | null) {
        if (this._hRootElement)
            ObCloseHandle(this._hRootElement);

        // store a handle to the element, so we can close it when we're done
        if (value)
            this._hRootElement = ObSetObject(value, "HTMLElement", this._hWnd, (el) => el.remove());
    }

    public get zIndex(): number {
        return this.CalculateZIndex();
    }

    public get lpClass(): W32CLASSINFO {
        return this._pClsInfo;
    }

    public get lpfnWndProc(): WNDPROC | number {
        return this._lpfnWndProc;
    }

    public set lpfnWndProc(value: WNDPROC | number) {
        this._lpfnWndProc = value;
        this._lpfnWndProcCallback = NtCreateWndProcCallback(this._peb, value);
    }

    public async CallWndProc(msg: number, wParam: WPARAM, lParam: LPARAM): Promise<LRESULT> {
        return await this._lpfnWndProcCallback(this._hWnd, msg, wParam, lParam);
    }

    public Show(): void {
        NtUserIntSetStyle(this, 0, WS.VISIBLE);
    }

    public Hide(): void {
        NtUserIntSetStyle(this, WS.VISIBLE, 0);
    }

    public async MoveWindow(x: number, y: number, cx: number, cy: number, bRepaint: boolean): Promise<void> {
        if ((this.dwStyle & (WS.POPUP | WS.CHILD)) === 0) {
            cx = Math.max(cx, NtUserGetSystemMetrics(this.peb, SM.CXMINTRACK));
            cy = Math.max(cy, NtUserGetSystemMetrics(this.peb, SM.CYMINTRACK));
        }

        let previousWindow = { ...this.rcWindow };

        this._rcWindow.left = x;
        this._rcWindow.top = y;
        this._rcWindow.right = x + cx;
        this._rcWindow.bottom = y + cy;

        let oldCX = previousWindow.right - previousWindow.left;
        let oldCY = previousWindow.bottom - previousWindow.top;
        let newCX = this.rcWindow.right - this.rcWindow.left;
        let newCY = this.rcWindow.bottom - this.rcWindow.top;

        this.FixWindowCoordinates();

        if (oldCX !== newCX || oldCY !== newCY) {
            await this.CalculateClientSize();
        }

        if (this.pRootElement) {
            this.pRootElement.style.transform = `translate(${this.rcWindow.left}px, ${this.rcWindow.top}px)`;
            this.pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
            this.pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
            this.pRootElement.style.zIndex = `${this.zIndex}`;
        }

        if (this.stateFlags.bSendSizeMoveMsgs) {
            await NtDispatchMessage(this._peb, [this._hWnd, WM.SIZE, 0, { cx: newCX, cy: newCY }]);
            await NtDispatchMessage(this._peb, [this._hWnd, WM.MOVE, 0, { x: this.rcWindow.left, y: this.rcWindow.top }]);
        }

        if (bRepaint && ((oldCX !== newCX || oldCY !== newCY) || !this.stateFlags.bHasHadInitialPaint)) {
            this.stateFlags.bHasHadInitialPaint = true;

            // if (this._hDC && !(this.dwStyle & WS.CHILD)) {
            await GreResizeDC(this._hDC, this.rcClient);
            // }

            // await NtDispatchMessage(this._peb, [this._hWnd, WM.PAINT, 0, 0]);
            await NtUserInvalidateRect(this._hWnd, null, true);
        }
    }

    public async CalculateClientSize(): Promise<void> {
        let rect = { ...this.rcWindow };
        rect.right -= rect.left;
        rect.bottom -= rect.top;
        rect.left = rect.top = 0;

        const newRect = <LPRECT>await NtDispatchMessage(this._peb, [this._hWnd, WM.NCCALCSIZE, 0, rect]);
        if (newRect) {
            this._rcClient = newRect;
        }
    }

    public Dispose(): void {
        this.Hide();

        if (this.wndParent)
            ObCloseHandle(this.wndParent.hWnd);

        if (this.wndOwner)
            ObCloseHandle(this.wndOwner.hWnd);

        if (this._hDC)
            ObCloseHandle(this._hDC);

        if (this._hMenu)
            ObCloseHandle(this._hMenu);

        if (this._hRootElement)
            ObCloseHandle(this._hRootElement);

        NtUserUnlinkWindow(this);
    }

    public FixZOrder(): void {
        for (let child = this.wndChild; child; child = child.wndNext) {
            child.FixZOrder();
        }

        if (this.pRootElement)
            this.pRootElement.style.zIndex = `${this.zIndex}`;
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
                    x = monitor.cWndStack * NtUserGetSystemMetrics(this.peb, SM.CXSIZE) + NtUserGetSystemMetrics(this.peb, SM.CXFRAME);
                    y = monitor.cWndStack * NtUserGetSystemMetrics(this.peb, SM.CXSIZE) + NtUserGetSystemMetrics(this.peb, SM.CXFRAME);

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
        if (!this.pRootElement) {
            await NtDispatchMessage(this._peb, [this._hWnd, WMP.CREATEELEMENT, 0, 0])
        }

        // for now, dont do a dirty flag, just set the style
        if (this.pRootElement) {
            this.pRootElement.style.transform = `translate(${this.rcWindow.left}px, ${this.rcWindow.top}px)`;
            this.pRootElement.style.width = `${this.rcWindow.right - this.rcWindow.left}px`;
            this.pRootElement.style.height = `${this.rcWindow.bottom - this.rcWindow.top}px`;
            this.pRootElement.style.position = "absolute";
            this.pRootElement.style.zIndex = `${this.zIndex}`;
        }
        else {
            console.warn("Root element was not created!!")
        }

        // if we're a top level window, allocate a DC
        if (!(this.dwStyle & WS.CHILD)) {
            this._hDC = GreAllocDCForWindow(this._peb, this._hWnd);
        }
        else {
            // we should use the parent's DC, with an additional transform
            // for now, just allocate a new DC
            this._hDC = GreAllocDCForWindow(this._peb, this._hWnd);
        }

        if (!this._hDC)
            return;

        await GreResizeDC(this._hDC, this.rcClient);
        await NtUserInvalidateRect(this._hWnd, null, true);
    }

    public UpdateWindowStyle(dwOldStyle: number, dwNewStyle: number): void {
        if (!this.pRootElement)
            return;

        this.FixWindowCoordinates();

        NtPostMessage(this._peb, [this._hWnd, WMP.UPDATEWINDOWSTYLE, dwNewStyle, dwOldStyle]);
        NtPostMessage(this._peb, [this._hWnd, WM.STYLECHANGED, -16, { oldStyle: dwOldStyle, newStyle: dwNewStyle }]);
    }

    public *GetChildren(): IterableIterator<HWND> {
        let child = this.wndChild;
        while (child) {
            yield child.hWnd;
            child = child.wndNext;
        }
    }

    private CalculateZIndex(): number {
        let zIndex = 0;
        let prev = this.#wndNext;
        while (prev) {
            zIndex++;
            prev = prev.wndNext;
        }

        return zIndex;
    }
}

export type PWND = WND | null;