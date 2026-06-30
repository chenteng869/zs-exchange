export interface DidUrl {
  did: string;
  path?: string;
  query?: Record<string, string>;
  fragment?: string;
}

export class DidUrlUtils {
  static parse(didUrl: string): DidUrl {
    const fragmentIndex = didUrl.indexOf('#');
    const queryIndex = didUrl.indexOf('?');
    const pathIndex = didUrl.indexOf('/');

    let did = didUrl;
    let path: string | undefined;
    let query: Record<string, string> | undefined;
    let fragment: string | undefined;

    if (fragmentIndex !== -1) {
      fragment = didUrl.slice(fragmentIndex + 1);
      didUrl = didUrl.slice(0, fragmentIndex);
    }

    if (queryIndex !== -1) {
      const queryString = didUrl.slice(queryIndex + 1);
      query = this.parseQuery(queryString);
      didUrl = didUrl.slice(0, queryIndex);
    }

    if (pathIndex !== -1) {
      path = didUrl.slice(pathIndex);
      did = didUrl.slice(0, pathIndex);
    } else {
      did = didUrl;
    }

    return { did, path, query, fragment };
  }

  static format(url: DidUrl): string {
    let result = url.did;
    
    if (url.path) {
      result += url.path;
    }
    
    if (url.query) {
      const queryString = this.formatQuery(url.query);
      result += `?${queryString}`;
    }
    
    if (url.fragment) {
      result += `#${url.fragment}`;
    }

    return result;
  }

  static getDid(url: string): string {
    return this.parse(url).did;
  }

  static getFragment(url: string): string | undefined {
    return this.parse(url).fragment;
  }

  static getQuery(url: string): Record<string, string> | undefined {
    return this.parse(url).query;
  }

  static getPath(url: string): string | undefined {
    return this.parse(url).path;
  }

  static hasFragment(url: string): boolean {
    return url.includes('#');
  }

  static hasQuery(url: string): boolean {
    return url.includes('?');
  }

  static hasPath(url: string): boolean {
    return url.includes('/');
  }

  static addFragment(did: string, fragment: string): string {
    return `${did}#${fragment}`;
  }

  static addQuery(did: string, query: Record<string, string>): string {
    const queryString = this.formatQuery(query);
    return `${did}?${queryString}`;
  }

  static addPath(did: string, path: string): string {
    return `${did}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  static removeFragment(url: string): string {
    const index = url.indexOf('#');
    return index !== -1 ? url.slice(0, index) : url;
  }

  static removeQuery(url: string): string {
    const index = url.indexOf('?');
    return index !== -1 ? url.slice(0, index) : url;
  }

  static removePath(url: string): string {
    const index = url.indexOf('/');
    return index !== -1 ? url.slice(0, index) : url;
  }

  static isValid(url: string): boolean {
    const didRegex = /^did:[a-zA-Z0-9]+:[a-zA-Z0-9._-]+/;
    return didRegex.test(url);
  }

  private static parseQuery(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[key] = value || '';
      }
    }

    return params;
  }

  private static formatQuery(query: Record<string, string>): string {
    return Object.entries(query)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}