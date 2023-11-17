import { HWND, LRESULT, MSG } from "../types/user32.types.js";
import { MSG_QUEUE, W32PROCINFO } from "./shared.js";

import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

type MSG_CALLBACK = (result: LRESULT) => Promise<void> | void;
type MSG_CALLBACKS = { [msg: number]: MSG_CALLBACK[] };

export default class W32MSG_QUEUE implements MSG_QUEUE {
    private _msgQueue: MSG[] = [];
    private _msgQueuePromise: Promise<MSG> = null;
    private _msgQueueResolve: (value?: any) => void = null;

    private _w32ProcInfo: W32PROCINFO = null;

    constructor(peb: PEB, procInfo: W32PROCINFO) {
        this._msgQueuePromise = new Promise((resolve) => {
            this._msgQueueResolve = resolve;
        });

        this._w32ProcInfo = procInfo;
    }

    public EnqueueMessage(msg: MSG): void {        
        this._msgQueue.push(msg);
        this._msgQueueResolve(msg);
    }

    async GetMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): Promise<MSG> {
        while (true) {
            const msg = await this.WaitForMessage();
            this._msgQueue.shift();
            if (this.FilterMessage(msg, hWnd, wMsgFilterMin, wMsgFilterMax)) {
                return msg;
            }
        }
    }

    async PeekMessage(hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number, wRemoveMsg: number): Promise<MSG> {
        while (true) {
            const msg = await this.WaitForMessage();
            if (this.FilterMessage(msg, hWnd, wMsgFilterMin, wMsgFilterMax)) {
                if (wRemoveMsg) {
                    this._msgQueue.shift();
                }

                return msg;
            }
        }
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

    // TODO: this will currently die if multiple "threads" are waiting for messages
    private WaitForMessage(): Promise<MSG> {
        if (this._msgQueue.length > 0) {
            return Promise.resolve(this._msgQueue[0]);
        }

        return new Promise((resolve) => {
            this._msgQueueResolve = resolve;
        });
    }

    private FilterMessage(msg: MSG, hWnd: HWND, wMsgFilterMin: number, wMsgFilterMax: number): boolean {
        return (
            (hWnd == 0 || msg.hWnd === hWnd) &&
            (wMsgFilterMin == 0 || msg.message >= wMsgFilterMin) &&
            (wMsgFilterMax == 0 || msg.message <= wMsgFilterMax)
        );
    }
}
