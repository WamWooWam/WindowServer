// env: worker

import Executable from "../types/Executable.js";
import Message from "../types/Message.js";
import { Subsystem } from "../types/types.js";
import { SUBSYS_NTDLL } from "../types/subsystems.js";
import NTDLL from "../types/ntdll.types.js";


let sharedMemory: SharedArrayBuffer;

// all worker events should be handled by this subsystem
const __addEventListener = globalThis.addEventListener;
const __removeEventListener = globalThis.removeEventListener;
const __postMessage = globalThis.postMessage;

globalThis.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined) => {
    console.warn(`ignoring addEventListener(${type})`);
}

globalThis.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined) => {
    console.warn(`ignoring removeEventListener(${type})`);
}

globalThis.postMessage = () => {
    console.warn(`ignoring postMessage()`);
}

delete globalThis.onmessage;
delete globalThis.onerror;
delete globalThis.onmessageerror;
delete globalThis.onunhandledrejection;

const subsystems = new Map<Subsystem, ((msg: Message) => void)>();
__addEventListener('message', (event) => {
    console.debug(`ntclient recieved message %s:%d, %O`, event.data.subsys, event.data.type, event.data.data);
    const handler = subsystems.get(event.data.subsys);
    if (handler) {
        handler(event.data);
    } else {
        console.error(`unknown subsystem ${event.data.subsys}`);
    }
});

__addEventListener('error', (event) => {
    console.error(event); // TODO: send error to parent
});

__addEventListener('messageerror', (event) => {
    console.error(event); // TODO: send error to parent
});

__addEventListener('unhandledrejection', (event) => {
    console.error(event); // TODO: send error to parent
});

type NtSendMessage = (msg: Omit<Message, "subsys">) => Promise<Message>;
type NtPostMessage = (msg: Omit<Message, "subsys">) => Promise<void>;

const [NTDLL_SendMessage, NTDLL_PostMessage] = await NtRegisterSubsystem(SUBSYS_NTDLL, NTDLL_HandleMessage);

async function NtRegisterSubsystem(subsys: Subsystem, handler: (msg: Omit<Message, "subsys">) => void): Promise<[NtSendMessage, NtPostMessage]> {
    subsystems.set(subsys, handler);

    const ret = await NtSendMessageAsync({
        subsys: SUBSYS_NTDLL,
        type: NTDLL.SubsystemLoaded,
        data: {
            subsys: subsys,
        }
    });

    return [
        async (msg: Omit<Message, "subsys">) => await NtSendMessageAsync({ subsys, ...msg }),
        async (msg: Omit<Message, "subsys">) => await NtPostMessageAsync({ subsys, ...msg }),
    ]
}

async function NtPostMessageAsync(msg: Message): Promise<void> {
    __postMessage(msg);
}

async function NtSendMessageAsync(msg: Message): Promise<Message> {
    __postMessage(msg);

    return new Promise((resolve, reject) => {
        const handler = (event: MessageEvent) => {
            if (event.data.subsys == msg.subsys) {
                if (event.data.type === (msg.type | 0x80000000)) {
                    __removeEventListener('message', handler);
                    reject(event.data);
                } else if (event.data.type === msg.type) {
                    __removeEventListener('message', handler);
                    resolve(event.data);
                }
            }
        };

        __addEventListener('message', handler);
    });
}

async function executeLoad(exec: any) {
    sharedMemory = exec.sharedMemory;

    for (const iterator of exec.dependencies) {
        await import("/client/" + iterator);
    }

    const module = await import("/" + exec.file);
    if (module[exec.entryPoint]) {
        module[exec.entryPoint]();
    }
}

function NTDLL_HandleMessage(msg: Message) {
    switch (msg.type) {
        case NTDLL.ProcessCreate: // load executable
            executeLoad(msg.data);
            break;
    }
};

export { NtRegisterSubsystem, NtSendMessageAsync, NtPostMessageAsync };
