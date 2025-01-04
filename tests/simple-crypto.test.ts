import { describe, test, expect, beforeEach } from 'vitest';
import SimpleCrypto from '../src/index.js';

const config = {
  algorithm: 'aes-256-cbc',
  passphrase: 'abcdefghijklmnopqrstuvwxyz012345'
};

let simpleCrypto: SimpleCrypto;
const text = 'hello world';

beforeEach(() => {
  simpleCrypto = new SimpleCrypto(config);
});

async function testEncryptAndDecrypt(simpleCrypto: SimpleCrypto) {
  const encrypted = await simpleCrypto.encrypt(text);
  const decrypted = await simpleCrypto.decrypt(encrypted);
  expect(decrypted).toEqual(text);
}

describe('SimpleCrypto', () => {
  describe('API', () => {
    test('Encrypt', async () => {
      await expect(simpleCrypto.encrypt(text)).resolves.toBeTruthy();
    });

    test('Decrypt', async () => {
      await testEncryptAndDecrypt(simpleCrypto);
    });
  });

  test('Throws error on empty algorithm', () => {
    const cfg = { ...config, algorithm: null as any };
    expect(() => new SimpleCrypto(cfg)).toThrow();

    cfg.algorithm = undefined;
    expect(() => new SimpleCrypto(cfg)).toThrow();

    cfg.algorithm = '';
    expect(() => new SimpleCrypto(cfg)).toThrow();
  });

  test('Throws error on empty passphrase', () => {
    const cfg = { ...config, passphrase: null as any };
    expect(() => new SimpleCrypto(cfg)).toThrow();

    cfg.passphrase = undefined;
    expect(() => new SimpleCrypto(cfg)).toThrow();

    cfg.passphrase = '';
    expect(() => new SimpleCrypto(cfg)).toThrow();
  });

  test('Throws error on bad algorithm', () => {
    const cfg = { ...config, algorithm: 'aes-250-cbc' };
    expect(() => new SimpleCrypto(cfg)).toThrow('Algorithm not supported');
  });

  test('Throws error if randomBytes fails', async () => {
    const err = new Error('Just fail');
    const fakeCrypto = {
      getCiphers: () => ['aes-256-cbc'],
      randomBytes: (numBytes: number, cb: (err: Error | null, buffer: Buffer | null) => void) => cb(err, null)
    };
    simpleCrypto['crypto'] = fakeCrypto as any; // TypeScript workaround

    await expect(simpleCrypto.encrypt('test')).rejects.toEqual(err);
  });

  test('Encrypted text from one instance can be deciphered from another', async () => {
    const sc2 = new SimpleCrypto(config);

    const encrypted = await simpleCrypto.encrypt(text);
    const decrypted = await sc2.decrypt(encrypted);
    expect(decrypted).toEqual(text);
  });

  describe('Short passphrase tests', () => {
    test('Works fine if a short key is provided', async () => {
      const cfg = { ...config, passphrase: 'test' };
      const simpleCrypto = new SimpleCrypto(cfg);
      await testEncryptAndDecrypt(simpleCrypto);
    });

    test('Different instances use different passphrases', async () => {
      const cfg = { ...config, passphrase: 'test' };
      const sc1 = new SimpleCrypto(cfg);
      const sc2 = new SimpleCrypto(cfg);

      const enc1 = await sc1.encrypt(text);
      const enc2 = await sc2.encrypt(text);

      await expect(sc2.decrypt(enc1)).rejects.toThrow();
      await expect(sc1.decrypt(enc2)).rejects.toThrow();
    });
  });

  test('Throws error on using a large passphrase', async () => {
    const cfg = { ...config, passphrase: config.passphrase + config.passphrase };
    simpleCrypto = new SimpleCrypto(cfg);
    await expect(simpleCrypto.encrypt(text)).rejects.toThrow();
  });
});