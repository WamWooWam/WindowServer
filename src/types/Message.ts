//
// Represents a message that can be passed between a process and the host.
//

import { Subsystem } from "./types.js"

export default interface Message {
    subsys: Subsystem;
    type: number;
    data: any;
}