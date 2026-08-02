import { ProcessRunner } from './process-runner';

describe('ProcessRunner', () => {
  it('reports success on a zero exit code', () => {
    const result = ProcessRunner.run('node', ['-e', 'process.exit(0)'], '.');
    expect(result).toEqual({ success: true });
  });

  it('reports a clear message on a non-zero exit code', () => {
    const result = ProcessRunner.run('node', ['-e', 'process.exit(2)'], '.');
    expect(result.success).toBe(false);
    expect(result.message).toContain('exited with code 2');
  });

  it('reports a clear message when the command cannot be found', () => {
    const result = ProcessRunner.run('this-command-does-not-exist', [], '.');
    expect(result.success).toBe(false);
    expect(result.message).toContain('this-command-does-not-exist');
  });
});
