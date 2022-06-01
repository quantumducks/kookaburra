'use strict'

const { Connector, exceptions: { NotImplementedException } } = require('@toa.io/core')

const translate = require('./translate')

/**
 * @implements {toa.extensions.resources.Remote}
 */
class Remote extends Connector {
  #remote
  #tree

  constructor (server, remote, tree) {
    super()

    const { domain, name } = remote.locator
    const route = '/' + (domain === name ? domain : domain + '/' + name) + '*'

    server.route(route, (req, res) => this.#reply(req, res))

    this.#remote = remote
    this.#tree = tree

    this.depends(server)
    this.depends(remote)
  }

  update (definition) {
    this.#tree.update(definition)
  }

  /** @hot */
  async #reply (req, res) {
    const match = this.#tree.match(req.params[0])

    if (match !== undefined) {
      try {
        const reply = await this.#call(req, match)

        translate.response.ok(reply, res, req)
      } catch (e) {
        translate.response.exception(e, res)
      }
    } else {
      translate.response.missed(res)
    }

    res.end()
  }

  /** @hot */
  async #call (req, match) {
    const method = req.method === 'HEAD' ? 'GET' : req.method
    const operation = match.node.operations[method]

    if (operation === undefined) throw new NotImplementedException()

    const request = translate.request(req, match.params)
    const query = match.node.query.parse(request.query, operation)

    if (query !== undefined) request.query = query

    return this.#remote.invoke(operation.operation, request)
  }
}

exports.Remote = Remote
