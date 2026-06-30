# A02\-《DID 身份 Part 2：DID 生成 did:key / did:pkh / did:web / did:ethr》

# 《DID 身份 Part 2：DID 生成 did:key / did:pkh / did:web / did:ethr》



本章正式实现 DID 生成与解析，覆盖：



- `did:key` 生成

- Ed25519 `did:key`

- secp256k1 `did:key`

- `publicKeyMultibase`

- Multicodec 编码

- `did:pkh` 生成

- CAIP\-10 Account ID

- `did:web` 生成与 DID Document URL 规则

- `did:ethr` 生成

- DID Document `verificationMethod` 构建

- DID Resolver 实现

- 真实 Crypto Adapter

- 五大业务域默认接入：

    - `exchange`

    - `cross_border_commerce`

    - `gaming`

    - `financial`

    - `samoa_enterprise`

        

---



# 0\. 依赖



```Bash
npm install multiformats @noble/curves @noble/hashes viem
```



说明：



```Plain Text
multiformats       用于 base58btc / multibase
@noble/curves      Ed25519 / secp256k1
@noble/hashes      sha256 / random bytes
viem               EVM 地址校验、签名、账户工具
```



---



# 1\. 本章目录



```Bash
src/modules/did/
  core/
    did/
      did.types.ts
      did-parser.service.ts
      did-document-builder.service.ts
      did-generator.service.ts
      did-resolver.service.ts

    methods/
      did-key.types.ts
      did-key-codec.service.ts
      did-key.service.ts
      did-pkh.service.ts
      did-web.service.ts
      did-ethr.service.ts
      did-method-registry.service.ts

    crypto/
      crypto.types.ts
      ed25519-key.service.ts
      secp256k1-key.service.ts
      multibase.service.ts

    domain/
      did-domain.types.ts

    utils/
      caip10.ts
      did-url.ts
      domain-url.ts
```



---



# 2\. Crypto 类型



## `core/crypto/crypto.types.ts`



```TypeScript
import { DIDKeyType } from '../did/did.types';

export interface GeneratedKeyPair {
  keyRef: string;
  keyType: DIDKeyType;

  publicKey: Uint8Array;
  privateKeyRef?: string;

  publicKeyMultibase?: string;
  publicKeyJwk?: JsonWebKey;

  createdAt: number;
}

export interface JsonWebKey {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  d?: string;
  kid?: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
}

export interface KeyPairGenerator {
  generate(input?: {
    controller?: string;
  }): Promise;

  publicKeyToJwk(publicKey: Uint8Array): JsonWebKey;

  publicKeyToMultibase(publicKey: Uint8Array): string;
}
```



---



# 3\. Multibase Service



## `core/crypto/multibase.service.ts`



```TypeScript
import { base58btc } from 'multiformats/bases/base58';

export class MultibaseService {
  encodeBase58btc(bytes: Uint8Array): string {
    return base58btc.encode(bytes);
  }

  decodeBase58btc(value: string): Uint8Array {
    return base58btc.decode(value);
  }

  concat(...items: Uint8Array[]): Uint8Array {
    const total = items.reduce((sum, item) => sum + item.length, 0);
    const output = new Uint8Array(total);

    let offset = 0;

    for (const item of items) {
      output.set(item, offset);
      offset += item.length;
    }

    return output;
  }
}
```



---



# 4\. did:key Multicodec



W3C / DID Key 常用 multicodec：



```Plain Text
Ed25519 public key       0xed 0x01
secp256k1 public key     0xe7 0x01
```



生成规则：



```Plain Text
did:key:z + base58btc(multicodecPrefix + publicKeyBytes)
```



## `core/methods/did-key.types.ts`



```TypeScript
import { DIDKeyType } from '../did/did.types';

export interface DIDKeyCodecInfo {
  keyType: DIDKeyType;
  multicodecName: string;
  prefix: Uint8Array;
  verificationMethodType: string;
}

export interface DIDKeyDecoded {
  keyType: DIDKeyType;
  publicKey: Uint8Array;
  publicKeyMultibase: string;
  verificationMethodType: string;
}
```



---



## `core/methods/did-key-codec.service.ts`



