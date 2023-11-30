import { BS, WS } from "../../types/user32.types.js";

import WND from "../wnd.js";
import WindowElementBase from "./WindowElementBase.js";

// win32 is lying to you, a button is actually any one fo the following:
// - a button
// - a checkbox (or a tri-state checkbox)
// - a radio button 
// - a group box
export class ButtonElement extends WindowElementBase {
    primaryElement: HTMLElement;

    maxCheckState: number;

    get checkState(): number {
        return parseInt(this.getAttribute("check-state"));
    }

    set checkState(value: number) {
        this.setAttribute("check-state", value.toString());
    }

    get pressState(): boolean {
        return !!(this.getAttribute("press-state"));
    }

    set pressState(value: boolean) {
        this.setAttribute("press-state", value.toString());
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'check-state', 'press-state'];
    }

    constructor(wnd: WND) {
        super(wnd);

        this.checkState = 0;
        this.pressState = false;
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (!this.isConnected) return;

        switch (name) {
            case "check-state":
                this.applyCheckState(parseInt(newValue));
                return;
            case "press-state":
                this.applyPressState(newValue === 'true');
                return;
        }

        super.attributeChangedCallback(name, oldValue, newValue);
    }

    applyCheckState(value: number): void {
        if (value > this.maxCheckState) {
            value = this.maxCheckState;
        }

        if (value < 0) {
            value = 0;
        }

        if (!this.primaryElement) return;

        if (this.primaryElement instanceof HTMLInputElement) {
            if (value === 0) {
                this.primaryElement.checked = false;
                this.primaryElement.indeterminate = false;
            }
            else if (value === 1) {
                this.primaryElement.checked = true;
                this.primaryElement.indeterminate = false;
            }
            else if (value === 2) {
                this.primaryElement.checked = true;
                this.primaryElement.indeterminate = true;
            }
        }
        else if (this.primaryElement instanceof HTMLDivElement) {
            if (value === 0) {
                this.primaryElement.classList.remove("active");
            }
            else {
                this.primaryElement.classList.add("active");
            }
        }
    }

    applyPressState(value: boolean): void {
        const element = this.primaryElement ?? this;
        if (value) {
            element.classList.add("active");
        }
        else {
            element.classList.remove("active");
        }
    }

    parseStyleCore(dwStyle: string): number {
        if (dwStyle.startsWith('BS_')) {
            const style = dwStyle.replace('BS_', '');
            return BS[style as keyof typeof BS];
        }

        return null;
    }

    applyStylesCore(dwStyle: number): void {
        const type = dwStyle & BS.TYPEMASK;
        switch (type) {
            case BS.PUSHBUTTON:
                this.createButton(false);
                break;
            case BS.DEFPUSHBUTTON:
                this.createButton(true);
                break;
            case BS.CHECKBOX:
            case BS.THREESTATE:
            case BS.AUTO3STATE:
            case BS.AUTOCHECKBOX:
                this.createCheckBox(type);
                break;
            case BS.RADIOBUTTON:
            case BS.AUTORADIOBUTTON:
                this.createRadioButton();
                break;
            case BS.GROUPBOX:
                this.createGroupBox();
                break;
            case BS.PUSHBOX:
                this.createPushBox();
                break;
            case BS.OWNERDRAW:
            case BS.USERBUTTON:
                break;
            default:
                throw new Error(`Unknown button type: ${type}`);
        }

        if (dwStyle & BS.LEFTTEXT || dwStyle & BS.LEFT) {
            this.classList.add("left");
        }
        else if (dwStyle & BS.RIGHT) {
            this.classList.add("right");
        }
        else { // (dwStyle & BS.CENTER) 
            // default
        }

        if (dwStyle & BS.TOP) {
            this.classList.add("top");
        }
        else if (dwStyle & BS.BOTTOM) {
            this.classList.add("bottom");
        }
        else { // (dwStyle & BS.VCENTER) 
            // default
        }

        if (dwStyle & BS.MULTILINE) {
            this.classList.add("multiline");
        }

        if (dwStyle & WS.DISABLED) {
            this.classList.add("disabled");
            if (this.primaryElement) {
                this.primaryElement.setAttribute("disabled", "true");
                this.primaryElement.classList.add("disabled");
            }
        }
        else {
            if (this.primaryElement) {
                this.primaryElement.removeAttribute("disabled");
                this.primaryElement.classList.remove("disabled");
            }
            this.classList.remove("disabled");
        }
    }

    createButton(isDefault: boolean): void {
        const shadowRoot = this.applyTemplate("button");
        const btn = shadowRoot.querySelector(".button") as HTMLDivElement;

        const textSpan = shadowRoot.querySelector(".text") as HTMLSpanElement;
        textSpan.innerText = this.wnd.lpszName;

        const icon = shadowRoot.querySelector(".icon") as HTMLImageElement;
        icon.style.display = "none";

        if (isDefault) {
            btn.classList.add("default");
        }

        this.primaryElement = btn;
    }

    createCheckBox(type: BS): void {
        this.maxCheckState = BS.AUTO3STATE || BS.THREESTATE ? 2 : 1;

        const shadowRoot = this.applyTemplate("checkbox");
        const textSpan = shadowRoot.querySelector(".text") as HTMLSpanElement;
        textSpan.innerText = this.wnd.lpszName;

        const check = shadowRoot.querySelector("input[type='checkbox']") as HTMLInputElement;
        this.primaryElement = check;
    }

    createRadioButton(): void {
        const shadowRoot = this.applyTemplate("radio-button");
        const textSpan = shadowRoot.querySelector(".text") as HTMLSpanElement;
        textSpan.innerText = this.wnd.lpszName;

        const check = shadowRoot.querySelector("input[type='radio']") as HTMLInputElement;
        this.primaryElement = check;
    }

    createGroupBox(): void {
        const shadowRoot = this.applyTemplate("group-box");
        const textSpan = shadowRoot.querySelector(".text") as HTMLSpanElement;
        textSpan.innerText = this.wnd.lpszName;
    }

    createPushBox(): void {
        const shadowRoot = this.applyTemplate("push-box");
        const textSpan = shadowRoot.querySelector(".text") as HTMLSpanElement;
        textSpan.innerText = this.wnd.lpszName;
    }

    applyTemplate(type: string): ShadowRoot {
        const template = document.getElementById(`x-${type}-template`) as HTMLTemplateElement;
        const templateContent = template.content;

        const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = "";
        shadowRoot.appendChild(templateContent.cloneNode(true));

        return shadowRoot;
    }
}

customElements.define('x-button', ButtonElement);