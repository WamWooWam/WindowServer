import { NtPostProcessMessage } from "./win32k/msg.js";
import { PsCreateProcess, PsRegisterProcessHooks, PsQuitProcess, PsTerminateProcess } from "./loader.js"

import { HANDLE } from "ntos-sdk/types/types.js";
import { PsProcess } from "./process.js";
import { HWND, WM } from "./subsystems/user32.js";
import { ObDumpHandles, ObEnumHandles, ObGetObject, ObGetOwnedHandleCount } from "./objects.js";
import { NtInit } from "./boot.js";
import { NtUserGetForegroundWindow } from "./win32k/focus.js";
import WND from "./win32k/wnd.js";

(async () => {
    const procs: HANDLE[] = [];
    const processTableEntries = new Map<HANDLE, HTMLTableRowElement>();
    let processCount = 0;

    const taskmgr = document.getElementById("task-manager")!;
    taskmgr.onpointerdown = (e) => e.stopPropagation();
    taskmgr.onpointermove = (e) => e.stopPropagation();
    taskmgr.onpointerup = (e) => e.stopPropagation();

    const launchSelect = document.getElementById("launch-select")! as HTMLSelectElement;

    const processList = document.getElementById("processes")!;
    processList.onclick = (e) => {
        const row = (e.target as HTMLElement).closest("tr");
        if (!row) return;

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
        let row = processList.getElementsByClassName("highlighted")[0];
        let proc: PsProcess | null = null;
        let hWnd: HWND;
        if (!row && (hWnd = NtUserGetForegroundWindow())) {
            let wnd = ObGetObject<WND>(hWnd);
            if (!wnd) return;
            proc = ObGetObject<PsProcess>(wnd.peb.hProcess);
        }


        if (!proc) {
            proc = ObGetObject<PsProcess>(parseInt(row.id));
            if (!proc) {
                row?.remove();
                return;
            }
        }

        return proc.handle;
    }

    const UpdateStates = () => {
        try {
            const rows = processList.getElementsByTagName("tr");
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const proc = ObGetObject<PsProcess>(parseInt(row.id));
                if (proc) {
                    (<HTMLElement>row.children[2]).innerText = ObGetOwnedHandleCount(proc.handle).toString();
                }
            }

            document.getElementById("handles")!.innerText = [...ObEnumHandles()].length.toString();
        } catch (error) {

        }
    }

    const UpdateButtons = () => {
        if (procs.length === 0) {
            document.getElementById("quit")!.setAttribute("disabled", "disabled");
            document.getElementById("kill")!.setAttribute("disabled", "disabled");
        }
        else {
            document.getElementById("quit")!.removeAttribute("disabled");
            document.getElementById("kill")!.removeAttribute("disabled");
        }
    }

    const SpawnProc = async () => {
        const exe = launchSelect.value;
        PsCreateProcess(`${exe}.js`, "", false, {}, "C:\\Windows\\System32", null);
    }

    const KillProc = async () => {
        const proc = GetSelectedProcess();
        if (!proc) {
            console.warn("No process selected");
            return;
        }
        PsTerminateProcess(proc);
        UpdateButtons();
    }

    const QuitProc = async () => {
        const proc = GetSelectedProcess();
        if (!proc) {
            console.warn("No process selected");
            return;
        }

        try {
            NtPostProcessMessage(proc, { hWnd: 0, message: WM.QUIT, wParam: 0, lParam: 0 });
        }
        catch (e) {
            console.warn("Failed to send quit message, was User32 initialized?")
            PsQuitProcess(proc, 0);
        }

        UpdateButtons();
    }

    const ProcessCreated = (proc: PsProcess) => {
        processCount++;
        document.getElementById("count")!.innerText = processCount.toString();

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
        document.getElementById("count")!.innerText = processCount.toString();

        if (procs.includes(proc.handle))
            procs.splice(procs.indexOf(proc.handle), 1);

        const row = processTableEntries.get(proc.handle);
        if (!row) return;
        processTableEntries.delete(proc.handle);
        processList.removeChild(row);

        UpdateButtons();
        ObDumpHandles();
    };

    document.getElementById("spawn")!.addEventListener("click", SpawnProc);
    document.getElementById("quit")!.addEventListener("click", QuitProc);
    document.getElementById("kill")!.addEventListener("click", KillProc);

    PsRegisterProcessHooks(ProcessCreated, ProcessDestroyed);

    // boot the system
    await NtInit();

    setInterval(UpdateStates, 1000);
})();