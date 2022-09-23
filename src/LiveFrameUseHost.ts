import { IDRMProvider } from "./LiveFrameTypes";
import { JSONRPCServer } from "json-rpc-2.0";

export default function createHostDRMRunner( provider: IDRMProvider, contentWindow: Window ) {
    const rpcServer = new JSONRPCServer()
    rpcServer.addMethod("secret", () => provider.generateToken())
    window.onmessage = (event) => {
        console.log("<--", JSON.parse(event.data.toString()))
        rpcServer.receive( JSON.parse(event.data.toString()) ).then((res) => {
            console.log("-->", res)
            if(res) contentWindow.postMessage( JSON.stringify(res) );
        });
    }
    return rpcServer
}