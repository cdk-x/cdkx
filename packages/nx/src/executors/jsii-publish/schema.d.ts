import type { JsiiTargetLanguage } from '../../internal/jsii-languages';

export interface JsiiPublishExecutorSchema {
  target: JsiiTargetLanguage;
  dir?: string;
}
