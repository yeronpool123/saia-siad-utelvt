'use strict'
const tf = require('@tensorflow/tfjs')
const jpeg = require('jpeg-js')

tf.node = tf.node || {}
tf.node.decodeImage = (buffer, channels = 3) => {
  const bytes = Buffer.from(buffer)
  const { width, height, data } = jpeg.decode(bytes, { useTArray: true })
  const out = new Uint8Array(width * height * channels)
  for (let i = 0, j = 0, k = 0; i < data.length; i += 4, j += channels) {
    out[j] = data[i]
    if (channels > 1) out[j + 1] = data[i + 1]
    if (channels > 2) out[j + 2] = data[i + 2]
  }
  return tf.tensor3d(out, [height, width, channels])
}

module.exports = tf