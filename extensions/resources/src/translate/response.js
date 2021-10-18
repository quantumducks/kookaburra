'use strict'

const { exceptions: { codes } } = require('@toa.io/core')

const etag = require('./etag')

const ok = (reply, res, req) => {
  if (reply.output?._version !== undefined) {
    const { _version, ...output } = reply.output

    res.set('etag', etag.set(_version))
    reply.output = output

    const condition = req.get('if-none-match')

    if (condition !== undefined && req.safe) {
      const value = etag.get(condition)

      if (value === _version) {
        res.status(304).end()
        return
      }
    }
  }

  res.status(req.method === 'POST' ? 201 : 200)
  res.send(reply)
}

const missed = (response) => response.status(404)

const exception = (exception, response) => {
  const status = STATUSES[exception.code] || 500

  response.status(status)
  response.send(exception)
}

const STATUSES = {
  [codes.RequestContract]: 400,
  [codes.RequestFormat]: 400,
  [codes.RequestConflict]: 403,
  [codes.StateNotFound]: 404,
  [codes.NotImplemented]: 405,
  [codes.StatePrecondition]: 412
}

exports.ok = ok
exports.missed = missed
exports.exception = exception
