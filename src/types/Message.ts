//
// Represents a message that can be passed between a process and the host.
//

import { Subsystem } from "./types.js"

export default interface Message<T = any> {
    lpSubsystem: Subsystem;
    nType: number;
    nChannel?: number;
    nReplyChannel?: number;
    data: T;
}