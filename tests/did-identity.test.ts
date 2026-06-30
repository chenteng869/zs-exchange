import { describe, it, expect } from 'vitest';

import { DidParserService } from '../src/modules/did-identity/core/services/did-parser.service';
import { DidGeneratorService } from '../src/modules/did-identity/core/services/did-generator.service';
import { DidResolverService } from '../src/modules/did-identity/core/services/did-resolver.service';
import { Ed25519KeyService } from '../src/modules/did-identity/core/crypto/ed25519-key.service';
import { Secp256k1KeyService } from '../src/modules/did-identity/core/crypto/secp256k1-key.service';
import { MultibaseService } from '../src/modules/did-identity/core/crypto/multibase.service';

const parser = new DidParserService();
const generator = new DidGeneratorService();
const resolver = new DidResolverService(parser);
const ed25519Service = new Ed25519KeyService();
const secp256k1Service = new Secp256k1KeyService();
const multibaseService = new MultibaseService();

describe('Multibase', () => {
  it('base58btc encode/decode roundtrip', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const encoded = multibaseService.encode(input, 'base58btc');
    expect(encoded.startsWith('z')).toBe(true);
    const decoded = multibaseService.decode(encoded);
    expect(decoded).toEqual(input);
  });

  it('base64 encode/decode roundtrip', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const encoded = multibaseService.encode(input, 'base64');
    expect(encoded.startsWith('m')).toBe(true);
    const decoded = multibaseService.decode(encoded);
    expect(decoded).toEqual(input);
  });
});

describe('Ed25519', () => {
  it('generate key pair', async () => {
    const keyPair = await ed25519Service.generateKeyPair();
    expect(keyPair.curve).toBe('Ed25519');
    expect(keyPair.publicKey.length).toBe(32);
    expect(keyPair.privateKey.length).toBeGreaterThan(0);
  });

  it('sign and verify roundtrip', async () => {
    const keyPair = await ed25519Service.generateKeyPair();
    const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    
    const signatureResult = await ed25519Service.signWithKeyPair(keyPair, data);
    expect(signatureResult.signature.length).toBeGreaterThan(0);
    
    const verified = await ed25519Service.verify(keyPair.publicKey, data, signatureResult.signature);
    expect(verified).toBe(true);
  });

  it('verify fails with wrong data', async () => {
    const keyPair = await ed25519Service.generateKeyPair();
    const data1 = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    const data2 = new Uint8Array([0x57, 0x6f, 0x72, 0x6c, 0x64]);
    
    const signatureResult = await ed25519Service.signWithKeyPair(keyPair, data1);
    const verified = await ed25519Service.verify(keyPair.publicKey, data2, signatureResult.signature);
    expect(verified).toBe(false);
  });

  it('public key to multibase', async () => {
    const keyPair = await ed25519Service.generateKeyPair();
    const multibaseKey = await ed25519Service.publicKeyToMultibase(keyPair.publicKey);
    expect(multibaseKey.startsWith('z')).toBe(true);
  });
});

describe('Secp256k1', () => {
  it('generate key pair', async () => {
    const keyPair = await secp256k1Service.generateKeyPair();
    expect(keyPair.curve).toBe('secp256k1');
    expect(keyPair.publicKey.length).toBe(64);
    expect(keyPair.privateKey.length).toBe(32);
  });

  it('sign and verify roundtrip', async () => {
    const keyPair = await secp256k1Service.generateKeyPair();
    const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    
    const signatureResult = await secp256k1Service.sign(keyPair.privateKey, data);
    expect(signatureResult.signature.length).toBeGreaterThan(0);
    
    const verified = await secp256k1Service.verify(keyPair.publicKey, data, signatureResult.signature);
    expect(verified).toBe(true);
  });

  it('verify fails with wrong data', async () => {
    const keyPair = await secp256k1Service.generateKeyPair();
    const data1 = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    const data2 = new Uint8Array([0x57, 0x6f, 0x72, 0x6c, 0x64]);
    
    const signatureResult = await secp256k1Service.sign(keyPair.privateKey, data1);
    const verified = await secp256k1Service.verify(keyPair.publicKey, data2, signatureResult.signature);
    expect(verified).toBe(false);
  });

  it('public key to address', async () => {
    const keyPair = await secp256k1Service.generateKeyPair();
    const address = await secp256k1Service.publicKeyToAddress(keyPair.publicKey);
    expect(address.startsWith('0x')).toBe(true);
    expect(address.length).toBe(42);
  });
});

