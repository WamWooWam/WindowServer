import { ObDestroyHandle, ObEnumHandles } from "./objects.js";

const BUGCHECK_CODES = {
    [0xEF]: 'CRITICAL_PROCESS_DIED',
}

export function KeBugCheckEx(
    bugcheckCode: number,
    bugcheckParameter1: any = 0,
    bugcheckParameter2: any = 0,
    bugcheckParameter3: any = 0,
    bugcheckParameter4: any = 0): never {

    let error = new Error("KeBugCheckEx");
    let code = BUGCHECK_CODES[bugcheckCode as keyof typeof BUGCHECK_CODES];
    if (!code) {
        code = `0x${bugcheckCode.toString(16).padStart(8, '0')}`;
    }

    bugcheckParameter1 = bugcheckParameter1 ?? 0;
    bugcheckParameter2 = bugcheckParameter2 ?? 0;
    bugcheckParameter3 = bugcheckParameter3 ?? 0;
    bugcheckParameter4 = bugcheckParameter4 ?? 0;

    if (bugcheckParameter1 instanceof Error) {
        error = bugcheckParameter1;
        bugcheckParameter1 = bugcheckParameter2;
        bugcheckParameter2 = bugcheckParameter3;
        bugcheckParameter3 = bugcheckParameter4;
        bugcheckParameter4 = 0;
    }

    const stack = error.stack ?? '';
    // attempt to destroy all handles 
    for (const handle of ObEnumHandles()) {
        try {
            ObDestroyHandle(handle);
        } catch { }
    }

    // close the filesystem

    // delete any desktop/window elements
    const elements = document.querySelectorAll('x-window, x-desktop')
    for (const el of elements) {
        el.remove();
    }

    // clear the screen
    document.body.style.backgroundColor = 'black';
    document.body.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'none';

    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000080'
    ctx.fillRect(0, 0, 640, 480);

    ctx.fillStyle = 'white';
    ctx.font = 'normal 13px "FIXEDSYS", "Lucida Console", Monaco, monospace';

    ctx.fillText('A problem has been detected and Windows has been shut down to prevent damage', 0, 28);
    ctx.fillText('to your computer.', 0, 42);

    ctx.fillText(code, 0, 66);

    ctx.fillText('If this is the first time you\'ve seen this stop error screen,', 0, 94);
    ctx.fillText('restart your computer. If this screen appears again, follow', 0, 108);
    ctx.fillText('these steps:', 0, 122);

    ctx.fillText('Check to make sure any new hardware or software is properly installed.', 0, 150);
    ctx.fillText('If this is a new installation, ask your hardware or software manufacturer', 0, 164);
    ctx.fillText('for any Windows updates you might need.', 0, 178);

    ctx.fillText('If problems continue, disable or remove any newly installed hardware', 0, 203);
    ctx.fillText('or software. Disable BIOS memory options such as caching or shadowing.', 0, 217);
    ctx.fillText('If you need to use Safe Mode to remove or disable components, restart', 0, 231);
    ctx.fillText('your computer, press F8 to select Advanced Startup Options, and then', 0, 245);
    ctx.fillText('select Safe Mode.', 0, 259);

    ctx.fillText('Technical information:', 0, 290);

    const hexParam1 = bugcheckParameter1.toString(16).padStart(8, '0');
    const hexParam2 = bugcheckParameter2.toString(16).padStart(8, '0');
    const hexParam3 = bugcheckParameter3.toString(16).padStart(8, '0');
    const hexParam4 = bugcheckParameter4.toString(16).padStart(8, '0');

    ctx.fillText(`*** STOP: ${code} (0x${hexParam1},0x${hexParam2},0x${hexParam3},0x${hexParam4})`, 0, 318);

    const lines = stack.split('\n');
    const currentPath = window.location.origin + '/';
    ctx.fillText(lines[0], 0, 350);
    for (let i = 1; i < lines.length; i++) {
        // attempt to remove the current path from the stack trace
        if (lines[i].indexOf(currentPath) !== -1) {
            lines[i] = lines[i].replace(currentPath, '');
        }

        ctx.fillText(lines[i], 0, 364 + ((i - 1) * 14));
    }

    throw null;
}