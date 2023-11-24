export default class DesktopElement extends HTMLElement {
    constructor() {
        super();

        let template = document.getElementById("x-desktop-template") as HTMLTemplateElement;
        let templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }
}

customElements.define('x-desktop', DesktopElement); 