import { GDIOBJ, NtGdiDeleteObject } from "./ntgdi.js";
import { RECT, RGN } from "../../types/gdi32.types.js";

import { ObSetObject } from "../../objects.js";

export default interface REGION extends GDIOBJ {
    _type: "REGION";
    iType: number;
    rcBound: RECT;
    rects: RECT[];
}

export function GreCreateRgn(): REGION {
    const rgn: REGION = {
        _type: "REGION",
        _hObj: 0,
        iType: 0,
        rcBound: { left: 0, top: 0, right: 0, bottom: 0 },
        rects: []
    };

    rgn._hObj = ObSetObject(rgn, "REGION", 0, null);

    return rgn;
}

export function GreCreateRectRgn(rc: RECT): REGION {
    if (rc.left >= rc.right || rc.top >= rc.bottom) {
        return GreCreateRgn();
    }

    const rgn = GreCreateRgn();
    GreRegAddRect(rgn, rc.left, rc.top, rc.right, rc.bottom);
    GreRegSetExtents(rgn);

    return rgn;;
}

export function GreCombineRgn(dst: REGION, src1: REGION, src2: REGION, iMode: number): number {
    if (!dst) {
        return -1;
    }

    if (!src1) {
        return -1;
    }

    if (iMode == RGN.COPY) {
        if (!GreRegCopy(dst, src1)) {
            return -1;
        }

        return GreRegComplexity(dst);
    }

    switch (iMode) {
        case RGN.AND: // RGN_AND
            return GreRgnIntersect(dst, src1, src2);
        case RGN.OR: // RGN_OR
            return GreRegUnion(dst, src1, src2);
        case RGN.XOR: // RGN_XOR
            return GreRgnXor(dst, src1, src2);
        case RGN.DIFF: // RGN_DIFF
            return GreRegSubtract(dst, src1, src2);
        default:
            return -1;
    }

}

export function GreRegCopy(dst: REGION, src: REGION): boolean {
    if (!dst) {
        return false;
    }

    if (!src) {
        return false;
    }

    dst.iType = src.iType;
    dst.rcBound = src.rcBound;
    dst.rects = src.rects.slice();

    return true;
}

export function GreRegComplexity(rgn: REGION): number {
    if (!rgn) {
        return 0;
    }

    switch (rgn.rects.length) {
        case 0:
            return 0;
        case 1:
            return 1;
        default:
            return 2;
    }
}

type OverlapProc = (pReg: REGION, _r1: RECT[], r1: number, r1End: number, _r2: RECT[], r2: number, r2End: number, top: number, bottom: number) => boolean;
type NonOverlapProc = (pReg: REGION, _r: RECT[], r: number, rEnd: number, top: number, bottom: number) => boolean;

