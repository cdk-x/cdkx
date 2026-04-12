export interface SshConnectOptions {
  readonly host: string;
  readonly port?: number;
  readonly user: string;
  readonly privateKeyPath: string;
}

export interface SshCommandResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
}

export interface SshConnection {
  execute(command: string): Promise<SshCommandResult>;
  nohupExecute(command: string, jobId: string): Promise<void>;
  checkJobStatus(jobId: string): Promise<'running' | 'done' | 'failed'>;
  disconnect(): Promise<void>;
}
