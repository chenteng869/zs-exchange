export type MultibaseCode = 
  | 'base58btc'
  | 'base58flickr'
  | 'base64'
  | 'base64url'
  | 'base16'
  | 'base32'
  | 'base32hex'
  | 'base32z'
  | 'base64pad'
  | 'base64urlpad';

export type KeyCurve = 
  | 'Ed25519'
  | 'secp256k1'
  | 'secp256r1'
  | 'X25519';

export interface CryptoKeyPair {
  publicKey: Uint8Array;
  privateKey?: Uint8Array;
  curve: KeyCurve;
}

export interface SignatureResult {
  signature: Uint8Array;
  publicKey: Uint8Array;
}

export interface HashResult {
  hash: Uint8Array;
  algorithm: string;
}