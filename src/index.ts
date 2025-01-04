import * as crypto from 'crypto';

interface SimpleCryptoConfig {
  algorithm: string;
  passphrase: string;
}

class SimpleCrypto {
  private crypto: typeof crypto;
  private algorithm: string;
  private passphrase: Buffer;

  constructor({ algorithm, passphrase }: SimpleCryptoConfig, localCrypto: typeof crypto = crypto) {
    if (!algorithm || !passphrase) {
      throw new Error('Failed to specify algorithm/passphrase');
    }
    if (!crypto.getCiphers().includes(algorithm)) {
      throw new Error('Algorithm not supported');
    }

    this.crypto = localCrypto;
    this.algorithm = algorithm;
    this.passphrase = Buffer.from(passphrase, 'utf-8');
  }

  private randomBytes(numBytes: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.crypto.randomBytes(numBytes, (err, bytes) => {
        if (err) {
          return reject(err);
        }
        resolve(bytes);
      });
    });
  }

  private async getKeyAndIV(): Promise<{ iv: Buffer; key: Buffer }> {
    const ivBuffer = await this.randomBytes(16);
    let keyBuffer = this.passphrase;
    if (keyBuffer.length < 32) {
      const randomBytes = await this.randomBytes(32 - keyBuffer.length);
      keyBuffer = Buffer.concat([keyBuffer, randomBytes]);
      this.passphrase = keyBuffer;
    }
    return {
      iv: ivBuffer,
      key: keyBuffer,
    };
  }

  async encrypt(text: string, algorithm: string = this.algorithm, encoding: crypto.Encoding = 'hex'): Promise<string> {
    const { key, iv } = await this.getKeyAndIV();
    const cipher = this.crypto.createCipheriv(algorithm, key, iv);

    let result = cipher.update(text, 'utf8', encoding);
    result += cipher.final(encoding);
    return `${iv.toString('hex')}:${result}`;
  }

  async decrypt(hex: string, algorithm: string = this.algorithm, encoding: crypto.Encoding = 'utf8'): Promise<string> {
    const iv = hex.substring(0, hex.indexOf(':'));
    const input = hex.substring(hex.indexOf(':') + 1);
    const decipher = this.crypto.createDecipheriv(algorithm, this.passphrase, Buffer.from(iv, 'hex'));

    let result = decipher.update(input, 'hex', encoding);
    result += decipher.final(encoding);
    return result;
  }
}

export default SimpleCrypto;