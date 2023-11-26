// represents a "STATIC" Window Class.

import { SS } from "../../types/user32.types.js";
import WindowElementBase from "./WindowElementBase.js";

export class StaticElement extends WindowElementBase {
    parseStyleCore(dwStyle: string): number {
        if (dwStyle.startsWith('SS_')) {
            const style = dwStyle.replace('SS_', '');
            return SS[style as keyof typeof SS];
        }

        return null;
    }

    applyStylesCore(dwStyle: number): void {
        if (dwStyle & SS.LEFT) {
            this.style.textAlign = "left";
        }

        if (dwStyle & SS.RIGHT) {
            this.style.textAlign = "right";
        }
        
        if (dwStyle & SS.CENTER) {
            this.style.textAlign = "center";
        }
    }
}

customElements.define('x-static', StaticElement);