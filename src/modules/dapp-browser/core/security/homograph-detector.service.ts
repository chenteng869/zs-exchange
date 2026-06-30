export class HomographDetectorService {
  private homographMap: Record<string, string[]> = {
    a: ['а', 'а', 'α', 'а'],
    b: ['Ь', 'Ь'],
    c: ['с', 'с'],
    d: ['ԁ', 'ԁ'],
    e: ['е', 'е'],
    f: ['ƒ'],
    g: ['ɡ'],
    h: ['һ'],
    i: ['і', 'і'],
    j: ['ј'],
    k: ['κ'],
    l: ['ｌ', 'ｌ'],
    m: ['ｍ', 'ｍ'],
    n: ['ｎ', 'ｎ'],
    o: ['ο', 'о', 'о'],
    p: ['р', 'р'],
    q: ['ｑ'],
    r: ['ｒ', 'ｒ'],
    s: ['ѕ', 'ѕ'],
    t: ['ｔ', 'ｔ'],
    u: ['ｕ', 'ｕ'],
    v: ['ν', 'ν'],
    w: ['ｗ', 'ｗ'],
    x: ['х', 'х'],
    y: ['у', 'у'],
    z: ['ｚ', 'ｚ'],
    A: ['А', 'Α'],
    B: ['В', 'Β'],
    C: ['С', 'С'],
    D: ['Д'],
    E: ['Е', 'Ε'],
    F: ['Ԛ'],
    G: ['Ԍ'],
    H: ['Н'],
    I: ['І', 'Ι'],
    J: ['Ј'],
    K: ['К', 'Κ'],
    L: ['Ｌ'],
    M: ['М', 'Μ'],
    N: ['Ν'],
    O: ['Ο', 'О'],
    P: ['Р', 'Ρ'],
    Q: ['Ｑ'],
    R: ['Ｒ'],
    S: ['Ѕ', 'Σ'],
    T: ['Т', 'Τ'],
    U: ['Ｕ'],
    V: ['Ｖ'],
    W: ['Ｗ'],
    X: ['Х', 'Χ'],
    Y: ['Υ', 'У'],
    Z: ['Ｚ'],
    0: ['О', 'ο', 'о'],
    1: ['І', 'і', 'ｌ', 'Ｌ'],
    2: ['Ζ'],
    3: ['Е'],
    4: ['А'],
    5: ['Ѕ'],
    6: ['б'],
    7: ['Т'],
    8: ['В'],
    9: ['ｇ'],
  };

  private suspiciousUnicodeRanges = [
    { start: 0x0400, end: 0x04ff },
    { start: 0x3040, end: 0x30ff },
    { start: 0xff00, end: 0xffef },
    { start: 0x0370, end: 0x03ff },
  ];

  async detect(hostname: string): Promise<{ suspicious: boolean; homographChars: { char: string; position: number; replacements: string[] }[] }> {
    const homographChars: { char: string; position: number; replacements: string[] }[] = [];

    for (let i = 0; i < hostname.length; i++) {
      const char = hostname[i];
      const charCode = char.charCodeAt(0);

      if (this.isInSuspiciousRange(charCode)) {
        const replacements = this.homographMap[char.toLowerCase()] || [];
        if (replacements.length > 0) {
          homographChars.push({ char, position: i, replacements });
        }
      }
    }

    return { suspicious: homographChars.length > 0, homographChars };
  }

  private isInSuspiciousRange(charCode: number): boolean {
    return this.suspiciousUnicodeRanges.some((range) => charCode >= range.start && charCode <= range.end);
  }

  async sanitize(hostname: string): Promise<string> {
    let sanitized = hostname;
    for (const [char, replacements] of Object.entries(this.homographMap)) {
      for (const replacement of replacements) {
        sanitized = sanitized.split(replacement).join(char);
      }
    }
    return sanitized;
  }

  async compareDomains(domain1: string, domain2: string): Promise<{ similar: boolean; distance: number; explanation?: string }> {
    const sanitized1 = await this.sanitize(domain1);
    const sanitized2 = await this.sanitize(domain2);

    if (sanitized1 === sanitized2) {
      return { similar: true, distance: 0, explanation: 'Domains are identical after sanitization' };
    }

    const distance = this.calculateLevenshteinDistance(sanitized1, sanitized2);
    return {
      similar: distance <= 2,
      distance,
      explanation: distance <= 2 ? 'Domains are very similar after sanitization' : undefined,
    };
  }

  private calculateLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  async hasHomographAttack(url: string): Promise<{ attack: boolean; details?: string }> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const detection = await this.detect(hostname);

      if (detection.suspicious) {
        const chars = detection.homographChars.map((h) => h.char).join(', ');
        return {
          attack: true,
          details: `Homograph attack detected with characters: ${chars}`,
        };
      }

      return { attack: false };
    } catch {
      return { attack: false };
    }
  }
}