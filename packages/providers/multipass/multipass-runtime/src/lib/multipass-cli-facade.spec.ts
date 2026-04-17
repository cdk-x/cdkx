import { MultipassCli } from '@cdk-x/multipass-sdk';
import { MultipassCliFactory } from './multipass-cli-facade';

describe('MultipassCliFactory', () => {
  describe('create()', () => {
    it('returns a MultipassCli instance', () => {
      const sdk = MultipassCliFactory.create();
      expect(sdk).toBeInstanceOf(MultipassCli);
    });

    it('forwards deps to MultipassCli', async () => {
      const spawn = jest
        .fn()
        .mockResolvedValue({ code: 0, stdout: '', stderr: '' });

      const sdk = MultipassCliFactory.create({ spawn });

      await sdk.assertInstalled();

      expect(spawn).toHaveBeenCalledWith('multipass', ['version']);
    });
  });
});
