/**
 * @jest-environment node
 */
const SimpleCrypto = require('../lib')

const config = {
  algorithm: 'aes-256-cbc',
  passphrase: 'abcdefghijklmnopqrstuvwxyz012345'
}

let simpleCrypto
const text = 'hello world'
beforeEach(() => {
  simpleCrypto = new SimpleCrypto(config)
})

async function testEncryptAndDecrypt (simpleCrypto) {
  const encrypted = await simpleCrypto.encrypt(text)
  const decrypted = await simpleCrypto.decrypt(encrypted)
  expect(decrypted).toEqual(text)
}

describe('SimpleCrypto', () => {
  describe('API', () => {
    test('Encrypt', async () => {
      await expect(simpleCrypto.encrypt(text)).resolves.toBeTruthy()
    })

    test('Decrypt', async () => {
      await testEncryptAndDecrypt(simpleCrypto)
    })
  })

  test('Throws error on empty algorithm', async () => {
    const cfg = { ...config }
    cfg.algorithm = null
    expect(() => new SimpleCrypto(cfg)).toThrow()

    cfg.algorithm = undefined
    expect(() => new SimpleCrypto(cfg)).toThrow()

    cfg.algorithm = ''
    expect(() => new SimpleCrypto(cfg)).toThrow()
  })

  test('Throws error on empty passphrase', async () => {
    const cfg = { ...config }
    cfg.passphrase = null
    expect(() => new SimpleCrypto(cfg)).toThrow()

    cfg.passphrase = undefined
    expect(() => new SimpleCrypto(cfg)).toThrow()

    cfg.passphrase = ''
    expect(() => new SimpleCrypto(cfg)).toThrow()
  })

  test('Throws error on bad algorithm', async () => {
    const cfg = { ...config }
    cfg.algorithm = 'aes-250-cbc'
    expect(() => new SimpleCrypto(cfg)).toThrow('Algorithm not supported')
  })

  test('Throws error if randomBytes fails', async () => {
    const fakeCrypto = {
      getCiphers: jest.fn().mockImplementation(() => ['aes-256-cbc']),
      randomBytes: jest.fn().mockImplementation((numBytes, cb) => cb(err, null))
    }
    simpleCrypto.crypto = fakeCrypto
    const err = new Error('Just fail')
    await expect(simpleCrypto.encrypt('test')).rejects.toEqual(err)
  })

  describe('Short passphrase tests', () => {
    test('Works fine if a short key is provided', async () => {
      const cfg = { ...config, passphrase: 'test' }
      const simpleCrypto = new SimpleCrypto(cfg)
      await testEncryptAndDecrypt(simpleCrypto)
    })
    test('Different instances use different passphrases', async () => {
      const cfg = { ...config, passphrase: 'test' }
      const sc1 = new SimpleCrypto(cfg)
      const sc2 = new SimpleCrypto(cfg)

      const enc1 = await sc1.encrypt(text)
      const enc2 = await sc2.encrypt(text)

      await expect(sc2.decrypt(enc1)).rejects.toThrow()
      await expect(sc1.decrypt(enc2)).rejects.toThrow()
    })
  })
  test('Throws error on using a large passphrase', async () => {
    const cfg = { ...config }
    cfg.passphrase += cfg.passphrase
    simpleCrypto = new SimpleCrypto(cfg)
    await expect(simpleCrypto.encrypt(text)).rejects.toThrow()
  })
})