export function GreRegOp(
    newReg: REGION,
    reg1: REGION,
    reg2: REGION,
    overlapProc: OverlapProc,
    nonOverlapProc: NonOverlapProc,
    nonOverlapProc2: NonOverlapProc
): boolean {
    let ybot: number;
    let ytop: number;

    let r1 = 0;
    let r2 = 0;
    let r1End = reg1.rects.length;
    let r2End = reg2.rects.length;

    let r1BandEnd = 0;
    let r2BandEnd = 0;

    let top = 0;
    let bot = 0;

    const _r1 = () => reg1.rects[r1];
    const _r2 = () => reg2.rects[r2];
    const _r1End = () => reg1.rects[r1End];
    const _r2End = () => reg2.rects[r2End];
    const _r1BandEnd = () => reg1.rects[r1BandEnd];
    const _r2BandEnd = () => reg2.rects[r2BandEnd];

    newReg.iType = 1;
    newReg.rcBound = { left: 0, top: 0, right: 0, bottom: 0 };
    newReg.rects = [];

    /* Initialize ybot and ytop.
    * In the upcoming loop, ybot and ytop serve different functions depending
    * on whether the band being handled is an overlapping or non-overlapping
    * band.
    *  In the case of a non-overlapping band (only one of the regions
    * has points in the band), ybot is the bottom of the most recent
    * intersection and thus clips the top of the rectangles in that band.
    * ytop is the top of the next intersection between the two regions and
    * serves to clip the bottom of the rectangles in the current band.
    *  For an overlapping band (where the two regions intersect), ytop clips
    * the top of the rectangles of both regions and ybot clips the bottoms. */
    if (reg1.rcBound.top < reg2.rcBound.top)
        ybot = reg1.rcBound.top;
    else
        ybot = reg2.rcBound.top;

    /* prevBand serves to mark the start of the previous band so rectangles
        * can be coalesced into larger rectangles. qv. miCoalesce, above.
        * In the beginning, there is no previous band, so prevBand == curBand
        * (curBand is set later on, of course, but the first band will always
        * start at index 0). prevBand and curBand must be indices because of
        * the possible expansion, and resultant moving, of the new region's
        * array of rectangles. */
    let prevBand = 0;
    do {
        let curBand = newReg.rects.length;

        /* This algorithm proceeds one source-band (as opposed to a
         * destination band, which is determined by where the two regions
         * intersect) at a time. r1BandEnd and r2BandEnd serve to mark the
         * rectangle after the last one in the current band for their
         * respective regions. */
        r1BandEnd = r1;
        while ((r1BandEnd != r1End) && (_r1BandEnd().top == _r1().top)) {
            r1BandEnd++;
        }

        r2BandEnd = r2;
        while ((r2BandEnd != r2End) && (_r2BandEnd().top == _r2().top)) {
            r2BandEnd++;
        }

        /* First handle the band that doesn't intersect, if any.
         *
         * Note that attention is restricted to one band in the
         * non-intersecting region at once, so if a region has n
         * bands between the current position and the next place it overlaps
         * the other, this entire loop will be passed through n times. */
        if (_r1().top < _r2().top) {
            top = Math.max(_r1().top, ybot);
            bot = Math.min(_r1().bottom, _r2().top);

            if ((top != bot) && nonOverlapProc) {
                if (!nonOverlapProc(newReg, reg1.rects, r1, r1BandEnd, top, bot)) return false;
            }

            ytop = _r2().top;
        }
        else if (_r2().top < _r1().top) {
            top = Math.max(_r2().top, ybot);
            bot = Math.min(_r2().bottom, _r1().top);

            if ((top != bot) && (nonOverlapProc2)) {
                if (nonOverlapProc2(newReg, reg2.rects, r2, r2BandEnd, top, bot)) return false;
            }

            ytop = _r1().top;
        }
        else {
            ytop = _r1().top;
        }

        /* If any rectangles got added to the region, try and coalesce them
         * with rectangles from the previous band. Note we could just do
         * this test in miCoalesce, but some machines incur a not
         * inconsiderable cost for function calls, so... */
        if (newReg.rects.length != curBand) {
            prevBand = GreRegCoalesce(newReg, prevBand, curBand);
        }

        /* Now see if we've hit an intersecting band. The two bands only
         * intersect if ybot > ytop */
        ybot = Math.min(_r1().bottom, _r2().bottom);
        curBand = newReg.rects.length;
        if (ybot > ytop) {
            if (!overlapProc(newReg, reg1.rects, r1, r1BandEnd, reg2.rects, r2, r2BandEnd, ytop, ybot)) return false;
        }

        if (newReg.rects.length != curBand) {
            prevBand = GreRegCoalesce(newReg, prevBand, curBand);
        }

        /* If we've finished with a band (bottom == ybot) we skip forward
         * in the region to the next band. */
        if (_r1().bottom == ybot) {
            r1 = r1BandEnd;
        }
        if (_r2().bottom == ybot) {
            r2 = r2BandEnd;
        }
    }
    while ((r1 != r1End) && (r2 != r2End));

    /* Deal with whichever region still has rectangles left. */
    let curBand = newReg.rects.length;
    if (r1 != r1End) {
        if (nonOverlapProc != null) {
            do {
                r1BandEnd = r1;
                while ((r1BandEnd < r1End) && (_r1BandEnd().top == _r1().top)) {
                    r1BandEnd++;
                }

                if (!nonOverlapProc(newReg, reg1.rects, r1, r1BandEnd, Math.max(_r1().top, ybot), _r1().bottom))
                    return false;
                r1 = r1BandEnd;
            }
            while (r1 != r1End);
        }
    }
    else if ((r2 != r2End) && (nonOverlapProc2)) {
        do {
            r2BandEnd = r2;
            while ((r2BandEnd < r2End) && (_r2BandEnd().top == _r2().top)) {
                r2BandEnd++;
            }

            if (!nonOverlapProc2(newReg, reg2.rects, r2, r2BandEnd, Math.max(_r2().top, ybot), _r2().bottom))
                return false;
            r2 = r2BandEnd;
        }
        while (r2 != r2End);
    }

    if (newReg.rects.length != curBand) {
        GreRegCoalesce(newReg, prevBand, curBand);
    }

    return true;
}

