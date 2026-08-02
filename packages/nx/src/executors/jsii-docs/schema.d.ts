export type JsiiDocsLanguage =
  'typescript' | 'python' | 'java' | 'csharp' | 'go';

export interface JsiiDocsExecutorSchema {
  languages?: JsiiDocsLanguage[];
  output?: string;
}
