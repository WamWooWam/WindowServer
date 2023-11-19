import { BDR, BF, COLOR, DC as DCF, DFC, DFCS, EDGE, HICON, LOGFONT, NONCLIENTMETRICS, SM_CXSIZE, SM_CXSMSIZE, SM_CYCAPTION, SM_CYSIZE, SM_CYSMSIZE, SPI, WS_EX_TOOLWINDOW, WS_MAXIMIZE, WS_MAXIMIZEBOX, WS_MINIMIZE, WS_MINIMIZEBOX, WS_SYSMENU } from "../types/user32.types.js";
import DC, { GreSelectObject } from "./gdi/dc.js";
import { DEFAULT_CHARSET, FW, HBRUSH, HDC, HFONT, NONANTIALIASED_QUALITY, NULL_PEN, PS, RECT, SIZE, TRANSPARENT } from "../types/gdi32.types.js";
import { GreGetObj, GreGetStockObject } from "./gdi/obj.js";
import { IntGetSysColor, IntGetSysColorBrush } from "./brush.js";
import {
    LTInnerNormal,
    LTInnerSoft,
    LTOuterNormal,
    LTOuterSoft,
    LTRBInnerFlat,
    LTRBInnerMono,
    LTRBOuterFlat,
    LTRBOuterMono,
    RBInnerNormal,
    RBInnerSoft,
    RBOuterNormal,
    RBOuterSoft
} from "./tbls.js";
import { NtGdiCreateFontIndirect, NtGdiCreatePen, NtGdiDeleteObject, NtGdiFillGradientRect, NtGdiGetBkMode, NtGdiGetStockObject, NtGdiGetTextColor, NtGdiGetTextExtentEx, NtGdiLineTo, NtGdiMoveTo, NtGdiSelectObject, NtGdiSetBkMode, NtGdiSetDCPenColor, NtGdiSetTextColor, NtGdiTextOut } from "./gdi/ntgdi.js";
import { NtIntGetSystemMetrics, NtUserSystemParametersInfo } from "./metrics.js";

import BRUSH from "./gdi/brush.js";
import { GreCreateFontIndirect } from "./gdi/font.js";
import { GreRectangle } from "./gdi/draw.js";
import PEN from "./gdi/pen.js";
import { WND } from "./wnd.js";

export function NtUserFillRect(hDC: HDC, prc: RECT, hbr: HBRUSH) {
    const dc = GreGetObj<DC>(hDC);
    const brush = GreGetObj<BRUSH>(hbr);
    const pen = GreGetStockObject<PEN>(NULL_PEN);

    const previousBrush = GreSelectObject(dc, brush);
    const previousPen = GreSelectObject(dc, pen);
    GreRectangle(dc, prc);

    GreSelectObject(dc, previousBrush);
    GreSelectObject(dc, previousPen);
}

export function NtUserDrawFrameControl(hdc: HDC, rc: RECT, uType: number, uState: number) {
    switch (uType) {
        case DFC.BUTTON:
            return NtDrawFrameButton(hdc, rc, uState);
        case DFC.CAPTION:
            return NtUserDrawFrameCaption(hdc, rc, uState);
        // case DFC.MENU:
        //     return NtUserDrawFrameMenu(hdc, rc, uState);
        // case DFC.SCROLL:
        //     return NtUserDrawFrameScroll(hdc, rc, uState);
        default:
            console.error("Invalid button type=0x%04x\n", uType);
    }

    return false;
}

