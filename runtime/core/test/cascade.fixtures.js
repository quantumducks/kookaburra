'use strict'

const bridges = ['a', 'b', 'c'].map((index) => ({
  execute: jest.fn((request) => {
    if (request?.error === index) return { error: index }

    return { output: { [index]: true } }
  })
}))

exports.bridges = bridges
