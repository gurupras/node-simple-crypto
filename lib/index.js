const crypto = require('crypto')

class SimpleCrypto {
  constructor ({ algorithm, passphrase }, localCrypto = crypto) {
    if (!algorithm || !passphrase) {
      throw new Error('Failed to specify algorithm/passphrase')
    }
    if (!crypto.getCiphers().includes(algorithm)) {
      throw new Error('Algorithm not supported')
    }

    Object.assign(this, {
      crypto: localCrypto,
      algorithm,
      passphrase: Buffer.from(passphrase, 'utf-8')
    })
  }

  randomBytes (numBytes) {
    const { crypto } = this
    return new Promise((resolve, reject) => {
      crypto.randomBytes(numBytes, function (err, bytes) {
        if (err) {
          return reject(err)
        }
        resolve(bytes)
      })
    })
  }

  async getKeyAndIV () {
    const { passphrase } = this
    const ivBuffer = await this.randomBytes(16)
    var keyBuffer = passphrase
    if (keyBuffer.length < 32) {
      const randomBytes = await this.randomBytes(32 - keyBuffer.length)
      keyBuffer = Buffer.concat([keyBuffer, randomBytes])
      this.passphrase = keyBuffer
    }
    return {
      iv: ivBuffer,
      key: keyBuffer
    }
  }

  async encrypt (text, algorithm = this.algorithm, encoding = 'hex') {
    const { crypto, passphrase } = this
    const { key, iv } = await this.getKeyAndIV(passphrase)
    // console.log(`[encrypt]: iv=${iv.toString('hex')} length=${iv.length}`)
    var cipher = crypto.createCipheriv(algorithm, key, iv)

    var result = cipher.update(text, 'utf-8', encoding)
    result += cipher.final(encoding)
    return `${iv.toString('hex')}:${result}`
  }

  async decrypt (hex, algorithm = this.algorithm, encoding = 'utf-8') {
    const { crypto, passphrase } = this
    const iv = hex.substring(0, hex.indexOf(':'))
    // console.log(`[decrypt]: hex=${hex}`)
    // console.log(`[decrypt]: iv=${iv} length=${iv.length}`)
    const input = hex.substr(hex.indexOf(':') + 1)
    // console.log(`[decrypt]: input=${input}`)
    var decipher = crypto.createDecipheriv(algorithm, passphrase, Buffer.from(iv, 'hex'))

    var result = decipher.update(input, 'hex', encoding)
    result += decipher.final(encoding)
    return result
  }
}

module.exports = SimpleCrypto
