declare module "hypher" {
  interface HypherLanguage {
    id?: string;
    leftmin?: number;
    rightmin?: number;
    patterns?: Record<string, string>;
    exceptions?: Record<string, string>;
  }
  class Hypher {
    constructor(language: HypherLanguage);
    hyphenate(word: string): string[];
    hyphenateText(text: string, syl?: string): string;
  }
  export = Hypher;
}
declare module "hyphenation.en-us" {
  const lang: import("hypher").HypherLanguage;
  export = lang;
}
declare module "hyphenation.ru" {
  const lang: import("hypher").HypherLanguage;
  export = lang;
}
declare module "hyphenation.de" {
  const lang: import("hypher").HypherLanguage;
  export = lang;
}
declare module "hyphenation.uk" {
  const lang: import("hypher").HypherLanguage;
  export = lang;
}
