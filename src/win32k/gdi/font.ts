import { GDIOBJ } from "./ntgdi.js";

export default interface FONT extends GDIOBJ {
    _type: "FONT";
    lpszFaceName: string;
    fSize: number;
    flags: number;
}