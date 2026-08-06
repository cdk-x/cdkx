import type { JsiiLanguage, ReleasePhase } from '../library/schema';

export interface ProviderGeneratorSchema {
  name: string;
  providerName: string;
  apiVersion: string;
  description?: string;
  languages?: JsiiLanguage[];
  phase?: ReleasePhase;
}
