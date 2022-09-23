import EventEmitter2 from "eventemitter2";

export interface IErrorElement extends HTMLDivElement {
    errorCode?: number;
    errorText?: String;
}
export interface IDRMProvider {
    generateToken(): Promise<String>;
    verifyToken(token: String): Promise<Boolean>;
}
export interface IStatePages {
    error(outputEl: IErrorElement): any;
    verifyProcess(outputEl: HTMLElement): any;
}
export interface ILFrameDRM {
    events: EventEmitter2;
    start(): Promise<any>;
    reload(): Promise<any>;
}

export interface ILFrameDRMProps {
    hostURL: string;
    tokenProvider: IDRMProvider;
    statePages?: IStatePages;
    keyRecvTimeout: number;
}