export function NtDrawFrameButton(hdc: HDC, rc: RECT, uState: number) {
    switch (uState & 0x1f) {
        case DFCS.BUTTONPUSH:
            return NtUserDrawFrameButtonPush(hdc, rc, uState);

        // case DFCS.BUTTONCHECK:
        // case DFCS.BUTTON3STATE:
        //     return NtUserDrawFrameButtonCheckRadio(hdc, rc, uState, false);

        // case DFCS.BUTTONRADIOIMAGE:
        // case DFCS.BUTTONRADIOMASK:
        //     if (uState & DFCS.BUTTONRADIOIMAGE)
        //         NtUserFillRect(hdc, rc, NtGdiGetStockObject<HBRUSH>(BLACK_BRUSH)); /* Fill by black */
        //     else
        //         NtUserFillRect(hdc, rc, NtGdiGetStockObject<HBRUSH>(WHITE_BRUSH)); /* Fill by white */

        //     return NtUserDrawFrameButtonCheckRadio(hdc, rc, uState, true);

        // case DFCS.BUTTONRADIO:
        //     return NtUserDrawFrameButtonCheckRadio(hdc, rc, uState, true);

        default:
            console.error("Invalid button state=0x%04x\n", uState);
    }

    return false;
}

function UITOOLS_MakeSquareRect(src: RECT, dst: RECT): number {
    let Width = src.right - src.left;
    let Height = src.bottom - src.top;
    let SmallDiam = Width > Height ? Height : Width;

    Object.assign(dst, src);

    /* Make it a square box */
    if (Width < Height)      /* SmallDiam == Width */ {
        dst.top += (Height - Width) / 2;
        dst.bottom = dst.top + SmallDiam;
    }
    else if (Width > Height) /* SmallDiam == Height */ {
        dst.left += (Width - Height) / 2;
        dst.right = dst.left + SmallDiam;
    }

    return SmallDiam;
}

function NtGdiOffsetRect(rc: RECT, dx: number, dy: number) {
    rc.left += dx;
    rc.right += dx;
    rc.top += dy;
    rc.bottom += dy;
}

export function NtUserDrawFrameCaption(dc: HDC, r: RECT, uFlags: number) {
    let lf: LOGFONT = {} as LOGFONT;
    let hFont: HFONT, hOldFont: HFONT;
    let clrsave: number;
    let myr: RECT = { ...r };
    let bkmode: number;
    let symbol;
    switch (uFlags & 0xf) {
        case DFCS.CAPTIONCLOSE:
            symbol = 'r';
            break;
        case DFCS.CAPTIONHELP:
            symbol = 's';
            break;
        case DFCS.CAPTIONMIN:
            symbol = '0';
            break;
        case DFCS.CAPTIONMAX:
            symbol = '1';
            break;
        case DFCS.CAPTIONRESTORE:
            symbol = '2';
            break;
        default:
            console.error("Invalid caption; flags=0x%04x\n", uFlags);
            return false;
    }

    NtUserDrawRectEdge(dc, r, (uFlags & DFCS.PUSHED) ? EDGE.SUNKEN : EDGE.RAISED, BF.RECT | BF.MIDDLE | BF.SOFT);

    // RtlZeroMemory(& lf, sizeof(LOGFONTW));
    UITOOLS_MakeSquareRect(r, myr);
    myr.left += 1;
    myr.top += 1;
    myr.right -= 1;
    myr.bottom -= 1;

    if (uFlags & DFCS.PUSHED)
        NtGdiOffsetRect(myr, 1, 1);

    lf.lfHeight = myr.bottom - myr.top;
    lf.lfWidth = 0;
    lf.lfWeight = FW.NORMAL;
    lf.lfCharSet = DEFAULT_CHARSET;
    lf.lfQuality = NONANTIALIASED_QUALITY;
    lf.lfFaceName = "Marlett";

    hFont = NtGdiCreateFontIndirect(lf);

    /* save font and text color */
    hOldFont = NtGdiSelectObject(dc, hFont);
    clrsave = NtGdiGetTextColor(dc);
    bkmode = NtGdiGetBkMode(dc);
    /* set color and drawing mode */
    NtGdiSetBkMode(dc, TRANSPARENT);
    if (uFlags & DFCS.INACTIVE) {
        /* draw shadow */
        NtGdiSetTextColor(dc, IntGetSysColor(COLOR.BTNHIGHLIGHT));
        NtGdiTextOut(dc, myr.left + 1, myr.top + 1, symbol);
    }
    NtGdiSetTextColor(dc, IntGetSysColor((uFlags & DFCS.INACTIVE) ? COLOR.BTNSHADOW : COLOR.BTNTEXT));
    /* draw selected symbol */
    NtGdiTextOut(dc, myr.left, myr.top, symbol);
    /* restore previous settings */
    NtGdiSetTextColor(dc, clrsave);
    NtGdiSelectObject(dc, hOldFont);
    NtGdiSetBkMode(dc, bkmode);
    NtGdiDeleteObject(hFont);

    return true;
}

