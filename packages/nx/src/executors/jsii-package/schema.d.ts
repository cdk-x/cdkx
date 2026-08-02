import type { JsiiTargetLanguage } from '../../internal/jsii-languages';

export interface JsiiPackageExecutorSchema {
  target: JsiiTargetLanguage;
  outdir?: string;
}
