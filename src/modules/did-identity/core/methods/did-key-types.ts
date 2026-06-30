export type DidKeyCodecType = 
  | 'Ed25519VerificationKey2020'
  | 'EcdsaSecp256k1VerificationKey2019'
  | 'JsonWebKey2020';

export interface DidKeyEncoded {
  multibase: string;
  type: DidKeyCodecType;
  raw: Uint8Array;
}

export interface DidKeyDecoded {
  type: DidKeyCodecType;
  publicKey: Uint8Array;
  privateKey?: Uint8Array;
}