```TypeScript
import { DIDErrors } from '../did/did.errors';
import { MultibaseService } from '../crypto/multibase.service';
import {
  DIDKeyCodecInfo,
  DIDKeyDecoded,
} from './did-key.types';

const ED25519_PREFIX = new Uint8Array([0xed, 0x01]);
const SECP256K1_PREFIX = new Uint8Array([0xe7, 0x01]);

const DID_KEY_CODECS: DIDKeyCodecInfo[] = [
  {
    keyType: 'Ed25519',
    multicodecName: 'ed25519-pub',
    prefix: ED25519_PREFIX,
    verificationMethodType: 'Ed25519VerificationKey2020',
  },
  {
    keyType: 'secp256k1',
    multicodecName: 'secp256k1-pub',
    prefix: SECP256K1_PREFIX,
    verificationMethodType: 'EcdsaSecp256k1VerificationKey2019',
  },
];

export class DIDKeyCodecService {
  constructor(
    private readonly multibase = new MultibaseService(),
  ) {}

  encode(input: {
    keyType: 'Ed25519' | 'secp256k1';
    publicKey: Uint8Array;
  }): string {
    const codec = DID_KEY_CODECS.find((item) => item.keyType === input.keyType);

    if (!codec) {
      throw DIDErrors.UNSUPPORTED_METHOD(`did:key:${input.keyType}`);
    }

    const bytes = this.multibase.concat(codec.prefix, input.publicKey);

    return this.multibase.encodeBase58btc(bytes);
  }

  decode(publicKeyMultibase: string): DIDKeyDecoded {
    const bytes = this.multibase.decodeBase58btc(publicKeyMultibase);

    for (const codec of DID_KEY_CODECS) {
      if (startsWith(bytes, codec.prefix)) {
        return {
          keyType: codec.keyType,
          publicKey: bytes.slice(codec.prefix.length),
          publicKeyMultibase,
          verificationMethodType: codec.verificationMethodType,
        };
      }
    }

    throw DIDErrors.INVALID_DID(publicKeyMultibase);
  }

  didFromPublicKey(input: {
    keyType: 'Ed25519' | 'secp256k1';
    publicKey: Uint8Array;
  }): `did:key:${string}` {
    return `did:key:${this.encode(input)}`;
  }
}

function startsWith(value: Uint8Array, prefix: Uint8Array): boolean {
  if (value.length  {
    const privateKey = randomBytes(32);
    const publicKey = ed25519.getPublicKey(privateKey);

    return {
      keyRef: this.newKeyRef(),
      keyType: 'Ed25519',
      publicKey,
      privateKeyRef: undefined,
      publicKeyMultibase: this.publicKeyToMultibase(publicKey),
      publicKeyJwk: this.publicKeyToJwk(publicKey),
      createdAt: Date.now(),
    };
  }

  publicKeyToJwk(publicKey: Uint8Array): JsonWebKey {
    return {
      kty: 'OKP',
      crv: 'Ed25519',
      x: base64url(publicKey),
      alg: 'EdDSA',
      use: 'sig',
    };
  }

  publicKeyToMultibase(publicKey: Uint8Array): string {
    return this.didKeyCodec.encode({
      keyType: 'Ed25519',
      publicKey,
    });
  }

  sign(input: {
    privateKey: Uint8Array;
    data: Uint8Array;
  }): Uint8Array {
    return ed25519.sign(input.data, input.privateKey);
  }

  verify(input: {
    publicKey: Uint8Array;
    data: Uint8Array;
    signature: Uint8Array;
  }): boolean {
    return ed25519.verify(input.signature, input.data, input.publicKey);
  }

  private newKeyRef(): string {
    return `ED25519-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
```



---



# 6\. secp256k1 Key Service



## `core/crypto/secp256k1-key.service.ts`



```TypeScript
import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { DIDKeyCodecService } from '../methods/did-key-codec.service';
import {
  GeneratedKeyPair,
  JsonWebKey,
  KeyPairGenerator,
} from './crypto.types';

export class Secp256k1KeyService implements KeyPairGenerator {
  constructor(
    private readonly didKeyCodec = new DIDKeyCodecService(),
  ) {}

  async generate(): Promise {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return {
      keyRef: this.newKeyRef(),
      keyType: 'secp256k1',
      publicKey,
      privateKeyRef: undefined,
      publicKeyMultibase: this.publicKeyToMultibase(publicKey),
      publicKeyJwk: this.publicKeyToJwk(publicKey),
      createdAt: Date.now(),
    };
  }

  publicKeyToJwk(publicKey: Uint8Array): JsonWebKey {
    const uncompressed = secp256k1.ProjectivePoint
      .fromHex(Buffer.from(publicKey).toString('hex'))
      .toRawBytes(false);

    const x = uncompressed.slice(1, 33);
    const y = uncompressed.slice(33, 65);

    return {
      kty: 'EC',
      crv: 'secp256k1',
      x: base64url(x),
      y: base64url(y),
      alg: 'ES256K',
      use: 'sig',
    };
  }