export function GreRegCoalesce(pReg: REGION, prevStart: number, curStart: number): number {
    let pPrevRect = 0;  /* Current rect in previous band */
    let pCurRect = 0;   /* Current rect in current band */
    let pRegEnd = 0;    /* End of region */
    let curNumRects = 0;   /* Number of rectangles in current band */
    let prevNumRects = 0;  /* Number of rectangles in previous band */
    let bandtop = 0;       /* Top coordinate for current band */

    pRegEnd = pReg.rects.length;
    pPrevRect = prevStart;
    prevNumRects = curStart - prevStart;

    const _pPrevRect = () => pReg.rects[pPrevRect];
    const _pCurRect = () => pReg.rects[pCurRect];
    const _pRegEnd = () => pReg.rects[pRegEnd];
    const _pRegEndMinus1 = () => pReg.rects[pRegEnd - 1];

    /* Figure out how many rectangles are in the current band. Have to do
     * this because multiple bands could have been added in REGION_RegionOp
     * at the end when one region has been exhausted. */
    pCurRect = curStart;
    bandtop = _pCurRect().top;
    for (curNumRects = 0;
        (pCurRect != pRegEnd) && (_pCurRect().top == bandtop);
        curNumRects++) {
        pCurRect++;
    }

    if (pCurRect != pRegEnd) {
        /* If more than one band was added, we have to find the start
         * of the last band added so the next coalescing job can start
         * at the right place... (given when multiple bands are added,
         * this may be pointless -- see above). */
        pRegEnd--;
        while (_pRegEndMinus1().top == _pRegEnd().top) {
            pRegEnd--;
        }

        curStart = pRegEnd;
        pRegEnd = pReg.rects.length;
    }

    if ((curNumRects == prevNumRects) && (curNumRects != 0)) {
        pCurRect -= curNumRects;

        /* The bands may only be coalesced if the bottom of the previous
         * matches the top scanline of the current. */
        if (_pPrevRect().bottom == _pCurRect().top) {
            /* Make sure the bands have rects in the same places. This
             * assumes that rects have been added in such a way that they
             * cover the most area possible. I.e. two rects in a band must
             * have some horizontal space between them. */
            do {
                if ((_pPrevRect().left != _pCurRect().left) ||
                    (_pPrevRect().right != _pCurRect().right)) {
                    /* The bands don't line up so they can't be coalesced. */
                    return (curStart);
                }

                pPrevRect++;
                pCurRect++;
                prevNumRects -= 1;
            }
            while (prevNumRects != 0);

            // pReg.nCount -= curNumRects;
            pReg.rects.splice(curStart, curNumRects);
            pCurRect -= curNumRects;
            pPrevRect -= curNumRects;

            /* The bands may be merged, so set the bottom of each rect
             * in the previous band to that of the corresponding rect in
             * the current band. */
            do {
                _pPrevRect().bottom = _pCurRect().bottom;
                pPrevRect++;
                pCurRect++;
                curNumRects -= 1;
            }
            while (curNumRects != 0);

            /* If only one band was added to the region, we have to backup
             * curStart to the start of the previous band.
             *
             * If more than one band was added to the region, copy the
             * other bands down. The assumption here is that the other bands
             * came from the same region as the current one and no further
             * coalescing can be done on them since it's all been done
             * already... curStart is already in the right place. */
            if (pCurRect == pRegEnd) {
                curStart = prevStart;
            }
            else {
                // do
                // {
                //     *pPrevRect++ = *pCurRect++;
                // }
                // while (pCurRect != pRegEnd);

                pReg.rects.splice(prevStart, pCurRect - prevStart);
            }
        }
    }

    return (curStart);
}

