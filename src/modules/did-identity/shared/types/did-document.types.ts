export type VerificationMethodType =
  | 'Ed25519VerificationKey2020'
  | 'Ed25519VerificationKey2018'
  | 'EcdsaSecp256k1VerificationKey2019'
  | 'EcdsaSecp256k1RecoveryMethod2020'
  | 'RsaVerificationKey2018'
  | 'JsonWebKey2020'
  | 'Multikey';

export type VerificationRelationship =
  | 'authentication'
  | 'assertionMethod'
  | 'keyAgreement'
  | 'capabilityInvocation'
  | 'capabilityDelegation';

export interface DidDocumentBuilderOptions {
  did: string;
  verificationMethods?: VerificationMethodInput[];
  services?: ServiceInput[];
  alsoKnownAs?: string[];
  created?: string;
  updated?: string;
}

export interface VerificationMethodInput {
  id: string;
  type: VerificationMethodType;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyHex?: string;
  publicKeyJwk?: JsonWebKey;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
  relationships?: VerificationRelationship[];
}

export interface ServiceInput {
  id: string;
  type: string;
  serviceEndpoint: string | ServiceEndpointInput[];
  description?: string;
  [key: string]: unknown;
}

export interface ServiceEndpointInput {
  uri?: string;
  description?: string;
  type?: string;
}

export interface JsonWebKey {
  kty: string;
  alg?: string;
  use?: string;
  kid?: string;
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  crv?: string;
  x?: string;
  y?: string;
  [key: string]: unknown;
}

export interface DidDocumentValidatorResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DidDocumentDiff {
  addedVerificationMethods: string[];
  removedVerificationMethods: string[];
  updatedVerificationMethods: string[];
  addedServices: string[];
  removedServices: string[];
  updatedServices: string[];
  alsoKnownAsChanges: { added: string[]; removed: string[] };
}

export interface DidDocumentSigningOptions {
  verificationMethodId: string;
  privateKey: string;
  proofType?: string;
  created?: string;
  domain?: string;
  challenge?: string;
}

export interface DidDocumentSignature {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  signatureValue: string;
  domain?: string;
  challenge?: string;
}