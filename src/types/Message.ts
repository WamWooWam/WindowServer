//
// Represents a message that can be passed between a process and the host.
//

import { SubsystemId } from "./types.js"

export default interface Message<T = any> {
    lpSubsystem: SubsystemId;
    nType: number;
    nChannel?: number;
    nReplyChannel?: number;
    data: T;
}