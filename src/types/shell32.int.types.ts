export interface SH_CREATE_DIRECTORY_EX {
    hwnd: number;
    pszPath: string;
    psa: number;
}

export interface SH_CREATE_DIRECTORY_EX_REPLY {
    retVal: number;
}