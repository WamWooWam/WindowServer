import { Version } from "./types.js";

// 
//  Definition of an executable file, either a DLL or an EXE. Should be JSON serializable.
//  The loader will use this to create a WebWorker and load the executable into it.
//
export default interface Executable {
    file: string;
    type: "executable" | "dll";
    subsystem: "console" | "windows";
    arch: "js" | "wasm"; // not 100% sure how we're gonna handle WASM yet
    entryPoint: string; // much like in an actual OS, this will probably end up not being user code.
    dependencies: string[]; // list of other executables that this executable depends on

    name: string;
    version: Version;
    rsrc: any; // TODO: type this, win32 resource table
}
