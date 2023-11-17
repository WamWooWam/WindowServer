import { NtPostProcessMessage, NtPostQuitMessage } from "./win32k/msg.js";
import { PsCreateProcess, PsRegisterProcessHooks, PsTerminateProcess } from "./loader.js"

import Executable from "./types/Executable.js";
import { HANDLE } from "./types/types.js";
import { WM_QUIT } from "./types/user32.types.js";

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
            message: WM_QUIT,
            wParam: 0,
            lParam: 0
        });
    }

    PsRegisterProcessHooks(
        (proc) => {
            processCount++;
            document.getElementById("count").innerText = processCount.toString();

            const row = document.createElement("tr");
            const name = document.createElement("td");
            const id = document.createElement("td");
            const cmdLine = document.createElement("td");
            
            name.innerText = proc.name;
            id.innerText = proc.id.toString();
            cmdLine.innerText = proc.args;

            row.appendChild(name);
            row.appendChild(id);
            row.appendChild(cmdLine);

            processTableEntries.set(proc.handle, row);

            processList.appendChild(row);
        },
        (proc) => {
            processCount--;
            document.getElementById("count").innerText = processCount.toString();

            const row = processTableEntries.get(proc.handle);
            processTableEntries.delete(proc.handle);
            processList.removeChild(row);
        }
    );

    document.getElementById("spawn").addEventListener("click", SpawnProc);
    document.getElementById("quit").addEventListener("click", QuitProc);
    document.getElementById("kill").addEventListener("click", KillProc);
})();