export function GreRegSetExtents(pReg: REGION): boolean {
    if (!pReg) {
        return false;
    }

    if (pReg.rects.length == 0) {
        pReg.rcBound.left = 0;
        pReg.rcBound.top = 0;
        pReg.rcBound.right = 0;
        pReg.rcBound.bottom = 0;
        return true;
    }

    pReg.rcBound = { ...pReg.rects[0] };
    for (let i = 1; i < pReg.rects.length; i++) {
        let r = pReg.rects[i];
        pReg.rcBound.left = Math.min(pReg.rcBound.left, r.left);
        pReg.rcBound.top = Math.min(pReg.rcBound.top, r.top);
        pReg.rcBound.right = Math.max(pReg.rcBound.right, r.right);
        pReg.rcBound.bottom = Math.max(pReg.rcBound.bottom, r.bottom);
    }

    return true;
}

// This function does NOT touch the region's bounding box.
function GreRegAddRect(pReg: REGION, left: number, top: number, right: number, bottom: number): boolean {
    pReg.rects.push({ left, top, right, bottom });
    return true;
}

function GreRegMergeRect(pReg: REGION, left: number, top: number, right: number, bottom: number): boolean {
    let r: RECT;

    if (pReg.rects.length == 0) {
        return GreRegAddRect(pReg, left, top, right, bottom);
    }

    r = pReg.rects[pReg.rects.length - 1];
    if ((r.top == top) && (r.bottom == bottom) && (r.right >= left)) {
        r.right = Math.max(r.right, right);
        return true;
    }

    return GreRegAddRect(pReg, left, top, right, bottom);
}

function GreRgnIntersect(dst: REGION, src1: REGION, src2: REGION): number {
    if (!GreRegOp(dst, src1, src2, GreRegIntersectO, null, null))
        return -1;

    GreRegSetExtents(dst);

    return GreRegComplexity(dst);
}

function GreRegIntersectO(pReg: REGION, _rc1: RECT[], r1: number, r1End: number, _rc2: RECT[], r2: number, r2End: number, top: number, bottom: number) {
    let left = 0, right = 0;

    const _r1End = () => _rc1[r1End];
    const _r2End = () => _rc2[r2End];
    const _r1 = () => _rc1[r1];
    const _r2 = () => _rc2[r2];


    while ((r1 != r1End) && (r2 != r2End)) {
        left = Math.max(_r1().left, _r2().left);
        right = Math.min(_r1().right, _r2().right);

        /* If there's any overlap between the two rectangles, add that
         * overlap to the new region.
         * There's no need to check for subsumption because the only way
         * such a need could arise is if some region has two rectangles
         * right next to each other. Since that should never happen... */
        if (left < right) {
            if (!GreRegAddRect(pReg, left, top, right, bottom)) {
                return false;
            }
        }

        /* Need to advance the pointers. Shift the one that extends
         * to the right the least, since the other still has a chance to
         * overlap with that region's next rectangle, if you see what I mean. */
        if (_r1().right < _r2().right) {
            r1++;
        }
        else if (_r2().right < _r1().right) {
            r2++;
        }
        else {
            r1++;
            r2++;
        }
    }

    return true;
}


