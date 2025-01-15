'use strict'

const { console } = require('openspan')

function graceful (connector) {
  ['SIGTERM', 'SIGINT']
    .forEach(signal => process.once(signal, async () => {
      console.info('Shutting down', { signal })

      await connector.disconnect(true)

      process.exit(0)
    }))
}

exports.graceful = graceful
