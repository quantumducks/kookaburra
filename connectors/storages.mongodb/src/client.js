'use strict'

/**
 * @typedef {import('mongodb').MongoClient} MongoClient
 * @typedef {{ count: number, client: MongoClient }} Instance
 * @typedef {import('@toa.io/core').Locator} Locator
 */

const { Connector } = require('@toa.io/core')
const { resolve } = require('@toa.io/pointer')
const { ID } = require('./deployment')
const { MongoClient } = require('mongodb')

/**
 * @type {Record<string, Promise<Instance>>}
 */
const INSTANCES = {}

class Client extends Connector {
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
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async open () {
    const urls = await this.resolveURLs()
    const db = process.env.CONTEXT ?? 'toa-dev'
    const collection = this.locator.lowercase

    this.key = getKey(db, urls)

    INSTANCES[this.key] ??= this.createInstance(urls)

    this.instance = await INSTANCES[this.key]
    this.instance.count++

    this.collection = this.instance.client.db(db).collection(collection)
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

    console.info('Connecting to MongoDB:', hosts.join(', '))

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
}

function getKey (db, urls) {
  return db + ':' + urls.sort().join(' ')
}

const OPTIONS = {
  ignoreUndefined: true,
  connectTimeoutMS: 0,
  serverSelectionTimeoutMS: 0
}

exports.Client = Client