export function NtUserDrawFrameButtonPush(dc: HDC, rc: RECT, uFlags: number) {
    let myRc = { ...rc };
    let edge;
    if (uFlags & (DFCS.PUSHED | DFCS.CHECKED | DFCS.FLAT))
        edge = EDGE.SUNKEN;
    else
        edge = EDGE.RAISED;

    if (uFlags & DFCS.CHECKED) {
        if (uFlags & DFCS.MONO)
            NtUserDrawRectEdge(dc, myRc, edge, BF.MONO | BF.RECT | BF.ADJUST);
        else
            NtUserDrawRectEdge(dc, myRc, edge, (uFlags & DFCS.FLAT) | BF.RECT | BF.SOFT | BF.ADJUST);

        // NtUserDrawCheckedRect(dc, myRc);
    }
    else {
        if (uFlags & DFCS.MONO) {
            NtUserDrawRectEdge(dc, myRc, edge, BF.MONO | BF.RECT | BF.ADJUST);
            NtUserFillRect(dc, myRc, IntGetSysColorBrush(COLOR.BTNFACE));
        }
        else {
            NtUserDrawRectEdge(dc, rc, edge, (uFlags & DFCS.FLAT) | BF.MIDDLE | BF.RECT | BF.SOFT);
        }
    }

    /* Adjust rectangle if asked */
    if (uFlags & DFCS.ADJUSTRECT) {
        rc.left += 2;
        rc.right -= 2;
        rc.top += 2;
        rc.bottom -= 2;
    }

    return true;
}

