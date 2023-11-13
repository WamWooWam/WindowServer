import Message from "./Message.js";

type Version = [major: number, minor: number, build: number, revision: number];

type Subsystem = string;
type MessageType = number;

type HANDLE = number;

type SubsystemHandlers = {
    [key: number]: (peb: PEB, data: any) => any | Promise<any>;
}

type PEB = {
    hProcess: HANDLE;
    hThread: HANDLE;
    dwProcessId: number;
    dwThreadId: number;

    lpOwnedHandles: HANDLE[];
    lpHandlers: Map<Subsystem, SubsystemHandlers>;
}

export { Version, Subsystem, SubsystemHandlers, MessageType, HANDLE, PEB };