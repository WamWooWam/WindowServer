import WND from "../wnd.js";
import { WS } from "../../types/user32.types.js";
import WindowElementBase from "./WindowElementBase.js";

export default class WindowElement extends WindowElementBase {

    titleBar: HTMLElement;
    titleBarText: HTMLElement;
    titleBarControls: HTMLElement;

    icon: HTMLImageElement;

    closeButton: HTMLElement;
    minimizeButton: HTMLElement;
    maximizeButton: HTMLElement;

    windowBody: HTMLElement;

    static get observedAttributes() {
        return [...super.observedAttributes, 'icon'];
    }

    constructor(wnd: WND) {
        super(wnd);

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
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "window-title":
                this.titleBarText.innerText = newValue;
                break;
            case "icon":
                this.icon.src = newValue;
                break;
        }
    }

    invalidateStyle() {
        super.invalidateStyle();

        if (this.wnd && !this.wnd.stateFlags.bIsActiveFrame) {
            this.titleBar.classList.add("inactive");
        }
        else {
            this.titleBar.classList.remove("inactive");
        }
    }

    applyStylesCore(style: number) {
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

        if (this.wnd && !this.wnd.stateFlags.bIsActiveFrame) {
            this.titleBar.classList.add("inactive");
        }
        else {
            this.titleBar.classList.remove("inactive");
        }

        if ((style & WS.MAXIMIZE) === WS.MAXIMIZE) {
            this.windowBody.classList.add("maximized");
            this.maximizeButton.setAttribute("aria-label", "Restore");
        }
        else {
            this.windowBody.classList.remove("maximized");
            this.maximizeButton.setAttribute("aria-label", "Maximize");
        }

        if ((style & WS.ICONIC) === WS.ICONIC) {
            this.windowBody.classList.add("minimized");
            this.minimizeButton.setAttribute("aria-label", "Restore");
        }
        else {
            this.windowBody.classList.remove("minimized");
            this.minimizeButton.setAttribute("aria-label", "Minimize");
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
    }
}

customElements.define('x-window', WindowElement);