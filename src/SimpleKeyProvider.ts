import { IDRMProvider } from "./LiveFrameTypes";

class SimpleKeyProvider implements IDRMProvider {
    #secret: String;
    constructor(secret: String){
        this.#secret = secret
    }

    async generateToken(): Promise<String> {
        return this.#secret
    }
    async verifyToken(token: String): Promise<Boolean> {
        console.log (token, this.#secret, token == this.#secret)
        return token == this.#secret
    }
}
export default SimpleKeyProvider;