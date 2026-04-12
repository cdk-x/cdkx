import { NodeSshClient } from './node-ssh-client';

// ─── Mock node-ssh ────────────────────────────────────────────────────────────

const mockConnect = jest.fn();
const mockDispose = jest.fn();
const mockExecCommand = jest.fn();

jest.mock('node-ssh', () => ({
  NodeSSH: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    dispose: mockDispose,
    execCommand: mockExecCommand,
  })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NodeSshClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockExecCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });
  });

  describe('connect()', () => {
    it('returns an SshConnection when node-ssh connects successfully', async () => {
      const client = new NodeSshClient();
      const connection = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/home/user/.ssh/id_rsa',
      });

      expect(mockConnect).toHaveBeenCalledWith({
        host: '1.2.3.4',
        port: 22,
        username: 'ubuntu',
        privateKeyPath: '/home/user/.ssh/id_rsa',
      });
      expect(connection).toBeDefined();
    });

    it('uses the provided port instead of the default', async () => {
      const client = new NodeSshClient();
      await client.connect({
        host: '1.2.3.4',
        port: 2222,
        user: 'admin',
        privateKeyPath: '/keys/id_rsa',
      });

      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({ port: 2222 }),
      );
    });

    it('throws when the underlying SSH connection fails', async () => {
      mockConnect.mockRejectedValue(new Error('Connection refused'));
      const client = new NodeSshClient();

      await expect(
        client.connect({
          host: '1.2.3.4',
          user: 'ubuntu',
          privateKeyPath: '/keys/id_rsa',
        }),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('SshConnection.nohupExecute()', () => {
    it('runs the command via nohup and writes a status file on success', async () => {
      mockExecCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      await conn.nohupExecute('apt-get install -y nginx', 'job-abc');

      expect(mockExecCommand).toHaveBeenCalledWith(
        expect.stringContaining('nohup'),
      );
      expect(mockExecCommand).toHaveBeenCalledWith(
        expect.stringContaining('apt-get install -y nginx'),
      );
      expect(mockExecCommand).toHaveBeenCalledWith(
        expect.stringContaining('/tmp/cdkx-job-job-abc.status'),
      );
    });
  });

  describe('SshConnection.checkJobStatus()', () => {
    it('returns "running" when the status file does not exist yet', async () => {
      mockExecCommand.mockResolvedValue({
        stdout: '',
        stderr: 'No such file',
        code: 1,
      });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      const status = await conn.checkJobStatus('job-abc');

      expect(mockExecCommand).toHaveBeenCalledWith(
        'cat /tmp/cdkx-job-job-abc.status',
      );
      expect(status).toBe('running');
    });

    it('returns "done" when the status file contains "done"', async () => {
      mockExecCommand.mockResolvedValue({
        stdout: 'done',
        stderr: '',
        code: 0,
      });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      expect(await conn.checkJobStatus('job-abc')).toBe('done');
    });

    it('returns "failed" when the status file contains "failed"', async () => {
      mockExecCommand.mockResolvedValue({
        stdout: 'failed',
        stderr: '',
        code: 0,
      });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      expect(await conn.checkJobStatus('job-abc')).toBe('failed');
    });
  });

  describe('SshConnection.execute()', () => {
    it('returns stdout, stderr and exit code from the remote command', async () => {
      mockExecCommand.mockResolvedValue({
        stdout: 'hello',
        stderr: '',
        code: 0,
      });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      const result = await conn.execute('echo hello');

      expect(mockExecCommand).toHaveBeenCalledWith('echo hello');
      expect(result).toEqual({ stdout: 'hello', stderr: '', code: 0 });
    });

    it('returns non-zero exit code without throwing', async () => {
      mockExecCommand.mockResolvedValue({
        stdout: '',
        stderr: 'not found',
        code: 1,
      });
      const client = new NodeSshClient();
      const conn = await client.connect({
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      const result = await conn.execute('bad-command');

      expect(result.code).toBe(1);
      expect(result.stderr).toBe('not found');
    });
  });
});
