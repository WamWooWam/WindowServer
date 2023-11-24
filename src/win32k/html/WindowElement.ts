import { WS } from "../../types/user32.types.js";

export default class WindowElement extends HTMLElement {

    titleBar: HTMLElement;
    titleBarText: HTMLElement;
    titleBarControls: HTMLElement;

    icon: HTMLImageElement;

    closeButton: HTMLElement;
    minimizeButton: HTMLElement;
    maximizeButton: HTMLElement;

    windowBody: HTMLElement;

    private _style: number = 0;

    static get observedAttributes() {
        return ['title', 'window-style', 'icon'];
    }

    constructor() {
        super();

        let template = document.getElementById("x-window-template") as HTMLTemplateElement;
        let templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(templateContent.cloneNode(true));

        this.titleBar = shadowRoot.querySelector(".title-bar");
        this.titleBarText = shadowRoot.querySelector(".title-bar-text");
        this.titleBarControls = shadowRoot.querySelector(".title-bar-controls");

        this.icon = shadowRoot.querySelector(".title-bar-icon");

        this.closeButton = shadowRoot.querySelector(".close-button");
        this.minimizeButton = shadowRoot.querySelector(".minimize-button");
        this.maximizeButton = shadowRoot.querySelector(".maximize-button");

        this.windowBody = shadowRoot.querySelector(".window-body");

        this.titleBar.style.display = "none";
        this.titleBarText.style.display = "none";
        this.titleBarControls.style.display = "none";
        this.icon.style.display = "none";
        this.closeButton.style.display = "none";
        this.minimizeButton.style.display = "none";
        this.maximizeButton.style.display = "none";
    }

    connectedCallback() {
        
    }

    disconnectedCallback() {
        console.log('disconnectedCallback');
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        console.log('attributeChangedCallback', name, oldValue, newValue);
        switch (name) {
            case "title":
                this.titleBarText.innerText = newValue;
                break;
            case "window-style":
                this.applyWindowStyle(newValue);
                break;
            case "icon":
                this.icon.src = newValue;
                break;
        }
    }

    applyWindowStyle(newStyle: string) {
        // window style is *either* a number indicating a bitwise combination of styles
        // or a string deliminated by | of window styles to apply
        const style = this.parseWindowStyle(newStyle);
        if (this._style === style) {
            return;
        }

        if ((style & WS.CAPTION) === WS.CAPTION) {
            this.titleBar.style.display = "";
            this.titleBarText.style.display = "";
            this.titleBarControls.style.display = "";
            this.closeButton.style.display = "";
        }
        else {
            this.titleBar.style.display = "none";
            this.titleBarText.style.display = "none";
            this.titleBarControls.style.display = "none";
            this.closeButton.style.display = "none";
        }

        // TODO: close button is controlled by SC_CLOSE in the system menu

        if ((style & WS.MINIMIZEBOX) === WS.MINIMIZEBOX) {
            this.minimizeButton.style.display = "";
        }
        else {
            this.minimizeButton.style.display = "none";
        }

        if ((style & WS.MAXIMIZEBOX) === WS.MAXIMIZEBOX) {
            this.maximizeButton.style.display = "";
        }
        else {
            this.maximizeButton.style.display = "none";
        }

        if ((style & WS.ACTIVE) === WS.ACTIVE) {
            this.titleBar.classList.remove("inactive");
        }
        else {
            this.titleBar.classList.add("inactive");
        }

        if ((style & WS.MAXIMIZED) === WS.MAXIMIZED) {
            this.windowBody.classList.add("maximized");
            this.maximizeButton.setAttribute("aria-label", "Restore");
        }
        else {
            this.windowBody.classList.remove("maximized");
            this.maximizeButton.setAttribute("aria-label", "Maximize");
        }

        if ((style & WS.ICONIC) === WS.ICONIC) {
            this.windowBody.classList.add("minimized");
        }
        else {
            this.windowBody.classList.remove("minimized");
        }

        if ((style & WS.DISABLED) === WS.DISABLED) {
            this.titleBar.classList.add("disabled");
        }

        if ((style & WS.VISIBLE) === WS.VISIBLE) {
            this.style.opacity = "1";
        }
        else {
            this.style.opacity = "0";
        }

        this._style = style;
    }

    parseWindowStyle(newStyle: string): number {
        let style = 0;
        if (Number.isInteger(parseInt(newStyle))) {
            style = parseInt(newStyle);
        }
        else {
            let styles = newStyle.split("|");
            for (let i = 0; i < styles.length; i++) {
                let styleName = styles[i].trim();
                if (styleName.startsWith("WS_EX_")) {
                    styleName = styleName.substring(6);
                    style |= WS.EX[styleName as keyof typeof WS.EX];
                }
                else if (styleName.startsWith("WS_")) {
                    styleName = styleName.substring(3);
                    style |= WS[styleName as keyof typeof WS] as number;
                }
                else {
                    console.warn("unknown style", styleName);
                }
            }
        }

        return style;
    }

    get title(): string {
        return this.getAttribute("title");
    }

    set title(value: string) {
        this.setAttribute("title", value);
    }

    get windowStyle(): string {
        return this.getAttribute("window-style");
    }

    set windowStyle(value: string) {
        this.setAttribute("window-style", value);
    }
}

customElements.define('x-window', WindowElement);