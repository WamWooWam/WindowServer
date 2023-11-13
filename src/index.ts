import { PsCreateProcess } from "./loader.js"
import Executable from "./types/Executable.js";

(() => {
    // for (let i = 0; i < 3; i++) {
        PsCreateProcess("test.js", "", false, {}, "/", null);
    // }
})();