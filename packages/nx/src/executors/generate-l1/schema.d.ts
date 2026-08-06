export type GenerateL1DeployMode = 'synth-only' | 'deploy';

export interface GenerateL1SchemaEntry {
  file: string;
  resourceType: string;
  mode: GenerateL1DeployMode;
}

export interface GenerateL1ExecutorSchema {
  apiVersion: string;
  outputDir?: string;
  schemas: GenerateL1SchemaEntry[];
}
