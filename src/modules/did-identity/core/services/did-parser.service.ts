import { Did, DidMethod, DidParserResult } from '@/modules/did-identity/shared/types';
import { InvalidDidError } from '@/modules/did-identity/shared/errors';

const DID_REGEX = /^did:([a-zA-Z0-9]+):(.+)$/;

export class DidParserService {
  parse(did: Did): DidParserResult {
    const match = did.match(DID_REGEX);
    
    if (!match) {
      throw new InvalidDidError(did);
    }

    const method = match[1] as DidMethod;
    const id = match[2];

    const pathStart = id.indexOf('/');
    const queryStart = id.indexOf('?');
    const fragmentStart = id.indexOf('#');

    const pathEnd = Math.min(
      pathStart >= 0 ? pathStart : id.length,
      queryStart >= 0 ? queryStart : id.length,
      fragmentStart >= 0 ? fragmentStart : id.length
    );

    const path = pathStart >= 0 && pathStart < queryStart && pathStart < fragmentStart 
      ? id.substring(pathStart) 
      : '';
    const query = queryStart >= 0 ? id.substring(queryStart) : '';
    const fragment = fragmentStart >= 0 ? id.substring(fragmentStart) : '';
    const cleanId = id.substring(0, pathEnd);

    const queryParams: Record<string, string> = {};
    if (query) {
      const params = query.slice(1).split('&');
      for (const param of params) {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[key] = value;
        }
      }
    }

    return {
      did,
      method,
      id: cleanId,
      methodSpecificId: cleanId,
      path,
      query: queryParams,
      fragment: fragment.slice(1),
      hasPath: !!path,
      hasQuery: !!query,
      hasFragment: !!fragment,
    };
  }

  validate(did: string): boolean {
    return this.isValid(did);
  }

  isValid(did: string): boolean {
    return DID_REGEX.test(did);
  }

  extractMethod(did: Did): DidMethod {
    const parsed = this.parse(did);
    return parsed.method;
  }

  extractId(did: Did): string {
    const parsed = this.parse(did);
    return parsed.id;
  }

  extractFragment(did: Did): string {
    const parsed = this.parse(did);
    return parsed.fragment;
  }

  isSameDid(did1: Did, did2: Did): boolean {
    const parsed1 = this.parse(did1);
    const parsed2 = this.parse(did2);
    return parsed1.method === parsed2.method && parsed1.id === parsed2.id;
  }

  createDid(method: DidMethod, id: string): Did {
    return `did:${method}:${id}` as Did;
  }

  createDidWithFragment(did: Did, fragment: string): Did {
    return `${did}#${fragment}` as Did;
  }

  removeFragment(did: Did): Did {
    const parsed = this.parse(did);
    return `did:${parsed.method}:${parsed.id}${parsed.path}` as Did;
  }
}
