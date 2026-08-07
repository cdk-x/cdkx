import runExecutor from './executor';

describe('generate-l1 executor', () => {
  it('returns success', async () => {
    const output = await runExecutor(
      { apiVersion: 'github.cdk-x.com/v1', schemas: [] },
      {} as never,
    );

    expect(output.success).toBe(true);
  });
});
