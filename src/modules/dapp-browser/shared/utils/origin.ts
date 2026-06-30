export const getOrigin = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return null;
  }
};

export const getHostname = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

export const isValidOrigin = (origin: string): boolean => {
  try {
    const urlObj = new URL(origin);
    return urlObj.protocol === 'https:' && !urlObj.pathname && !urlObj.search && !urlObj.hash;
  } catch {
    return false;
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
};

export const isSameOrigin = (a: string, b: string): boolean => {
  return getOrigin(a) === getOrigin(b);
};

export const isLocalhost = (url: string): boolean => {
  const hostname = getHostname(url);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
};

export const isIPAddress = (hostname: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
};

export const extractPathname = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return '';
  }
};

export const extractSearch = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.search;
  } catch {
    return '';
  }
};

export const extractHash = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hash;
  } catch {
    return '';
  }
};

export const getPort = (url: string): number | undefined => {
  try {
    const urlObj = new URL(url);
    return urlObj.port ? parseInt(urlObj.port, 10) : undefined;
  } catch {
    return undefined;
  }
};