  publicKeyToMultibase(publicKey: Uint8Array): string {
    return this.didKeyCodec.encode({
      keyType: 'secp256k1',
      publicKey,
    });
  }

  sign(input: {
    privateKey: Uint8Array;
    digest: Uint8Array;
  }): Uint8Array {
    return secp256k1.sign(input.digest, input.privateKey).toCompactRawBytes();
  }

  verify(input: {
    publicKey: Uint8Array;
    digest: Uint8Array;
    signature: Uint8Array;
  }): boolean {
    return secp256k1.verify(input.signature, input.digest, input.publicKey);
  }

  private newKeyRef(): string {
    return `SECP256K1-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
```



---



# 7\. CAIP\-10 工具



CAIP\-10 格式：



```Plain Text
namespace:reference:account_address
```



EVM 示例：



```Plain Text
eip155:1:0xabc...
eip155:56:0xabc...
```



## `core/utils/caip10.ts`



```TypeScript
import { getAddress, isAddress } from 'viem';

export interface CAIP10Parsed {
  namespace: string;
  reference: string;
  accountAddress: string;
  accountId: string;
}

export function buildCAIP10(input: {
  namespace: string;
  reference: string;
  accountAddress: string;
}): string {
  const namespace = input.namespace.trim().toLowerCase();
  const reference = input.reference.trim();

  let accountAddress = input.accountAddress.trim();

  if (namespace === 'eip155') {
    if (!isAddress(accountAddress)) {
      throw new Error(`INVALID_EVM_ADDRESS:${accountAddress}`);
    }

    accountAddress = getAddress(accountAddress);
  }

  return `${namespace}:${reference}:${accountAddress}`;
}

export function parseCAIP10(accountId: string): CAIP10Parsed {
  const parts = accountId.split(':');

  if (parts.length  {
    const keyType = input.keyType ?? 'Ed25519';

    if (keyType !== 'Ed25519' && keyType !== 'secp256k1') {
      throw DIDErrors.UNSUPPORTED_METHOD(`did:key:${keyType}`);
    }

    const key = keyType === 'Ed25519'
      ? await this.ed25519.generate()
      : await this.secp256k1.generate();

    const did = this.didKeyCodec.didFromPublicKey({
      keyType,
      publicKey: key.publicKey,
    }) as DIDString;

    const document = this.buildDocument({
      did,
      publicKeyMultibase: key.publicKeyMultibase!,
      keyType,
    });

    return {
      did,
      document,
      keyRef: key.keyRef,
      createdAt: Date.now(),
    };
  }

  async resolve(did: DIDString) {
    try {
      if (!did.startsWith('did:key:')) {
        return {
          didDocument: null,
          didResolutionMetadata: {
            error: 'invalidDid' as const,
            message: 'Not a did:key DID',
          },
          didDocumentMetadata: {},
        };
      }

      const publicKeyMultibase = did.replace('did:key:', '');
      const decoded = this.didKeyCodec.decode(publicKeyMultibase);

      return {
        didDocument: this.buildDocument({
          did,
          publicKeyMultibase,
          keyType: decoded.keyType as 'Ed25519' | 'secp256k1',
        }),
        didResolutionMetadata: {
          contentType: 'application/did+json',
        },
        didDocumentMetadata: {},
      };
    } catch (error: any) {
      return {
        didDocument: null,
        didResolutionMetadata: {
          error: 'invalidDid' as const,
          message: error?.message ?? String(error),
        },
        didDocumentMetadata: {},
      };
    }
  }

  private buildDocument(input: {
    did: DIDString;
    publicKeyMultibase: string;
    keyType: 'Ed25519' | 'secp256k1';
  }): DIDDocument {
    const verificationMethodType =
      input.keyType === 'Ed25519'
        ? 'Ed25519VerificationKey2020'
        : 'EcdsaSecp256k1VerificationKey2019';

    const verificationMethod: VerificationMethod = {
      id: keyId(input.did, 'key-1'),
      type: verificationMethodType,
      controller: input.did,
      publicKeyMultibase: input.publicKeyMultibase,
    };

    return this.documentBuilder.build({
      did: input.did,
      verificationMethods: [verificationMethod],
    });
  }
}
```



---



# 10\. did:pkh Service



`did:pkh` 适合表达钱包账户身份。



格式：



```Plain Text
did:pkh:
did:pkh:eip155:1:0xabc...
```



## `core/methods/did-pkh.service.ts`



```TypeScript
import {
  DIDCreateInput,
  DIDCreateResult,
  DIDDocument,
  DIDString,
  VerificationMethod,
} from '../did/did.types';
import { DIDMethodGenerator } from '../did/did-generator.service';
import { DIDMethodResolver } from '../did/did-resolver.service';
import { DIDDocumentBuilderService } from '../did/did-document-builder.service';
import { DIDErrors } from '../did/did.errors';
import {
  buildCAIP10,
  caip10ToDidPkh,
  evmChainIdToCAIPReference,
  parseCAIP10,
} from '../utils/caip10';
import { keyId } from '../utils/did-url';

export class DIDPkhService implements DIDMethodGenerator, DIDMethodResolver {
  readonly method = 'pkh';

  constructor(
    private readonly documentBuilder = new DIDDocumentBuilderService(),
  ) {}

  async create(input: DIDCreateInput): Promise {
    if (!input.accountAddress) {
      throw DIDErrors.INVALID_DID('did:pkh requires accountAddress');
    }

    const namespace = input.network ?? 'eip155';
    const reference =
      namespace === 'eip155'
        ? evmChainIdToCAIPReference(input.chainId ?? '1')
        : input.chainId ?? 'mainnet';

    const accountId = buildCAIP10({
      namespace,
      reference,
      accountAddress: input.accountAddress,
    });

    const did = caip10ToDidPkh(accountId) as DIDString;

    return {
      did,
      document: this.buildDocument(did, accountId),
      createdAt: Date.now(),
    };
  }

  async resolve(did: DIDString) {
    try {
      if (!did.startsWith('did:pkh:')) {
        return {
          didDocument: null,
          didResolutionMetadata: {
            error: 'invalidDid' as const,
            message: 'Not a did:pkh DID',
          },
          didDocumentMetadata: {},
        };
      }

      const accountId = did.replace('did:pkh:', '');
      parseCAIP10(accountId);

      return {
        didDocument: this.buildDocument(did, accountId),
        didResolutionMetadata: {
          contentType: 'application/did+json',
        },
        didDocumentMetadata: {},
      };
    } catch (error: any) {
      return {
        didDocument: null,
        didResolutionMetadata: {
          error: 'invalidDid' as const,
          message: error?.message ?? String(error),
        },
        didDocumentMetadata: {},
      };
    }
  }

  private buildDocument(did: DIDString, accountId: string): DIDDocument {
    const verificationMethod: VerificationMethod = {
      id: keyId(did, 'blockchainAccountId'),
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: accountId,
    };

    return this.documentBuilder.build({
      did,
      verificationMethods: [verificationMethod],
    });
  }
}
```



---



# 11\. did:web URL 工具



`did:web` 规则：



```Plain Text
did:web:example.com
  -> https://example.com/.well-known/did.json

did:web:example.com:user:alice
  -> https://example.com/user/alice/did.json
```



## `core/utils/domain-url.ts`



```TypeScript
export function didWebToUrl(did: string): string {
  if (!did.startsWith('did:web:')) {
    throw new Error(`NOT_DID_WEB:${did}`);
  }

  const id = did.replace('did:web:', '');
  const parts = id.split(':').map(decodeURIComponent);

  const domain = parts[0];

  if (!domain) {
    throw new Error(`INVALID_DID_WEB:${did}`);
  }

  if (parts.length === 1) {
    return `https://${domain}/.well-known/did.json`;
  }

