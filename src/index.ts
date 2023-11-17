import { PsCreateProcess, PsTerminateProcess } from "./loader.js"

import Executable from "./types/Executable.js";
import { HANDLE } from "./types/types.js";

(() => {
    const procs: HANDLE[] = [];
    const SpawnProc = async () => {
        const proc = PsCreateProcess("test.js", "", false, {}, "C:\\Windows\\System32", null);
        procs.push(proc);
        document.getElementById("count").innerText = procs.length.toString();
    }

    const KillProc = async () => {
        const proc = procs.pop();
        PsTerminateProcess(proc, 0);
        document.getElementById("count").innerText = procs.length.toString();
    }

    document.getElementById("spawn").addEventListener("click", SpawnProc);
    document.getElementById("kill").addEventListener("click", KillProc);
})();