export function NtUserDrawRectEdge(hdc: HDC, rc: RECT, uType: EDGE, uFlags: BF) {
    let retVal = !(((uType & BDR.INNER) == BDR.INNER
        || (uType & BDR.OUTER) == BDR.OUTER)
        && !(uFlags & (BF.FLAT | BF.MONO)));

    const savePen = NtGdiSelectObject(hdc, NtGdiGetStockObject(NULL_PEN));

    let ltInnerPen = NtGdiGetStockObject(NULL_PEN),
        ltOuterPen = NtGdiGetStockObject(NULL_PEN),
        rbInnerPen = NtGdiGetStockObject(NULL_PEN),
        rbOuterPen = NtGdiGetStockObject(NULL_PEN);

    let ltInnerI = 0;
    let ltOuterI = 0;
    let rbInnerI = 0;
    let rbOuterI = 0;

    let lbPenPlus = 0;
    let rtPenPlus = 0;
    let rbPenPlus = 0;
    let ltPenPlus = 0;

    if (uFlags & BF.MONO) {
        ltInnerI = rbOuterI = LTRBInnerMono[uType & (BDR.INNER | BDR.OUTER)];
        ltOuterI = rbInnerI = LTRBOuterMono[uType & (BDR.INNER | BDR.OUTER)];
    }
    else if (uFlags & BF.FLAT) {
        ltInnerI = rbOuterI = LTRBInnerFlat[uType & (BDR.INNER | BDR.OUTER)];
        ltOuterI = rbInnerI = LTRBOuterFlat[uType & (BDR.INNER | BDR.OUTER)];

        if (ltInnerI != -1)
            ltInnerI = rbInnerI = COLOR.BTNFACE;
    }
    else if (uFlags & BF.SOFT) {
        ltInnerI = LTInnerSoft[uType & (BDR.INNER | BDR.OUTER)];
        ltOuterI = LTOuterSoft[uType & (BDR.INNER | BDR.OUTER)];
        rbInnerI = RBInnerSoft[uType & (BDR.INNER | BDR.OUTER)];
        rbOuterI = RBOuterSoft[uType & (BDR.INNER | BDR.OUTER)];
    }
    else {
        ltInnerI = LTInnerNormal[uType & (BDR.INNER | BDR.OUTER)];
        ltOuterI = LTOuterNormal[uType & (BDR.INNER | BDR.OUTER)];
        rbInnerI = RBInnerNormal[uType & (BDR.INNER | BDR.OUTER)];
        rbOuterI = RBOuterNormal[uType & (BDR.INNER | BDR.OUTER)];
    }

    if ((uFlags & BF.BOTTOMLEFT) == BF.BOTTOMLEFT)
        lbPenPlus = 1;
    if ((uFlags & BF.TOPRIGHT) == BF.TOPRIGHT)
        rtPenPlus = 1;
    if ((uFlags & BF.BOTTOMRIGHT) == BF.BOTTOMRIGHT)
        rbPenPlus = 1;
    if ((uFlags & BF.TOPLEFT) == BF.TOPLEFT)
        lbPenPlus = 1;

    if (ltInnerI != -1)
        ltInnerPen = NtGdiCreatePen(PS.SOLID, 1, IntGetSysColor(ltInnerI));
    if (ltOuterI != -1)
        ltOuterPen = NtGdiCreatePen(PS.SOLID, 1, IntGetSysColor(ltOuterI));
    if (rbInnerI != -1)
        rbInnerPen = NtGdiCreatePen(PS.SOLID, 1, IntGetSysColor(rbInnerI));
    if (rbOuterI != -1)
        rbOuterPen = NtGdiCreatePen(PS.SOLID, 1, IntGetSysColor(rbOuterI));

    const innerRect = { ...rc };
    if ((uFlags & BF.MIDDLE) && retVal) {
        NtUserFillRect(hdc, innerRect, IntGetSysColorBrush(uFlags & BF.MONO ? COLOR.WINDOW : COLOR.BTNFACE));
    }

    const savePoint = NtGdiMoveTo(hdc, 0, 0);
    /* Draw the outer edge */
    NtGdiSelectObject(hdc, ltOuterPen);
    // NtGdiSetDCPenColor(hdc, IntGetSysColor(ltOuterI));
    if (uFlags & BF.TOP) {
        NtGdiMoveTo(hdc, innerRect.left, innerRect.top);
        NtGdiLineTo(hdc, innerRect.right, innerRect.top);
    }
    if (uFlags & BF.LEFT) {
        NtGdiMoveTo(hdc, innerRect.left, innerRect.top);
        NtGdiLineTo(hdc, innerRect.left, innerRect.bottom);
    }
    NtGdiSelectObject(hdc, rbOuterPen);
    // NtGdiSetDCPenColor(hdc, IntGetSysColor(rbOuterI));
    if (uFlags & BF.BOTTOM) {
        NtGdiMoveTo(hdc, innerRect.left, innerRect.bottom - 1);
        NtGdiLineTo(hdc, innerRect.right, innerRect.bottom - 1);
    }
    if (uFlags & BF.RIGHT) {
        NtGdiMoveTo(hdc, innerRect.right - 1, innerRect.top);
        NtGdiLineTo(hdc, innerRect.right - 1, innerRect.bottom);
    }

    /* Draw the inner edge */
    NtGdiSelectObject(hdc, ltInnerPen);
    // NtGdiSetDCPenColor(hdc, IntGetSysColor(ltInnerI));
    if (uFlags & BF.TOP) {
        NtGdiMoveTo(hdc, innerRect.left + ltPenPlus, innerRect.top + 1);
        NtGdiLineTo(hdc, innerRect.right - rtPenPlus, innerRect.top + 1);
    }
    if (uFlags & BF.LEFT) {
        NtGdiMoveTo(hdc, innerRect.left + 1, innerRect.top + ltPenPlus);
        NtGdiLineTo(hdc, innerRect.left + 1, innerRect.bottom - lbPenPlus);
    }
    NtGdiSelectObject(hdc, rbInnerPen);
    // NtGdiSetDCPenColor(hdc, IntGetSysColor(rbInnerI));
    if (uFlags & BF.BOTTOM) {
        NtGdiMoveTo(hdc, innerRect.left + lbPenPlus, innerRect.bottom - 2);
        NtGdiLineTo(hdc, innerRect.right - rbPenPlus, innerRect.bottom - 2);
    }
    if (uFlags & BF.RIGHT) {
        NtGdiMoveTo(hdc, innerRect.right - 2, innerRect.top + rtPenPlus);
        NtGdiLineTo(hdc, innerRect.right - 2, innerRect.bottom - rbPenPlus);
    }

    if (((uFlags & BF.MIDDLE) && retVal) || (uFlags & BF.ADJUST)) {
        let add = (LTRBInnerMono[uType & (BDR.INNER | BDR.OUTER)] != -1 ? 1 : 0)
            + (LTRBOuterMono[uType & (BDR.INNER | BDR.OUTER)] != -1 ? 1 : 0);

        if (uFlags & BF.LEFT)
            innerRect.left += add;
        if (uFlags & BF.RIGHT)
            innerRect.right -= add;
        if (uFlags & BF.TOP)
            innerRect.top += add;
        if (uFlags & BF.BOTTOM)
            innerRect.bottom -= add;

        if (uFlags & BF.ADJUST)
            Object.assign(rc, innerRect);
    }

    /* Cleanup */
    NtGdiSelectObject(hdc, savePen);
    NtGdiMoveTo(hdc, savePoint.x, savePoint.y);
    return retVal;
}