  return `https://${domain}/${parts.slice(1).join('/')}/did.json`;
}

export function urlToDidWeb(input: {
  domain: string;
  path?: string[];
}): `did:web:${string}` {
  const domain = input.domain.toLowerCase();

  if (!/^[a-z0-9.-]+$/.test(domain)) {
    throw new Error(`INVALID_DID_WEB_DOMAIN:${domain}`);
  }

  const path = input.path?.length
    ? `:${input.path.map(encodeURIComponent).join(':')}`
    : '';

  return `did:web:${domain}${path}`;
}
```



---



# 12\. did:web Service



## `core/methods/did-web.service.ts`



```TypeScript
import {
  DIDCreateInput,
  DIDCreateResult,
  DIDDocument,
  DIDString,
  VerificationMethod,
} from '../did/did.types';
import { DIDMethodGenerator } from '../did/did-generator.service';
import { DIDMethodResolver } from '../did/did-resolver.service';
import { DIDDocumentBuilderService } from '../did/did-document-builder.service';
import { DIDErrors } from '../did/did.errors';
import {
  didWebToUrl,
  urlToDidWeb,
} from '../utils/domain-url';
import { keyId, serviceId } from '../utils/did-url';

export interface DIDWebDocumentStorage {
  get(url: string): Promise;
  put(url: string, document: DIDDocument): Promise;
}

