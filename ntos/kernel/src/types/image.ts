import Executable from "ntos-sdk/types/Executable.js";

// TODO: this will get refactored over time
export interface IMAGEINFO {
    hModule: number;
    lpszEntryPoint: string; // a data URI to the library file
    lpExecInfo: Executable;
    lpData: Uint8Array;
}