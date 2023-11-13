import { PsCreateProcess } from "./loader.js"
import Executable from "./types/Executable.js";

(() => {
    PsCreateProcess("test.js", "", false, {}, "C:\\Windows\\System32", null);
})();