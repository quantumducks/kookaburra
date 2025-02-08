'use strict'

/**
 * @typedef {import('mongodb').MongoClient} MongoClient
 * @typedef {{ count: number, client: MongoClient }} Instance
 * @typedef {import('@toa.io/core').Locator} Locator
 */

const { console } = require('openspan')
const { Connector } = require('@toa.io/core')
const { resolve } = require('@toa.io/pointer')
const { ID } = require('./deployment')
const { MongoClient } = require('mongodb')

/**
 * @type {Record<string, Promise<Instance>>}
 */
const INSTANCES = {}

class Client extends Connector {
  name

  /**
   * @public
   * @type {import('mongodb').Collection}
   */
  collection

  /**
   * @private
   * @type {Locator}
   */
  locator

  /**
   * @private
   * @type {Instance}
   */
  instance

  /**
   * @private
   * @type {string}
   */
  key

  /**
   * @param {Locator} locator
   */
  constructor (locator) {
    super()

    this.locator = locator
    this.name = locator.lowercase
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async open () {
    const urls = await this.resolveURLs()
    const dbname = this.resolveDB()

    this.key = getKey(dbname, urls)

    INSTANCES[this.key] ??= this.createInstance(urls)

    this.instance = await INSTANCES[this.key]
    this.instance.count++

    const db = this.instance.client.db(dbname)

    try {
      this.collection = await db.createCollection(this.name)
    } catch (e) {
      if (e.code !== ALREADY_EXISTS) {
        throw e
      }

      this.collection = db.collection(this.name)
    }
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async close () {
    const instance = await INSTANCES[this.key]

    instance.count--

    if (instance.count === 0) {
      await instance.client.close()
      delete INSTANCES[this.key]
    }
  }

  /**
   * @private
   * @param {string[]} urls
   * @return {Promise<Instance>}
   */
  async createInstance (urls) {
    const client = new MongoClient(urls.join(','), OPTIONS)
    const hosts = urls.map((str) => new URL(str).host)

    console.info('Connecting to MongoDB', { address: hosts.join(', ') })

    await client.connect()

    return {
      count: 0,
      client
    }
  }

  /**
   * @private
   * @return {Promise<string[]>}
   */
  async resolveURLs () {
    if (process.env.TOA_DEV === '1') {
      return ['mongodb://developer:secret@localhost']
    } else {
      return await resolve(ID, this.locator.id)
    }
  }

  /**
   * @private
   * @return {string}
   */
  resolveDB () {
    if (process.env.TOA_CONTEXT !== undefined) {
      return process.env.TOA_CONTEXT
    }

    if (process.env.TOA_DEV === '1') {
      return 'toa-dev'
    }

    throw new Error('Environment variable TOA_CONTEXT is not defined')
  }
}

function getKey (db, urls) {
  return db + ':' + urls.sort().join(' ')
}

const OPTIONS = {
  ignoreUndefined: true
}

const ALREADY_EXISTS = 48

exports.Client = Client
