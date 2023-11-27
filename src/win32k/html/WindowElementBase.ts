import { WS } from "../../types/user32.types.js";

export default abstract class WindowElementBase extends HTMLElement {
    private _style: number = 0;
    private _exStyle: number = 0;

    static get observedAttributes() {
        return ['window-title', 'window-style', 'window-ex-style'];
    }

    get title(): string {
        return this.getAttribute("window-title");
    }

    set title(value: string) {
        this.setAttribute("window-title", value);
    }

    get dwStyle(): string {
        return this.getAttribute("window-style");
    }

    set dwStyle(value: string) {
        this.setAttribute("window-style", value);
    }

    get dwExStyle(): string {
        return this.getAttribute("window-ex-style");
    }

    set dwExStyle(value: string) {
        this.setAttribute("window-ex-style", value);
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.applyStyles(this.dwStyle);
        this.applyExStyles(this.dwExStyle);
    }

    disconnectedCallback() {
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if(!this.isConnected) return;
        switch (name) {
            case "window-title":
                break;
            case "window-style":
                this.applyStyles(newValue);
                break;
            case "window-ex-style":
                this.applyExStyles(newValue);
                break;
        }

    }

    applyStyles(dwNewStyle: string): void {
        if(dwNewStyle === null) return;
        
        const dwStyle = this.parseWindowStyle(dwNewStyle);
        if (dwStyle === this._style) {
            return;
        }

        this._style = dwStyle;

        this.applyStylesCore(dwStyle);
    }

    applyExStyles(dwNewStyle: string): void {
        if(dwNewStyle === null) return;

        const dwStyle = this.parseExWindowStyle(dwNewStyle);
        if (dwStyle === this._exStyle) {
            return;
        }

        this._exStyle = dwStyle;

        this.applyExStylesCore(dwStyle);
    }

    parseWindowStyle(dwStyle: string): number {
        if (Number.isInteger(parseInt(dwStyle))) {
            return parseInt(dwStyle);
        }

        let style = 0;
        let styles = dwStyle.split("|");
        for (let i = 0; i < styles.length; i++) {
            let styleName = styles[i].trim();
            if (styleName.startsWith("WS_")) {
                styleName = styleName.substring(3);
                style |= WS[styleName as keyof typeof WS] as number;
                continue;
            }

            let parsedStyle = this.parseStyleCore(styleName);
            if (parsedStyle !== null || parsedStyle !== undefined) {
                style |= parsedStyle;
            }
            else {
                console.warn("unknown style", styleName);
            }
        }

        return style;
    }


    parseExWindowStyle(dwStyle: string): number {
        if (Number.isInteger(parseInt(dwStyle))) {
            return parseInt(dwStyle);
        }

        let style = 0;
        let styles = dwStyle.split("|");
        for (let i = 0; i < styles.length; i++) {
            let styleName = styles[i].trim();
            if (styleName.startsWith("WS_EX_")) {
                styleName = styleName.substring(6);
                style |= WS.EX[styleName as keyof typeof WS.EX] as number;
                continue;
            }

            let parsedExStyle = this.parseExStyleCore(styleName);
            if (parsedExStyle !== null || parsedExStyle !== undefined) {
                style |= parsedExStyle;
            }
            else {
                console.warn("unknown style", styleName);
            }
        }

        return style;
    }


    parseStyleCore(dwStyle: string): number { return 0; }
    parseExStyleCore(dwStyle: string): number { return 0; }
    applyStylesCore(dwNewStyle: number): void { }
    applyExStylesCore(dwNewStyle: number): void { }
}