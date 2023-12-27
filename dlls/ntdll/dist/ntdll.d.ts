type Version = [major: number, minor: number, build: number, revision: number];
type SubsystemId = string;//# sourceMappingURL=types.d.ts.map

interface Executable {
    file: string;
    type: "executable" | "dll";
    subsystem: "console" | "windows";
    arch: "js" | "wasm";
    entryPoint: string | Function | null;
    dependencies: string[];
    name: string;
    version: Version;
    rsrc: any;
}

interface Message<T = any> {
    lpSubsystem: SubsystemId;
    nType: number;
    nChannel?: number;
    nReplyChannel?: number;
    data: T;
}

declare const CALLBACK_MESSAGE_TYPE = 2147483647;
type HANDLE = number;

/**
 * @module ntdll
 * @description NT Layer DLL
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/api/winbase/}
 * @usermode
 */

interface Subsystem {
    name: string;
    memory: SharedArrayBuffer | null;
    SendMessage<S = any, R = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<Message<R>>;
    PostMessage<S = any>(msg: Omit<Message<S>, "lpSubsystem">): Promise<void>;
    RegisterCallback(callback: (msg: Message) => any | Promise<any>, persist?: boolean): number;
    GetCallback(id: number): ((msg: Message) => void) | undefined;
}
declare function NtRegisterSubsystem(subsys: SubsystemId, handler: (msg: Omit<Message, "subsys">) => void, cbSharedMemory?: number): Promise<Subsystem>;
declare const ntdll: Executable;

export { CALLBACK_MESSAGE_TYPE, type HANDLE, NtRegisterSubsystem, type Subsystem, ntdll as default };
//# sourceMappingURL=ntdll.d.ts.map
