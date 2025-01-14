'use strict'

const crypto = require('brave-crypto')
const {generateDeviceIdV2} = require('../lib/crypto')
const messages = require('./constants/messages')
const {syncVersion} = require('./config')

/**
 * Initializes crypto and device ID
 * @returns {Promise}
 */
module.exports.init = function () {
  return new Promise((resolve, reject) => {
    const ipc = window.chrome.ipcRenderer
    ipc.send(messages.GET_INIT_DATA, syncVersion)
    ipc.once(messages.GOT_INIT_DATA, (e, seed, deviceId, config, deviceIdV2) => {
      if (seed === null) {
        // Generate a new "persona"
        seed = crypto.getSeed() // 32 bytes
        deviceId = new Uint8Array([0])
        deviceIdV2 = generateDeviceIdV2()
        ipc.send(messages.SAVE_INIT_DATA, seed, deviceId, deviceIdV2)
        // TODO: The background process should listen for SAVE_INIT_DATA and emit
        // GOT_INIT_DATA once the save is successful
      }

      // XXX: workaround #17
      seed = seed instanceof Array ? new Uint8Array(seed) : seed
      deviceId = deviceId instanceof Array ? new Uint8Array(deviceId) : deviceId
      if (!(seed instanceof Uint8Array) || seed.length !== crypto.DEFAULT_SEED_SIZE) {
        reject(new Error('Invalid crypto seed'))
        return
      }
      resolve({seed, deviceId, config, deviceIdV2})
    })
  })
}
