export function ROUND(x: number) {
    // With a bitwise or.
    let rounded = (0.5 + x) | 0;
    // A double bitwise not.
    rounded = ~~(0.5 + x);
    // Finally, a left bitwise shift.
    rounded = (0.5 + x) << 0;

    return rounded;
}