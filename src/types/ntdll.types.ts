import { HANDLE, PEB } from "./types.js";

import Executable from "./Executable.js";

export const CALLBACK_MESSAGE_TYPE = 0x7FFFFFFF;

const NTDLL = {
    ProcessCreate: 0x00000001,
    LoadSubsystem: 0x00000002,
    ProcessExit: 0x00000003,
    ProcessCrash: 0x00000004,    
}

export default NTDLL;