function GreRegUnion(newReg: REGION, reg1: REGION, reg2: REGION): number {
    /* Checks all the simple cases
     * Region 1 and 2 are the same or region 1 is empty */

    let ret = 1;
    if ((reg1 == reg2) || (reg1.rects.length == 0) ||
        (reg1.rcBound.right <= reg1.rcBound.left) ||
        (reg1.rcBound.bottom <= reg1.rcBound.top)) {
        if (newReg != reg2) {
            GreRegCopy(newReg, reg2);
        }

        return ret;
    }

    /* If nothing to union (region 2 empty) */
    if ((reg2.rects.length == 0) ||
        (reg2.rcBound.right <= reg2.rcBound.left) ||
        (reg2.rcBound.bottom <= reg2.rcBound.top)) {
        if (newReg != reg1) {
            GreRegCopy(newReg, reg1);
        }

        return ret;
    }

    /* Region 1 completely subsumes region 2 */
    if ((reg1.rects.length == 1) &&
        (reg1.rcBound.left <= reg2.rcBound.left) &&
        (reg1.rcBound.top <= reg2.rcBound.top) &&
        (reg2.rcBound.right <= reg1.rcBound.right) &&
        (reg2.rcBound.bottom <= reg1.rcBound.bottom)) {
        if (newReg != reg1) {
            GreRegCopy(newReg, reg1);
        }

        return ret;
    }

    /* Region 2 completely subsumes region 1 */
    if ((reg2.rects.length == 1) &&
        (reg2.rcBound.left <= reg1.rcBound.left) &&
        (reg2.rcBound.top <= reg1.rcBound.top) &&
        (reg1.rcBound.right <= reg2.rcBound.right) &&
        (reg1.rcBound.bottom <= reg2.rcBound.bottom)) {
        if (newReg != reg2) {
            GreRegCopy(newReg, reg2);
        }

        return ret;
    }

    if (GreRegOp(newReg, reg1, reg2, GreRegUnionO, GreRegUnionNonO, GreRegUnionNonO)) {
        newReg.rcBound.left = Math.min(reg1.rcBound.left, reg2.rcBound.left);
        newReg.rcBound.top = Math.min(reg1.rcBound.top, reg2.rcBound.top);
        newReg.rcBound.right = Math.max(reg1.rcBound.right, reg2.rcBound.right);
        newReg.rcBound.bottom = Math.max(reg1.rcBound.bottom, reg2.rcBound.bottom);
    }

    return ret;
}

function GreRegUnionNonO(pReg: REGION, _r: RECT[], r: number, rEnd: number, top: number, bottom: number) {
    if (r != rEnd) {
        do {
            GreRegAddRect(pReg, _r[r].left, top, _r[r].right, bottom);
            r++;
        }
        while (r != rEnd);
    }

    return true;
}

function GreRegUnionO(pReg: REGION, _rc1: RECT[], r1: number, r1End: number, _rc2: RECT[], r2: number, r2End: number, top: number, bottom: number) {
    const _r1 = () => _rc1[r1];
    const _r2 = () => _rc2[r2];

    while ((r1 != r1End) && (r2 != r2End)) {
        if (_r1().left < _r2().left) {
            if (!GreRegMergeRect(pReg, _r1().left, top, _r1().right, bottom)) return false;
            r1++;
        }
        else {
            if (!GreRegMergeRect(pReg, _r2().left, top, _r2().right, bottom)) return false;
            r2++;
        }
    }

    if (r1 != r1End) {
        do {
            if (!GreRegMergeRect(pReg, _r1().left, top, _r1().right, bottom)) return false;
            r1++;
        }
        while (r1 != r1End);
    }
    else {
        while (r2 != r2End) {
            if (!GreRegMergeRect(pReg, _r2().left, top, _r2().right, bottom)) return false;
            r2++;
        }
    }

    return true;
}