export class InMemoryDIDWebDocumentStorage implements DIDWebDocumentStorage {
  private readonly documents = new Map();

  async get(url: string): Promise {
    return this.documents.get(url) ?? null;
  }

  async put(url: string, document: DIDDocument): Promise {
    this.documents.set(url, document);
  }
}

export class DIDWebService implements DIDMethodGenerator, DIDMethodResolver {
  readonly method = 'web';

  constructor(
    private readonly storage: DIDWebDocumentStorage = new InMemoryDIDWebDocumentStorage(),
    private readonly documentBuilder = new DIDDocumentBuilderService(),
  ) {}

  async create(input: DIDCreateInput & {
    domain?: string;
    path?: string[];
  }): Promise {
    const domain = input.metadata?.domain as string | undefined;

    if (!domain) {
      throw DIDErrors.INVALID_DID('did:web requires metadata.domain');
    }

    const path = input.metadata?.path as string[] | undefined;
    const did = urlToDidWeb({ domain, path }) as DIDString;

    const vm: VerificationMethod = {
      id: keyId(did, 'key-1'),
      type: 'JsonWebKey2020',
      controller: did,
      publicKeyJwk: input.metadata?.publicKeyJwk as any,
    };

    const document = this.documentBuilder.build({
      did,
      verificationMethods: [vm],
      services: [
        {
          id: serviceId(did, 'issuer-service'),
          type: 'CredentialIssuerService',
          serviceEndpoint: `https://${domain}/.well-known/vc/issuer`,
        },
      ],
    });

    await this.storage.put(didWebToUrl(did), document);

    return {
      did,
      document,
      createdAt: Date.now(),
    };
  }

  async resolve(did: DIDString) {
    try {
      const url = didWebToUrl(did);
      const document = await this.storage.get(url);

      if (!document) {
        return {
          didDocument: null,
          didResolutionMetadata: {
            error: 'notFound' as const,
            message: `DID web document not found: ${url}`,
          },
          didDocumentMetadata: {},
        };
      }

      return {
        didDocument: document,
        didResolutionMetadata: {
          contentType: 'application/did+json',
        },
        didDocumentMetadata: {
          updated: document.updated,
          created: document.created,
        },
      };
    } catch (error: any) {
      return {
        didDocument: null,
        didResolutionMetadata: {
          error: 'invalidDid' as const,
          message: error?.message ?? String(error),
        },
        didDocumentMetadata: {},
      };
    }
  }
}
```



---



# 13\. did:ethr Service



`did:ethr` 常见格式：



```Plain Text
did:ethr:0xabc...
did:ethr:mainnet:0xabc...
did:ethr:goerli:0xabc...
```



这里实现可落地基础版。链上 Registry 解析会在 Anchor Part 里补充。



## `core/methods/did-ethr.service.ts`



```TypeScript
import { getAddress, isAddress } from 'viem';
import {
  DIDCreateInput,
  DIDCreateResult,
  DIDDocument,
  DIDString,
  VerificationMethod,
} from '../did/did.types';
import { DIDMethodGenerator } from '../did/did-generator.service';
import { DIDMethodResolver } from '../did/did-resolver.service';
import { DIDDocumentBuilderService } from '../did/did-document-builder.service';
import { DIDErrors } from '../did/did.errors';
import { keyId } from '../utils/did-url';

export class DIDEthrService implements DIDMethodGenerator, DIDMethodResolver {
  readonly method = 'ethr';

  constructor(
    private readonly documentBuilder = new DIDDocumentBuilderService(),
  ) {}

  async create(input: DIDCreateInput): Promise {
    if (!input.accountAddress || !isAddress(input.accountAddress)) {
      throw DIDErrors.INVALID_DID('did:ethr requires valid EVM accountAddress');
    }

    const address = getAddress(input.accountAddress);
    const network = input.network ?? input.chainId ?? 'mainnet';

    const did = network === 'mainnet'
      ? `did:ethr:${address}` as DIDString
      : `did:ethr:${network}:${address}` as DIDString;

    return {
      did,
      document: this.buildDocument(did, address),
      createdAt: Date.now(),
    };
  }

