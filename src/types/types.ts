type Version = [major: number, minor: number, build: number, revision: number];

type SubsystemId = string;
type MessageType = number;

type HANDLE = number;

type SubsystemHandlers = {
    [key: number]: (peb: PEB, data: any) => any | Promise<any>;
}

type SUBSYSTEM = {
    lpSubsystem: SubsystemId;
    lpSharedMemory: SharedArrayBuffer | null;
    lpExports: SubsystemHandlers;
    lpfnInit?: (peb: PEB, lpSubsystem: SUBSYSTEM) => void | Promise<void>;
    lpfnExit?: (peb: PEB, lpSubsystem: SUBSYSTEM) => void | Promise<void>;
    lpParams?: any;
}

type PEB = {
    id: string;
    hProcess: HANDLE;
    hThread: HANDLE;
    dwProcessId: number;
    dwThreadId: number;

    hDesktop: HANDLE;

    lpSubsystems: Map<SubsystemId, SUBSYSTEM>; // subsystem per process data
}

type SUBSYSTEM_DEF = {
    lpszName: string;
    lpExports: SubsystemHandlers;
    lpfnInit?: (peb: PEB, lpSubsystem: SUBSYSTEM) => void | Promise<void>;
    lpfnExit?: (peb: PEB, lpSubsystem: SUBSYSTEM) => void | Promise<void>;
}

export { Version, SUBSYSTEM_DEF, SubsystemId, SubsystemHandlers, MessageType, HANDLE, PEB, SUBSYSTEM };