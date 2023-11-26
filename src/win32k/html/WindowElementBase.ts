export default class WindowElementBase extends HTMLElement {
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

    constructor() {
        super();
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
}