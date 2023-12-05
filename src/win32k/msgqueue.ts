import { HWND, LRESULT, MSG, WM } from "../types/user32.types.js";
import { MSG_QUEUE, W32PROCINFO } from "./shared.js";

import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import WND from "./wnd.js";

type MSG_CALLBACK = (result: LRESULT) => Promise<void> | void;
type MSG_CALLBACKS = { [msg: number]: MSG_CALLBACK[] };

export default class W32MSG_QUEUE implements MSG_QUEUE {
    private _messageReader: ReadableStream<MSG>;
    private _messageWriter: WritableStream<MSG>;

    private _w32ProcInfo: W32PROCINFO;

    private _messageCount = 0;

    constructor(peb: PEB, procInfo: W32PROCINFO) {
        this._w32ProcInfo = procInfo;

        const { readable, writable } = new TransformStream<MSG, MSG>({
            transform: async (msg, controller) => {
                controller.enqueue(msg);
            },
        });

        this._messageReader = readable;
        this._messageWriter = writable;
    }

    public EnqueueMessage(msg: MSG): void {
        this._messageCount++;
        const writer = this._messageWriter.getWriter();
        writer.write(msg);
        writer.releaseLock();
    }

    async GetMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): Promise<MSG> {
        // if this is called, and another GetMessage is already in progress, we need to wait for it to finish
        while (true) {
            const reader = this._messageReader.getReader();
            const read = await reader.read();
            reader.releaseLock();

            this._messageCount--;

            if (read.done) {
                return {
                    hWnd: 0,
                    message: WM.QUIT,
                    wParam: 0,
                    lParam: 0,
                    pt: { x: 0, y: 0 }
                }
            }

            const msg = read.value;

            if (this.FilterMessage(msg, hWnd, wMsgFilterMin, wMsgFilterMax)) {
                return msg;
            }
        }
    }

    async PeekMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number, wRemoveMsg: number): Promise<MSG> {
        // throw new Error("Method not implemented.");

        // this is kind of horrible
        let messages = [];

        try {
            while (this._messageCount > 0) {
                const reader = this._messageReader.getReader();
                const read = await reader.read();
                reader.releaseLock();
                this._messageCount--;

                const msg = read.value;
                console.log(msg);

                if (this.FilterMessage(msg, hWnd, wMsgFilterMin, wMsgFilterMax)) {
                    if (!wRemoveMsg)
                        messages.push(msg);

                    return msg;
                }
                else {
                    messages.push(msg);
                }
            }
        }
        finally {
            messages.reverse().forEach(msg => this.EnqueueMessage(msg));
        }
        
        return null;
    }

    async TranslateMessage(lpMsg: MSG): Promise<boolean> {
        return true; // TODO: implement
    }

    async DispatchMessage(lpMsg: MSG): Promise<LRESULT> {
        const hWnd = this._w32ProcInfo.hWnds.find(hWnd => hWnd === lpMsg.hWnd);
        if (hWnd) {
            const wnd = ObGetObject<WND>(hWnd);
            if (wnd) {
                return await wnd.WndProc(lpMsg.message, lpMsg.wParam, lpMsg.lParam);
            }
        }

        return false;
    }

    private FilterMessage(msg: MSG, hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): boolean {
        return (
            (hWnd == 0 || msg.hWnd === hWnd) &&
            (wMsgFilterMin == 0 || msg.message >= wMsgFilterMin) &&
            (wMsgFilterMax == 0 || msg.message <= wMsgFilterMax)
        );
    }
}
