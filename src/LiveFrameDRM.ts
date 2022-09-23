import EventEmitter2 from "eventemitter2";
import { 
    IDRMProvider, IErrorElement, ILFrameDRM, 
    ILFrameDRMProps, IStatePages
} from "./LiveFrameTypes";
import CashDOM from "cash-dom";
import { 
    JSONRPCClient, JSONRPCErrorException, JSONRPCErrorResponse, 
    JSONRPCServer, JSONRPCServerAndClient
} from "json-rpc-2.0";

class LiveFrameDRM implements ILFrameDRM {
    #hostURL: string;
    #tokenProvider: IDRMProvider;
    events: EventEmitter2;
    #statePages: IStatePages;
    #rpc: JSONRPCServerAndClient;
    #keyRecvTimeout: number;
    readonly JSONRPCclass: any = {  JSONRPCServer, JSONRPCClient, JSONRPCServerAndClient }
    constructor({ hostURL, tokenProvider, statePages, keyRecvTimeout } : ILFrameDRMProps) {
        this.#hostURL = hostURL;
        this.#tokenProvider = tokenProvider;
        this.events = new EventEmitter2();
        if(typeof statePages == "undefined")
            this.#statePages = {
                error: (outputEl) => CashDOM(outputEl).text(outputEl.errorCode + ": " + outputEl.errorText),
                verifyProcess: (outputEl) => CashDOM(outputEl).text("Verifying keys...")
            }
        else
            this.#statePages = statePages;
        this.#keyRecvTimeout = keyRecvTimeout ? keyRecvTimeout : 3 * 1000;
        this.#rpc = new JSONRPCServerAndClient(
            new JSONRPCServer(),
            new JSONRPCClient((request) => {
                try {
                    window.parent.postMessage( JSON.stringify(request) );
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject(error);
                }
            })
        );
        window.onmessage = (event) => {
            this.#rpc.receiveAndSend( JSON.parse(event.data.toString()) );
        }    
    }
    #genErrorElement(code: number, text: String){
        const elem: IErrorElement = document.createElement("div");
        elem.errorCode = code;
        elem.errorText = text;
        this.#statePages.error(elem);
        return elem;
    }
    #displayErrorHTML(el: IErrorElement) {
        this.events.emit("drm-error", { code: el.errorCode, text: el.errorText });
        return CashDOM("body").empty().append(el);
    }
    async start(): Promise<any> {
        let secretFetcherResponse: JSONRPCErrorResponse | string;
        let isValid: Boolean;
        if(window.parent.location.hostname === this.#hostURL){
                try {
                    secretFetcherResponse = await this.#rpc.timeout(this.#keyRecvTimeout).request("secret");
                    // console.log(secretFetcherResponse);
                    if(secretFetcherResponse && typeof secretFetcherResponse == "string"){
                        isValid = await this.#tokenProvider.verifyToken(secretFetcherResponse);
                        if (isValid){
                            this.events.emit("success", this.#rpc);
                            // console.log("success");
                        } else this.#displayErrorHTML(this.#genErrorElement(50045, "Invalid Secret Exchange Key"));
                    }
                } catch(e: any) { 
                    if(e instanceof JSONRPCErrorException) {
                        this.#displayErrorHTML(
                            this.#genErrorElement(
                                e.code,
                                `JSON-RPC Error: ${e.message}`
                            )
                        )
                    }
                }
        } else this.#displayErrorHTML(this.#genErrorElement(50016, "Invalid Host Header"));
    }
    async reload(): Promise<any> {
        return await this.start();
    }
}

export default LiveFrameDRM;