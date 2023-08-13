'use strict';
const { Connector } = require('@toa.io/core');
const { name } = require('./queues');
/**
 * @implements {toa.core.bindings.Emitter}
 */
class Emitter extends Connector {
    /** @type {string} */
    #exchange;
    /** @type {toa.amqp.Communication} */
    #comm;
    constructor(comm, locator, label) {
        super();
        this.#exchange = name(locator, label);
        this.#comm = comm;
        this.depends(comm);
    }
    async emit(message) {
        await this.#comm.emit(this.#exchange, message, PROPERTIES);
    }
}
const PROPERTIES = { headers: { 'toa.io/amqp': '0' } };
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map