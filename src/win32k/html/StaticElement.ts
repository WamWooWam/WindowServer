// represents a "STATIC" Window Class.

import { COLOR, SS } from "../../types/user32.types.js";

import { IntGetSysColor } from "../../ntos/win32k/brush.js";
import WND from "../../ntos/win32k/wnd.js";
import WindowElementBase from "./WindowElementBase.js";

const NumToHexColor = (num: number) => {
    const hex = num.toString(16);
    return '#' + '0'.repeat(6 - hex.length) + hex;
}

export class StaticElement extends WindowElementBase {

    private _wnd: WND;
    private _text: HTMLSpanElement

    constructor(wnd: WND) {
        super();

        this._wnd = wnd;
        this.dwStyle = wnd.dwStyle.toString();
        this.dwExStyle = wnd.dwExStyle.toString();

        this._text = document.createElement('span');
        this.appendChild(this._text);
    }

    parseStyleCore(dwStyle: string): number {
        if (dwStyle.startsWith('SS_')) {
            const style = dwStyle.replace('SS_', '');
            return SS[style as keyof typeof SS];
        }

        return null;
    }

    applyStylesCore(dwStyle: number): void {
        const type = dwStyle & SS.TYPEMASK;

        const blackFrame = NumToHexColor(IntGetSysColor(COLOR.DKSHADOW3D));
        const grayFrame = NumToHexColor(IntGetSysColor(COLOR.SHADOW3D));
        const whiteFrame = NumToHexColor(IntGetSysColor(COLOR.HIGHLIGHT3D));

        switch (type) {
            case SS.LEFT:
            case SS.SIMPLE:
                this.style.textAlign = 'left';
                break;
            case SS.CENTER:
                this.style.textAlign = 'center';
                break;
            case SS.RIGHT:
                this.style.textAlign = 'right';
                break;
            case SS.ICON:
                break;
            case SS.BLACKRECT:
                this.style.backgroundColor = blackFrame;
                break;
            case SS.GRAYRECT:
                this.style.backgroundColor = grayFrame;
                break;
            case SS.WHITERECT:
                this.style.backgroundColor = whiteFrame;
                break;
            case SS.BLACKFRAME:
                this.style.border = `1px solid ${blackFrame}`;
                break;
            case SS.GRAYFRAME:
                this.style.border = `1px solid ${grayFrame}`;
                break;
            case SS.WHITEFRAME:
                this.style.border = `1px solid ${whiteFrame}`;
                break;
            case SS.ETCHEDFRAME:
                this.style.boxShadow = `inset -1px -1px ${whiteFrame}, inset 1px 1px ${grayFrame}, inset -2px -2px ${grayFrame}, inset 2px 2px ${whiteFrame}`;
                break;
            case SS.ETCHEDHORZ:
                // same as above except only horizontally
                this.style.boxShadow = `inset 0 -1px ${whiteFrame}, inset 0 1px ${grayFrame}, inset 0 -2px ${grayFrame}, inset 0 2px ${whiteFrame}`;
                break;
            case SS.ETCHEDVERT:
                // same as above except only vertically
                this.style.boxShadow = `inset -1px 0 ${whiteFrame}, inset 1px 0 ${grayFrame}, inset -2px 0 ${grayFrame}, inset 2px 0 ${whiteFrame}`;
                break;
        }

        switch (type) {
            case SS.LEFT:
            case SS.CENTER:
            case SS.RIGHT:
            case SS.SIMPLE:
                this._text.innerText = this._wnd.lpszName;
                break;
            default:
                this._text.innerText = '';
                break;
        }

    }
}

customElements.define('x-static', StaticElement);