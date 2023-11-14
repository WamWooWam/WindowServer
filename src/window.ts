import { CW_USEDEFAULT, HINSTANCE, HMENU, HWND } from "./types/user32.types.js";

import { ObSetObject } from "./objects.js";

export class Window {
    private hWnd: HWND;
    private lpszClassName: string;
    private lpszTitle: string;
    private dwStyle: number;
    private dwX: number;
    private dwY: number;
    private dwWidth: number;
    private dwHeight: number;
    private hParent: HWND;
    private hMenu: HMENU;
    private hInstance: HINSTANCE;
    private lpParam: any;

    private rootElement: HTMLElement;

    constructor(
        className: string,
        title: string,
        style: number,
        x: number,
        y: number,
        width: number,
        height: number,
        parent: HWND,
        menu: HMENU,
        hInstance: HINSTANCE,
        lpParam: any) {
        this.lpszClassName = className;
        this.lpszTitle = title;
        this.dwStyle = style;
        this.dwX = x;
        this.dwY = y;
        this.dwWidth = width;
        this.dwHeight = height;
        this.hParent = parent;
        this.hMenu = menu;
        this.hInstance = hInstance;
        this.lpParam = lpParam;

        this.hWnd = ObSetObject(this, this.hParent !== 0 ? this.hParent : hInstance, this.destroy.bind(this));
        this.rootElement = document.createElement("div");

        if (this.dwX === CW_USEDEFAULT) {
            this.dwX = 0;
        }

        if (this.dwY === CW_USEDEFAULT) {
            this.dwY = 0;
        }

        if (this.dwWidth === CW_USEDEFAULT) {
            this.dwWidth = 640;
        }

        if (this.dwHeight === CW_USEDEFAULT) {
            this.dwHeight = 480;
        }
    }

    public getHandle(): HWND {
        return this.hWnd;
    }

    public destroy(): void {

    }
}