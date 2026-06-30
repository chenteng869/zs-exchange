export type SigningAlgorithm = 'ES256K' | 'EdDSA' | 'ES256' | 'RS256';

export type ProofType = 'JsonWebSignature2020' | 'Ed25519Signature2020' | 'EcdsaSecp256k1Signature2019';

export interface VcSigningInput {
  credential: unknown;
  privateKey: string;
  algorithm: SigningAlgorithm;
  proofType: ProofType;
  verificationMethod: string;
  issuerDid: string;
}

export interface VcSigningResult {
  success: boolean;
  proof?: VcProof;
  signedCredential?: unknown;
  signature?: string;
  error?: string;
}

export interface VcProof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  signature?: string;
  jws?: string;
  [key: string]: unknown;
}

export interface VcSigner {
  sign(input: VcSigningInput): Promise<VcSigningResult>;
  verify(credential: unknown, proof: VcProof): Promise<boolean>;
  getAlgorithm(): SigningAlgorithm;
}

export interface VcJwtPayload {
  iss: string;
  sub: string;
  iat: number;
  exp?: number;
  jti: string;
  vc: unknown;
}

export interface VcEip712Types {
  EIP712Domain: { name: string; type: string }[];
  Credential: { name: string; type: string }[];
  [key: string]: { name: string; type: string }[];
}