export function NtUserDrawCaption(
    pWnd: WND,
    hDC: HDC,
    rc: RECT,
    hFont: HFONT,
    hIcon: HICON,
    lpTitle: string,
    uFlags: number) {
    let ret = false;
    let hBGBrush = null;
    let hOldBrush = null;
    let rect = { ...rc };
    let hasIcon = false;

    if (!hIcon && pWnd != null) {
        hasIcon = (uFlags & DCF.ICON) && !(uFlags * DCF.SMALLCAP) &&
            (pWnd.dwStyle & WS_SYSMENU) && !(pWnd.dwExStyle & WS_EX_TOOLWINDOW);
    }
    else {
        hasIcon = hIcon != null;
    }

    if ((uFlags & DCF.GRADIENT) && !(uFlags & DCF.INBUTTON)) {
        const colors = [
            IntGetSysColor((uFlags & DCF.ACTIVE) ? COLOR.ACTIVECAPTION : COLOR.INACTIVECAPTION),
            IntGetSysColor((uFlags & DCF.ACTIVE) ? COLOR.GRADIENTACTIVECAPTION : COLOR.GRADIENTINACTIVECAPTION)
        ];

        const stops = [
            { dwOffset: 0, dwColor: colors[0] },
            { dwOffset: 1, dwColor: colors[1] }
        ];
        const angle = 90;

        NtGdiFillGradientRect(hDC, rect, stops, angle);
    }
    else {
        if (uFlags & DCF.INBUTTON)
            hBGBrush = IntGetSysColorBrush(COLOR.FACE3D);
        else if (uFlags & DCF.ACTIVE)
            hBGBrush = IntGetSysColorBrush(COLOR.ACTIVECAPTION);
        else
            hBGBrush = IntGetSysColorBrush(COLOR.INACTIVECAPTION);

        hOldBrush = NtGdiSelectObject(hDC, hBGBrush);

        if (!hOldBrush) {
            return;
        }

        // if (!NtGdiPatBlt(hDc, Rect.left, Rect.top,
        //     Rect.right - Rect.left,
        //     Rect.bottom - Rect.top,
        //     PATCOPY)) {
        //     ERR("NtGdiPatBlt() failed!\n");
        //  goto cleanup;
        // }

        NtUserFillRect(hDC, rect, hBGBrush);
    }

    // icon

    // text
    if ((uFlags & DCF.TEXT)) {
        var Set = false;
        rect.left += 2;

        if (lpTitle)
            Set = UserDrawCaptionText(pWnd, hDC, lpTitle, rect, uFlags, hFont);
        else if (pWnd) // FIXME: Windows does not do that
        {
            lpTitle = pWnd.lpszName;
            Set = UserDrawCaptionText(pWnd, hDC, lpTitle, rect, uFlags, hFont);
        }
        // if (pWnd) {
        //     if (Set)
        //         pWnd.state2 &= ~WNDS2_CAPTIONTEXTTRUNCATED;
        //  else
        //     pWnd.state2 |= WNDS2_CAPTIONTEXTTRUNCATED;
        // }
    }

}

