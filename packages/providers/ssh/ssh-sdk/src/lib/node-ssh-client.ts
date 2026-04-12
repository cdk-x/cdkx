import { NodeSSH } from 'node-ssh';
import type {
  SshCommandResult,
  SshConnectOptions,
  SshConnection,
} from './ssh-connection';

class NodeSshConnection implements SshConnection {
  constructor(private readonly ssh: NodeSSH) {}

  async execute(command: string): Promise<SshCommandResult> {
    const result = await this.ssh.execCommand(command);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code ?? 0,
    };
  }

  async nohupExecute(command: string, jobId: string): Promise<void> {
    const statusFile = `/tmp/cdkx-job-${jobId}.status`;
    const wrapped =
      `nohup sh -c '${command} && echo done > ${statusFile} || echo failed > ${statusFile}' ` +
      `> /tmp/cdkx-job-${jobId}.log 2>&1 &`;
    await this.ssh.execCommand(wrapped);
  }

  async checkJobStatus(jobId: string): Promise<'running' | 'done' | 'failed'> {
    const result = await this.ssh.execCommand(
      `cat /tmp/cdkx-job-${jobId}.status`,
    );
    const content = result.stdout.trim();
    if (content === 'done') return 'done';
    if (content === 'failed') return 'failed';
    return 'running';
  }

  async disconnect(): Promise<void> {
    this.ssh.dispose();
  }
}

export class NodeSshClient {
  async connect(opts: SshConnectOptions): Promise<SshConnection> {
    const ssh = new NodeSSH();
    await ssh.connect({
      host: opts.host,
      port: opts.port ?? 22,
      username: opts.user,
      privateKeyPath: opts.privateKeyPath,
    });
    return new NodeSshConnection(ssh);
  }
}
