// internal window messages
export enum WMP {
    CREATEELEMENT = 0x8000,
    ADDCHILD = 0x8001,
    REMOVECHILD = 0x8002,
}

export interface WND_DATA {
    pTitleBar: HTMLElement;
    pTitleBarText: HTMLElement;
    pTitleBarControls: HTMLElement;
    pMinimizeButton: HTMLElement;
    pMaximizeButton: HTMLElement;
    pCloseButton: HTMLElement;
    pWindowBody: HTMLElement;
}