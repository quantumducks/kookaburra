"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Effect = void 0;
const node_crypto_1 = require("node:crypto");
class Effect {
    timeout;
    authenticator;
    credParams;
    mount(context) {
        this.timeout = context.configuration.timeout;
        this.authenticator = { userVerification: context.configuration.verification, residentKey: context.configuration.residence };
        this.credParams = context.configuration.algorithms.map((alg) => ({ type: 'public-key', alg }));
    }
    async execute(input) {
        const challenge = Buffer.from((0, node_crypto_1.randomBytes)(32)).toString('base64url');
        return {
            challenge,
            timeout: this.timeout,
            authenticatorSelection: this.authenticator,
            pubKeyCredParams: this.credParams
        };
    }
}
exports.Effect = Effect;
//# sourceMappingURL=challenge.js.map