  async resolve(did: DIDString) {
    try {
      if (!did.startsWith('did:ethr:')) {
        return {
          didDocument: null,
          didResolutionMetadata: {
            error: 'invalidDid' as const,
            message: 'Not a did:ethr DID',
          },
          didDocumentMetadata: {},
        };
      }

      const parsed = this.parseEthrDid(did);

      return {
        didDocument: this.buildDocument(did, parsed.address),
        didResolutionMetadata: {
          contentType: 'application/did+json',
        },
        didDocumentMetadata: {},
      };
    } catch (error: any) {
      return {
        didDocument: null,
        didResolutionMetadata: {
          error: 'invalidDid' as const,
          message: error?.message ?? String(error),
        },
        didDocumentMetadata: {},
      };
    }
  }

  private parseEthrDid(did: DIDString): {
    network: string;
    address: string;
  } {
    const parts = did.split(':');

    if (parts.length === 3) {
      const address = parts[2];

      if (!isAddress(address)) {
        throw DIDErrors.INVALID_DID(did);
      }

      return {
        network: 'mainnet',
        address: getAddress(address),
      };
    }

    if (parts.length === 4) {
      const network = parts[2];
      const address = parts[3];

      if (!isAddress(address)) {
        throw DIDErrors.INVALID_DID(did);
      }

      return {
        network,
        address: getAddress(address),
      };
    }

    throw DIDErrors.INVALID_DID(did);
  }

  private buildDocument(did: DIDString, address: string): DIDDocument {
    const verificationMethod: VerificationMethod = {
      id: keyId(did, 'owner'),
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `eip155:1:${address}`,
    };

    return this.documentBuilder.build({
      did,
      verificationMethods: [verificationMethod],
    });
  }
}
```



---



# 14\. DID Method Registry



统一注册 DID 方法。



## `core/methods/did-method-registry.service.ts`



```TypeScript
import { DIDGeneratorService } from '../did/did-generator.service';
import { DIDResolverService } from '../did/did-resolver.service';
import { DIDKeyService } from './did-key.service';
import { DIDPkhService } from './did-pkh.service';
import { DIDWebService } from './did-web.service';
import { DIDEthrService } from './did-ethr.service';

export interface DIDMethodRuntime {
  generator: DIDGeneratorService;
  resolver: DIDResolverService;

  didKey: DIDKeyService;
  didPkh: DIDPkhService;
  didWeb: DIDWebService;
  didEthr: DIDEthrService;
}

export function registerDefaultDIDMethods(input: {
  generator: DIDGeneratorService;
  resolver: DIDResolverService;
  didKey?: DIDKeyService;
  didPkh?: DIDPkhService;
  didWeb?: DIDWebService;
  didEthr?: DIDEthrService;
}): DIDMethodRuntime {
  const didKey = input.didKey ?? new DIDKeyService();
  const didPkh = input.didPkh ?? new DIDPkhService();
  const didWeb = input.didWeb ?? new DIDWebService();
  const didEthr = input.didEthr ?? new DIDEthrService();

  input.generator.register(didKey);
  input.generator.register(didPkh);
  input.generator.register(didWeb);
  input.generator.register(didEthr);

  input.resolver.register(didKey);
  input.resolver.register(didPkh);
  input.resolver.register(didWeb);
  input.resolver.register(didEthr);

  return {
    generator: input.generator,
    resolver: input.resolver,
    didKey,
    didPkh,
    didWeb,
    didEthr,
  };
}
```



---



# 15\. DID Identity Runtime



把 Part 1 和 Part 2 组装。



## `core/did/create-did-runtime.ts`



```TypeScript
import { DIDParserService } from './did-parser.service';
import { DIDGeneratorService } from './did-generator.service';
import { DIDResolverService } from './did-resolver.service';
import { DIDDocumentBuilderService } from './did-document-builder.service';
import { registerDefaultDIDMethods } from '../methods/did-method-registry.service';

export function createDIDRuntime() {
  const parser = new DIDParserService();
  const generator = new DIDGeneratorService();
  const resolver = new DIDResolverService(parser);
  const documentBuilder = new DIDDocumentBuilderService();

  const methods = registerDefaultDIDMethods({
    generator,
    resolver,
  });

  return {
    parser,
    generator,
    resolver,
    documentBuilder,
    ...methods,
  };
}

export type DIDRuntime = ReturnType;
```



---



# 16\. 五大业务域 DID 创建策略



不同业务域默认 DID 方法不同。



## `core/domain/domain-did-method-policy.service.ts`



```TypeScript
import { DIDBusinessDomain } from './did-domain.types';
import { DIDMethod } from '../did/did.types';