describe('DID Parser', () => {
  it('parse did:key', () => {
    const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
    const result = parser.parse(did);
    expect(result.method).toBe('key');
    expect(result.id).toBe('z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH');
    expect(result.did).toBe(did);
  });

  it('parse did:pkh', () => {
    const did = 'did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678';
    const result = parser.parse(did);
    expect(result.method).toBe('pkh');
    expect(result.id).toBe('eip155:1:0x1234567890abcdef1234567890abcdef12345678');
  });

  it('parse did:web', () => {
    const did = 'did:web:example.com:user:alice';
    const result = parser.parse(did);
    expect(result.method).toBe('web');
    expect(result.id).toBe('example.com:user:alice');
  });

  it('parse did:ethr', () => {
    const did = 'did:ethr:0x1234567890abcdef1234567890abcdef12345678';
    const result = parser.parse(did);
    expect(result.method).toBe('ethr');
    expect(result.id).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('validate valid DID', () => {
    const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
    expect(parser.validate(did)).toBe(true);
  });

  it('validate invalid DID', () => {
    expect(parser.validate('invalid-did')).toBe(false);
    expect(parser.validate('did::invalid')).toBe(false);
  });
});

describe('DID Generator', () => {
  it('generate did:key with Ed25519', async () => {
    const result = await generator.generate('did:key', { keyType: 'Ed25519' });
    expect(result.did.startsWith('did:key:')).toBe(true);
    expect(result.document).toBeDefined();
    expect(result.document.id).toBeDefined();
    expect(result.document.verificationMethod).toBeDefined();
    expect(result.document.verificationMethod!.length).toBeGreaterThan(0);
  });

  it('generate did:key with secp256k1', async () => {
    const result = await generator.generate('did:key', { keyType: 'secp256k1' });
    expect(result.did.startsWith('did:key:')).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('generate did:pkh', async () => {
    const result = await generator.generate('did:pkh', { 
      chainId: 'eip155:1', 
      accountId: '0x1234567890abcdef1234567890abcdef12345678' 
    });
    expect(result.did.startsWith('did:pkh:')).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('generate did:web', async () => {
    const result = await generator.generate('did:web', { 
      domain: 'example.com',
      path: '/user/alice'
    });
    expect(result.did.startsWith('did:web:')).toBe(true);
    expect(result.document).toBeDefined();
  });
});

describe('DID Resolver', () => {
  it('resolve did:key', async () => {
    const generatorResult = await generator.generate('did:key', { keyType: 'Ed25519' });
    const resolveResult = await resolver.resolve(generatorResult.did);
    expect(resolveResult.didDocument?.id).toBe(generatorResult.did);
    expect(resolveResult.didDocument?.verificationMethod).toBeDefined();
  });

  it('resolve did:pkh', async () => {
    const generatorResult = await generator.generate('did:pkh', { 
      chainId: 'eip155:1', 
      accountId: '0x1234567890abcdef1234567890abcdef12345678' 
    });
    const resolveResult = await resolver.resolve(generatorResult.did);
    expect(resolveResult.didDocument?.id).toBe(generatorResult.did);
  });

  it('cache works', async () => {
    const generatorResult = await generator.generate('did:key', { keyType: 'Ed25519' });
    
    await resolver.resolve(generatorResult.did);
    
    const cached = await resolver.resolve(generatorResult.did);
    expect(cached.didDocument).toBeDefined();
    expect(cached.didDocument?.id).toBe(generatorResult.did);
  });

  it('resolve unknown DID returns not found', async () => {
    try {
      await resolver.resolve('did:key:unknown123');
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('DID Full Lifecycle', () => {
  it('did:key full lifecycle: generate -> parse -> resolve', async () => {
    const generatorResult = await generator.generate('did:key', { keyType: 'Ed25519' });
    
    const parsed = parser.parse(generatorResult.did);
    expect(parsed.method).toBe('key');
    expect(parsed.id).toBeDefined();
    
    const resolved = await resolver.resolve(generatorResult.did);
    expect(resolved.didDocument?.id).toBe(generatorResult.did);
    expect(resolved.didDocument?.verificationMethod).toBeDefined();
  });

  it('did:pkh full lifecycle: generate -> parse -> resolve', async () => {
    const generatorResult = await generator.generate('did:pkh', { 
      chainId: 'eip155:1', 
      accountId: '0x1234567890abcdef1234567890abcdef12345678' 
    });
    
    const parsed = parser.parse(generatorResult.did);
    expect(parsed.method).toBe('pkh');
    
    const resolved = await resolver.resolve(generatorResult.did);
    expect(resolved.didDocument?.id).toBe(generatorResult.did);
  });
});