export function NtUserDrawCaptionButton(pWnd: WND, rect: RECT, style: number, exStyle: number, hDC: HDC, bDown: boolean, type: number) {
    if (!(style & WS_SYSMENU)) {
        return;
    }

    let tempRect = { ...rect };

    switch (type) {
        case DFCS.CAPTIONMIN:
            {
                if (exStyle & WS_EX_TOOLWINDOW)
                    return; /* ToolWindows don't have min/max buttons */

                if (style & WS_SYSMENU)
                    tempRect.right -= NtIntGetSystemMetrics(SM_CXSIZE) + 1;

                if (style & (WS_MAXIMIZEBOX | WS_MINIMIZEBOX))
                    tempRect.right -= NtIntGetSystemMetrics(SM_CXSIZE) - 2;

                tempRect.left = tempRect.right - NtIntGetSystemMetrics(SM_CXSIZE) + 1;
                tempRect.bottom = tempRect.top + NtIntGetSystemMetrics(SM_CYSIZE) - 2;
                tempRect.top += 2;
                tempRect.right -= 1;

                NtUserDrawFrameControl(hDC, tempRect, DFC.CAPTION,
                    ((style & WS_MINIMIZE) ? DFCS.CAPTIONRESTORE : DFCS.CAPTIONMIN) |
                    (bDown ? DFCS.PUSHED : 0) |
                    ((style & WS_MINIMIZEBOX) ? 0 : DFCS.INACTIVE));
                break;
            }
        case DFCS.CAPTIONMAX:
            {
                if (exStyle & WS_EX_TOOLWINDOW)
                    return; /* ToolWindows don't have min/max buttons */

                if (style & WS_SYSMENU)
                    tempRect.right -= NtIntGetSystemMetrics(SM_CXSIZE) + 1;

                tempRect.left = tempRect.right - NtIntGetSystemMetrics(SM_CXSIZE) + 1;
                tempRect.bottom = tempRect.top + NtIntGetSystemMetrics(SM_CYSIZE) - 2;
                tempRect.top += 2;
                tempRect.right -= 1;

                NtUserDrawFrameControl(hDC, tempRect, DFC.CAPTION,
                    ((style & WS_MAXIMIZE) ? DFCS.CAPTIONRESTORE : DFCS.CAPTIONMAX) |
                    (bDown ? DFCS.PUSHED : 0) |
                    ((style & WS_MAXIMIZEBOX) ? 0 : DFCS.INACTIVE));
                break;
            }
        case DFCS.CAPTIONCLOSE:
            {
                // let pSysMenu = IntGetSystemMenu(pWnd, FALSE);
                // let menuState = IntGetMenuState(pSysMenu ? UserHMGetHandle(pSysMenu) : NULL, SC.CLOSE, MF.BYCOMMAND); /* in case of error MenuState==0xFFFFFFFF */

                /* A tool window has a smaller Close button */
                if (exStyle & WS_EX_TOOLWINDOW) {
                    tempRect.left = tempRect.right - NtIntGetSystemMetrics(SM_CXSMSIZE);
                    tempRect.bottom = tempRect.top + NtIntGetSystemMetrics(SM_CYSMSIZE) - 2;
                }
                else {
                    tempRect.left = tempRect.right - NtIntGetSystemMetrics(SM_CXSIZE);
                    tempRect.bottom = tempRect.top + NtIntGetSystemMetrics(SM_CYSIZE) - 2;
                }
                tempRect.top += 2;
                tempRect.right -= 2;

                NtUserDrawFrameControl(hDC, tempRect, DFC.CAPTION,
                    (DFCS.CAPTIONCLOSE | (bDown ? DFCS.PUSHED : 0) | ((/* (!(menuState & (MF_GRAYED | MF_DISABLED)) && !(pWnd.dwStyle & CS.NOCLOSE) */ false) ? 0 : DFCS.INACTIVE)));
                break;
            }
    }
}