function EXTENTCHECK(r1: RECT, r2: RECT) {
    return ((r1).right > (r2).left &&
        (r1).left < (r2).right &&
        (r1).bottom > (r2).top &&
        (r1).top < (r2).bottom);
}

function GreRegSubtract(regD: REGION, regM: REGION, regS: REGION) {
    /* Check for trivial reject */
    if ((regM.rects.length == 0) ||
        (regS.rects.length == 0) ||
        (!EXTENTCHECK(regM.rcBound, regS.rcBound))) {
        GreRegCopy(regD, regM);
        return GreRegComplexity(regD);
    }

    if (!GreRegOp(regD,
        regM,
        regS,
        GreRegSubtractO,
        GreRegSubtractNonO,
        null))
        return -1;

    GreRegSetExtents(regD);

    return GreRegComplexity(regD);
}

function GreRegSubtractNonO(pReg: REGION, _r: RECT[], r: number, rEnd: number, top: number, bottom: number) {
    if (r != rEnd) {
        do {
            GreRegAddRect(pReg, _r[r].left, top, _r[r].right, bottom);
            r++;
        }
        while (r != rEnd);
    }

    return true
}
function GreRegSubtractO(pReg: REGION, _rc1: RECT[], r1: number, r1End: number, _rc2: RECT[], r2: number, r2End: number, top: number, bottom: number) {
    const _r1 = () => _rc1[r1];
    const _r2 = () => _rc2[r2];

    let left = _r1().left;

    while ((r1 != r1End) && (r2 != r2End)) {
        if (_r2().right <= left) {
            /* Subtrahend missed the boat: go to next subtrahend. */
            r2++;
        }
        else if (_r2().left <= left) {
            /* Subtrahend preceeds minuend: nuke left edge of minuend. */
            left = _r2().right;
            if (left >= _r1().right) {
                /* Minuend completely covered: advance to next minuend and
                 * reset left fence to edge of new minuend. */
                r1++;
                if (r1 != r1End)
                    left = _r1().left;
            }
            else {
                /* Subtrahend now used up since it doesn't extend beyond
                 * minuend */
                r2++;
            }
        }
        else if (_r2().left < _r1().right) {
            /* Left part of subtrahend covers part of minuend: add uncovered
             * part of minuend to region and skip to next subtrahend. */
            if (!GreRegAddRect(pReg, left, top, _r2().left, bottom)) {
                return false;
            }

            left = _r2().right;
            if (left >= _r1().right) {
                /* Minuend used up: advance to new... */
                r1++;
                if (r1 != r1End)
                    left = _r1().left;
            }
            else {
                /* Subtrahend used up */
                r2++;
            }
        }
        else {
            /* Minuend used up: add any remaining piece before advancing. */
            if (_r1().right > left) {
                if (!GreRegAddRect(pReg, left, top, _r1().right, bottom)) {
                    return false;
                }
            }

            r1++;
            if (r1 != r1End)
                left = _r1().left;
        }
    }

    if (r1 != r1End) {

        /* Add remaining minuend rectangles to region. */
        do {
            GreRegAddRect(pReg, left, top, _r1().right, bottom);
            r1++;
            if (r1 != r1End) {
                left = _r1().left;
            }
        }
        while (r1 != r1End);
    }

    return true;
}

function GreRgnXor(
    dr: REGION,
    sra: REGION,
    srb: REGION) {
    const tra = GreCreateRgn();
    const trb = GreCreateRgn();

    GreRegSubtract(tra, sra, srb);
    GreRegSubtract(trb, srb, sra);
    GreRegUnion(dr, tra, trb);

    NtGdiDeleteObject(tra._hObj);
    NtGdiDeleteObject(trb._hObj);

    return GreRegComplexity(dr);
}