export class DomainDIDMethodPolicyService {
  getDefaultMethod(domain: DIDBusinessDomain): DIDMethod {
    switch (domain) {
      case 'exchange':
        return 'pkh';

      case 'cross_border_commerce':
        return 'key';

      case 'gaming':
        return 'key';

      case 'financial':
        return 'web';

      case 'samoa_enterprise':
        return 'key';

      default:
        return 'key';
    }
  }

  getIssuerPreferredMethod(domain: DIDBusinessDomain): DIDMethod {
    switch (domain) {
      case 'exchange':
        return 'web';

      case 'cross_border_commerce':
        return 'web';

      case 'gaming':
        return 'web';

      case 'financial':
        return 'web';

      case 'samoa_enterprise':
        return 'web';

      default:
        return 'web';
    }
  }

  getWalletBindingMethod(): DIDMethod {
    return 'pkh';
  }
}
```



说明：



```Plain Text
用户可用 did:key / did:pkh
机构签发者必须优先 did:web
钱包账户用 did:pkh
链上身份可选 did:ethr
萨摩亚官方 / 注册代理 / 金融公司 / 交易所 Issuer 必须 did:web
```



---



# 17\. Domain DID Creation Service



## `core/domain/domain-did-creation.service.ts`



```TypeScript
import {
  DIDBusinessDomain,
  DIDDomainContext,
} from './did-domain.types';
import { DIDCreateResult } from '../did/did.types';
import { DIDGeneratorService } from '../did/did-generator.service';
import { DomainDIDMethodPolicyService } from './domain-did-method-policy.service';

export class DomainDIDCreationService {
  constructor(
    private readonly generator: DIDGeneratorService,
    private readonly policy: DomainDIDMethodPolicyService,
  ) {}

  async createUserDID(input: {
    context: DIDDomainContext;
    accountAddress?: string;
    chainId?: string;
    preferredMethod?: 'key' | 'pkh' | 'web' | 'ethr';
  }): Promise {
    const method =
      input.preferredMethod ??
      this.policy.getDefaultMethod(input.context.domain);

    if (method === 'pkh') {
      if (!input.accountAddress) {
        throw new Error('DID_PKH_REQUIRES_ACCOUNT_ADDRESS');
      }

      return this.generator.create({
        method: 'pkh',
        network: 'eip155',
        chainId: input.chainId ?? '1',
        accountAddress: input.accountAddress,
        metadata: {
          domain: input.context.domain,
          environment: input.context.environment,
        },
      });
    }

    if (method === 'ethr') {
      if (!input.accountAddress) {
        throw new Error('DID_ETHR_REQUIRES_ACCOUNT_ADDRESS');
      }

      return this.generator.create({
        method: 'ethr',
        chainId: input.chainId ?? 'mainnet',
        accountAddress: input.accountAddress,
        metadata: {
          domain: input.context.domain,
          environment: input.context.environment,
        },
      });
    }

    return this.generator.create({
      method,
      keyType: method === 'key' ? 'Ed25519' : undefined,
      metadata: {
        domain: input.context.domain,
        environment: input.context.environment,
      },
    });
  }

  async createIssuerDID(input: {
    domain: DIDBusinessDomain;
    issuerDomain: string;
    publicKeyJwk?: unknown;
  }): Promise {
    return this.generator.create({
      method: this.policy.getIssuerPreferredMethod(input.domain),
      metadata: {
        domain: input.issuerDomain,
        publicKeyJwk: input.publicKeyJwk,
        businessDomain: input.domain,
      },
    });
  }
}
```



---



# 18\. 使用示例



## 18\.1 创建交易所钱包 DID



```TypeScript
const runtime = createDIDRuntime();

const domainDid = new DomainDIDCreationService(
  runtime.generator,
  new DomainDIDMethodPolicyService(),
);

const result = await domainDid.createUserDID({
  context: {
    domain: 'exchange',
    environment: 'production',
    countryCode: 'SG',
  },
  accountAddress: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '1',
});

console.log(result.did);
// did:pkh:eip155:1:0x1234...
```



---



## 18\.2 创建博彩用户 DID



```TypeScript
const result = await domainDid.createUserDID({
  context: {
    domain: 'gaming',
    environment: 'production',
    countryCode: 'GB',
  },
});

console.log(result.did);
// did:key:z...
```



---



## 18\.3 创建萨摩亚企业家 DID



```TypeScript
const result = await domainDid.createUserDID({
  context: {
    domain: 'samoa_enterprise',
    environment: 'production',
    jurisdiction: 'WS',
  },
});

