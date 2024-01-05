// represents a "STATIC" Window Class.

import { COLOR, SS } from "../../subsystems/user32.js";

import { IntGetSysColor } from "../brush.js";
import WND from "../wnd.js";
import WindowElementBase from "./WindowElementBase.js";

const SS_CLASS_TABLE = {
    [SS.LEFT]: 'left',
    [SS.CENTER]: 'center',
    [SS.RIGHT]: 'right',
    [SS.SIMPLE]: 'simple',
    [SS.ETCHEDFRAME]: 'etched-frame',
    [SS.ETCHEDHORZ]: 'etched-horz',
    [SS.ETCHEDVERT]: 'etched-vert',
    [SS.BLACKRECT]: 'black-rect',
    [SS.GRAYRECT]: 'gray-rect',
    [SS.WHITERECT]: 'white-rect',
    [SS.BLACKFRAME]: 'black-frame',
    [SS.GRAYFRAME]: 'gray-frame',
    [SS.WHITEFRAME]: 'white-frame'
};

export class StaticElement extends WindowElementBase {

    private _text: HTMLSpanElement

    constructor(wnd: WND) {
        super(wnd);

        this._text = document.createElement('span');
        this.appendChild(this._text);
    }

    parseStyleCore(dwStyle: string): number {
        if (dwStyle.startsWith('SS_')) {
            const style = dwStyle.replace('SS_', '');
            return SS[style as keyof typeof SS];
        }

        return 0;
    }

    applyStylesCore(dwStyle: number): void {
        const type = dwStyle & SS.TYPEMASK;
        this.className = SS_CLASS_TABLE[type as keyof typeof SS_CLASS_TABLE];

        switch (type) {
            case SS.LEFT:
            case SS.CENTER:
            case SS.RIGHT:
            case SS.SIMPLE:
                this._text.innerText = this.wnd.lpszName;
                break;
            default:
                this._text.innerText = '';
                break;
        }

    }
}

customElements.define('x-static', StaticElement);