function UserDrawCaptionText(
    pWnd: WND,
    hDC: HDC,
    lpTitle: string,
    rect: RECT,
    uFlags: number,
    hFont: HFONT) {
    let hOldFont: HFONT = null;
    let OldTextColor: number = 0;
    let nclm: NONCLIENTMETRICS = {} as NONCLIENTMETRICS;
    let status: number;
    let bDeleteFont = false;
    let ret = true;
    let r = { ...rect };

    if (!NtUserSystemParametersInfo(SPI.GETNONCLIENTMETRICS, nclm)) {
        return false;
    }

    if (!hFont) {
        if (uFlags & DCF.SMALLCAP) {
            hFont = NtGdiCreateFontIndirect(nclm.lfSmCaptionFont);
        }
        else {
            hFont = NtGdiCreateFontIndirect(nclm.lfCaptionFont);
        }

        bDeleteFont = true;
    }

    NtGdiSetBkMode(hDC, TRANSPARENT);

    hOldFont = NtGdiSelectObject(hDC, hFont);

    if (uFlags & DCF.INBUTTON)
        OldTextColor = NtGdiSetTextColor(hDC, IntGetSysColor(COLOR.BTNTEXT));
    else
        OldTextColor = NtGdiSetTextColor(hDC,
            IntGetSysColor(uFlags & DCF.ACTIVE ? COLOR.CAPTIONTEXT : COLOR.INACTIVECAPTIONTEXT));

    // Adjust for system menu.
    if (pWnd && pWnd.dwStyle & WS_SYSMENU) {
        r.right -= NtIntGetSystemMetrics(SM_CYCAPTION) - 1;
        if ((pWnd.dwStyle & (WS_MAXIMIZEBOX | WS_MINIMIZEBOX)) && !(pWnd.dwExStyle & WS_EX_TOOLWINDOW)) {
            r.right -= NtIntGetSystemMetrics(SM_CXSIZE) + 1;
            r.right -= NtIntGetSystemMetrics(SM_CXSIZE) + 1;
        }
    }

    const { fit, size } = NtGdiGetTextExtentEx(hDC, lpTitle, r.right - r.left);

    let length = (lpTitle.length == fit ? fit : fit + 1);
    if (lpTitle.length > length) {
        ret = false;
    }

    // if (Ret) {  // Faster while in setup.
    //     UserExtTextOutW(hDc,
    //         lpRc.left,
    //         lpRc.top + (lpRc.bottom - lpRc.top - Size.cy) / 2, // DT_SINGLELINE && DT_VCENTER
    //         ETO_CLIPPED,
    //         (RECTL *)lpRc,
    //         Text.Buffer,
    //         Length);
    // }
    // else {
    //     DrawTextW(hDc,
    //         Text.Buffer,
    //         Text.Length / sizeof(WCHAR),
    //         (RECTL *) & r,
    //         DT_END_ELLIPSIS | DT_SINGLELINE | DT_VCENTER | DT_NOPREFIX | DT_LEFT);
    // }

    NtGdiTextOut(hDC, r.left, r.top + (r.bottom - r.top - size.cy) / 2, lpTitle);
    NtGdiSetTextColor(hDC, OldTextColor);

    if (hOldFont)
        NtGdiSelectObject(hDC, hOldFont);

    if (bDeleteFont)
        NtGdiDeleteObject(hFont);

    return ret;
}