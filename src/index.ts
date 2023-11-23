import { NtPostProcessMessage, NtPostQuitMessage } from "./win32k/msg.js";
import { PsCreateProcess, PsRegisterProcessHooks, PsTerminateProcess } from "./loader.js"

import Executable from "./types/Executable.js";
import { GreInit } from "./win32k/gdi/ntgdi.js";
import { HANDLE } from "./types/types.js";
import { NtGetPrimaryMonitor } from "./win32k/monitor.js";
import { PsProcess } from "./process.js";
import { WM } from "./types/user32.types.js";

(() => {

    const procs: HANDLE[] = [];
    const processTableEntries = new Map<HANDLE, HTMLTableRowElement>();
    let processCount = 0;

    const processList = document.getElementById("processes");

    const SpawnProc = async () => {
        const proc = PsCreateProcess("test.js", "", false, {}, "C:\\Windows\\System32", null);
        procs.push(proc);
    }

    const KillProc = async () => {
        const proc = procs.pop();
        PsTerminateProcess(proc, 0);
    }

    const QuitProc = async () => {
        const proc = procs.pop();
        NtPostProcessMessage(proc, {
            hWnd: null,
            message: WM.QUIT,
            wParam: 0,
            lParam: 0
        });
    }

    const ProcessCreated = (proc: PsProcess) => {
        processCount++;
        document.getElementById("count").innerText = processCount.toString();

        const html = `
            <tr id="${proc.id}">
                <td>${proc.name}</td>
                <td>${proc.id}</td>
                <td>${proc.args}</td>
            </tr>
        `;

        processList.insertAdjacentHTML("beforeend", html);

        const id = document.getElementById(proc.id.toString());
        processTableEntries.set(proc.handle, id as HTMLTableRowElement);
    };

    const ProcessDestroyed = (proc: PsProcess) => {
        processCount--;
        document.getElementById("count").innerText = processCount.toString();

        const row = processTableEntries.get(proc.handle);
        processTableEntries.delete(proc.handle);
        processList.removeChild(row);
    };


    document.getElementById("spawn").addEventListener("click", SpawnProc);
    document.getElementById("quit").addEventListener("click", QuitProc);
    document.getElementById("kill").addEventListener("click", KillProc);
    
    NtGetPrimaryMonitor();    
    PsRegisterProcessHooks(ProcessCreated, ProcessDestroyed);

    GreInit();

    PsCreateProcess("wininit.js", "", false, {}, "C:\\Windows\\System32", null);
})();