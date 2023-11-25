import { NtPostMessage, NtPostProcessMessage, NtPostQuitMessage } from "./win32k/msg.js";
import { PsCreateProcess, PsRegisterProcessHooks, PsTerminateProcess } from "./loader.js"

import { HANDLE } from "./types/types.js";
import { NtUserInit } from "./win32k/init.js";
import { PsProcess } from "./process.js";
import { HWND_BROADCAST, WM } from "./types/user32.types.js";
import { ObDumpHandles, ObEnumObjects, ObGetObject, ObGetOwnedHandleCount } from "./objects.js";

(async () => {
    const procs: HANDLE[] = [];
    const processTableEntries = new Map<HANDLE, HTMLTableRowElement>();
    let processCount = 0;

    const taskmgr = document.getElementById("task-manager");
    taskmgr.onpointerdown = (e) => e.stopPropagation();
    taskmgr.onpointermove = (e) => e.stopPropagation();
    taskmgr.onpointerup = (e) => e.stopPropagation();

    const processList = document.getElementById("processes");

    const UpdateStates = () => {
        const rows = processList.getElementsByTagName("tr");
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const proc = ObGetObject<PsProcess>(parseInt(row.id));
            if (proc) {
                (<HTMLElement>row.children[2]).innerText = ObGetOwnedHandleCount(proc.handle).toString();
            }
        }

        document.getElementById("handles").innerText = [...ObEnumObjects()].length.toString();
    }

    const UpdateButtons = () => {
        if (procs.length === 0) {
            document.getElementById("quit").setAttribute("disabled", "disabled");
            document.getElementById("kill").setAttribute("disabled", "disabled");
        }
        else {
            document.getElementById("quit").removeAttribute("disabled");
            document.getElementById("kill").removeAttribute("disabled");
        }
    }

    const SpawnProc = async () => {
        const proc = PsCreateProcess("test.js", "", false, {}, "C:\\Windows\\System32", null);
        procs.push(proc);

        UpdateButtons();
    }

    const KillProc = async () => {
        const proc = procs.pop();
        PsTerminateProcess(proc, 0);

        UpdateButtons();
    }

    const QuitProc = async () => {
        const proc = procs.pop();
        NtPostProcessMessage(proc, {
            hWnd: null,
            message: WM.QUIT,
            wParam: 0,
            lParam: 0
        });

        UpdateButtons();
    }

    const ProcessCreated = (proc: PsProcess) => {
        processCount++;
        document.getElementById("count").innerText = processCount.toString();

        const html = `
            <tr id="${proc.id}">
                <td>${proc.name}</td>
                <td>${proc.id}</td>
                <td>${ObGetOwnedHandleCount(proc.handle)}</td>
            </tr>
        `;

        processList.insertAdjacentHTML("beforeend", html);

        const id = document.getElementById(proc.id.toString());
        processTableEntries.set(proc.handle, id as HTMLTableRowElement);

        UpdateButtons();
    };

    const ProcessDestroyed = (proc: PsProcess) => {
        processCount--;
        document.getElementById("count").innerText = processCount.toString();

        if (procs.includes(proc.handle))
            procs.splice(procs.indexOf(proc.handle), 1);

        const row = processTableEntries.get(proc.handle);
        processTableEntries.delete(proc.handle);
        processList.removeChild(row);

        UpdateButtons();
        ObDumpHandles();
    };

    document.getElementById("spawn").addEventListener("click", SpawnProc);
    document.getElementById("quit").addEventListener("click", QuitProc);
    document.getElementById("kill").addEventListener("click", KillProc);

    PsRegisterProcessHooks(ProcessCreated, ProcessDestroyed);

    await NtUserInit();
    PsCreateProcess("wininit.js", "", false, {}, "C:\\Windows\\System32", null);

    setInterval(UpdateStates, 1000);
})();