enum BRUSH_STYLE {
    BS_SOLID = 0,
    BS_NULL = 1,
    BS_HATCHED = 2,
    BS_PATTERN = 3,
    BS_DIBPATTERN = 5,
    BS_DIBPATTERNPT = 6,
    BS_PATTERN8X8 = 7,
    BS_DIBPATTERN8X8 = 8,
    BS_MONOPATTERN = 9
}

export default interface BRUSH {
    lbStyle: BRUSH_STYLE;
    lbColor: number;
    lbHatch: number;
    pValue: string | CanvasPattern | CanvasGradient;
}