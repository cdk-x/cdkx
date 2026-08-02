export type JsiiLanguage = 'python' | 'java' | 'dotnet' | 'go';
export type ReleasePhase = 'alpha' | 'beta' | 'rc' | 'stable';

export interface LibraryGeneratorSchema {
  name: string;
  description?: string;
  languages?: JsiiLanguage[];
  phase?: ReleasePhase;
}
