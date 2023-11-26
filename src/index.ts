import { NtPostMessage, NtPostProcessMessage, NtPostQuitMessage } from "./win32k/msg.js";
import { PsCreateProcess, PsRegisterProcessHooks, PsQuitProcess, PsTerminateProcess } from "./loader.js"

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

    const launchSelect = document.getElementById("launch-select") as HTMLSelectElement;

    const processList = document.getElementById("processes");
    processList.onclick = (e) => {
        const row = (e.target as HTMLElement).closest("tr");
        const proc = ObGetObject<PsProcess>(parseInt(row.id));
        if (!proc) return;

        const index = procs.indexOf(proc.handle);
        if (index === -1) return;

        for (const row of processList.getElementsByTagName("tr")) {
            row.className = "";
        }

        row.className = "highlighted";
    }

    const GetSelectedProcess = () => {
        const row = processList.getElementsByClassName("highlighted")[0];
        if (!row) return procs[procs.length - 1]

        const proc = ObGetObject<PsProcess>(parseInt(row.id));
        if (!proc) {
            row.remove();
            return;
        }

        return proc.handle;
    }

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
        const exe = launchSelect.value;
        PsCreateProcess(`apps/${exe}.js`, "", false, {}, "C:\\Windows\\System32", null);
    }

    const KillProc = async () => {
        if (procs.length === 1) {
            console.warn("Refusing to kill wininit.");
            return;
        }

        const proc = GetSelectedProcess();

        PsTerminateProcess(proc);
        UpdateButtons();
    }

    const QuitProc = async () => {
        if (procs.length === 1) {
            console.warn("Refusing to kill wininit.");
            return;
        }

        const proc = GetSelectedProcess();
        try {
            NtPostProcessMessage(proc, { hWnd: null, message: WM.QUIT, wParam: 0, lParam: 0 });
        }
        catch (e) {
            console.warn("Failed to send quit message, was User32 initialized?")
            PsQuitProcess(proc, 0);
        }

        UpdateButtons();
    }

    const ProcessCreated = (proc: PsProcess) => {
        processCount++;
        document.getElementById("count").innerText = processCount.toString();

        procs.push(proc.handle);

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
    PsCreateProcess("apps/wininit.js", "", false, {}, "C:\\Windows\\System32", null);

    setInterval(UpdateStates, 1000);
})();