console.log(result.did);
// did:key:z...
```



---



## 18\.4 创建萨摩亚官方 Issuer DID



```TypeScript
const issuer = await domainDid.createIssuerDID({
  domain: 'samoa_enterprise',
  issuerDomain: 'identity.samoa.example',
  publicKeyJwk: {
    kty: 'OKP',
    crv: 'Ed25519',
    x: '...',
  },
});

console.log(issuer.did);
// did:web:identity.samoa.example
```



---



# 19\. Resolver 使用示例



```TypeScript
const resolution = await runtime.resolver.resolve(result.did);

if (!resolution.didDocument) {
  throw new Error(resolution.didResolutionMetadata.message);
}

console.log(resolution.didDocument.verificationMethod);
```



---



# 20\. DID Document 示例



## did:key Ed25519



```JSON
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:key:z6M...",
  "verificationMethod": [
    {
      "id": "did:key:z6M...#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:key:z6M...",
      "publicKeyMultibase": "z6M..."
    }
  ],
  "authentication": [
    "did:key:z6M...#key-1"
  ],
  "assertionMethod": [
    "did:key:z6M...#key-1"
  ],
  "capabilityInvocation": [
    "did:key:z6M...#key-1"
  ]
}
```



---



## did:pkh



```JSON
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678",
  "verificationMethod": [
    {
      "id": "did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678#blockchainAccountId",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678",
      "blockchainAccountId": "eip155:1:0x1234567890abcdef1234567890abcdef12345678"
    }
  ]
}
```



---



# 21\. 链上锚定规则预留



本章 DID 生成后不自动上链。上链必须由 Anchor Service 处理。



规则：



```Plain Text
did:key:
  - 默认不需要上链
  - 可将 DID Document Hash 上链用于强审计

did:pkh:
  - 不需要上链
  - 钱包绑定通过 SIWE / CAIP-10 验证

did:web:
  - DID Document 托管在 HTTPS 域名
  - 可上链锚定 documentHash 防篡改

did:ethr:
  - 可接 ethr DID Registry
  - 可支持 controller/key rotation
```



---



# 22\. 五域 DID 方法推荐表



|业务域|用户 DID|钱包 DID|Issuer DID|链上锚定|
|---|---|---|---|---|
|交易所|`did:pkh` / `did:key`|`did:pkh`|`did:web`|KYC hash / Travel Rule hash|
|跨境电商|`did:key`|`did:pkh`|`did:web`|KYB / Tax / Reputation hash|
|博彩|`did:key`|`did:pkh`|`did:web`|Age / Geo / Self\-exclusion commitment|
|金融|`did:key` / `did:web`|`did:pkh`|`did:web`|Accreditation / Risk / Asset proof hash|
|萨摩亚企业家|`did:key`|`did:pkh`|`did:web`|Company formation / certificate hash|



---



# 23\. 安全要求



本章代码上线前必须满足：



```Plain Text
1. did:key 私钥必须进入 KeyManager / KMS，不可暴露给业务层
2. did:pkh 必须使用 CAIP-10
3. EVM 地址必须 checksum 校验
4. did:web 必须 HTTPS
5. did:web 域名必须归属于 Issuer
6. did:web DID Document 必须可被 resolver 拉取
7. did:ethr 地址必须合法
8. DID Document hash 必须稳定
9. 机构 Issuer 不允许使用临时 did:key 作为生产 Issuer
10. Samoa / 金融 / 交易所 Issuer 必须 did:web + Trust Registry
```



---



# 24\. 本章完成内容



本章完成：



```Plain Text
Multibase 编码
did:key Multicodec
Ed25519 key 生成
secp256k1 key 生成
did:key 生成与解析
did:pkh 生成与解析
CAIP-10 工具
did:web 生成与解析
did:web DID Document URL 规则
did:ethr 生成与解析
DID Method Registry
DID Runtime
五大业务域 DID 方法策略
Domain DID Creation Service
```



现在 DID 系统已经可以真实生成：



```Plain Text
did:key:z...
did:pkh:eip155:1:0x...
did:web:example.com
did:ethr:0x...
```



---



# 25\. 下一章继续



下一章：



# 《DID 身份 Part 3：钱包绑定 SIWE / CAIP\-10 / 多链账户绑定》



将覆盖：



```Plain Text
EIP-4361 SIWE
绑定挑战生成
nonce 防重放
domain 防重放
expiration 防重放
签名验证
CAIP-10 多链账户绑定
did:pkh 自动生成
WalletBindingRecord
绑定撤销
五大业务域钱包绑定规则
交易所提现钱包绑定
萨摩亚官方文件签署钱包绑定
金融账户强绑定
博彩提现绑定
跨境电商卖家收款钱包绑定
```



