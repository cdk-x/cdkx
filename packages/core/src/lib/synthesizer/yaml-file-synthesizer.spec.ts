import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as yaml from 'js-yaml';
import { YamlFileSynthesizer, ISynthesisSession } from './synthesizer';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly';
import { ProviderResource } from '../provider-resource/provider-resource';
import { makeApp, makeStack } from '../../../test/helpers';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-yaml-synth-test-'));
}

function makeSession(outdir: string): ISynthesisSession {
  return { outdir, assembly: new CloudAssemblyBuilder(outdir) };
}

describe('YamlFileSynthesizer', () => {
  describe('single root resource → one YAML file', () => {
    it('writes a .yaml file named after the resource name property', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', cpus: 2 },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });

    it('YAML content contains the resource properties', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', cpus: 2, memory: '2G' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['name']).toBe('dev');
      expect(content['cpus']).toBe(2);
      expect(content['memory']).toBe('2G');
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });

    it('falls back to logicalId.yaml when no name property', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      const resource = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { cpus: 1 },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      expect(
        fs.existsSync(path.join(outputDir, `${resource.logicalId}.yaml`)),
      ).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });

    it('registers a cdkx:local-files artifact in the assembly', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      const session = makeSession(outdir);
      synth.synthesize(session);

      const assembly = session.assembly.buildAssembly();
      const artifact = assembly.getStack('TestStack');
      expect(artifact?.type).toBe('cdkx:local-files');
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });
  });

  describe('root + child → composed YAML', () => {
    it('nests child under pluralised type-name key in parent YAML', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      // Network references the VM via a { ref, attr } token — the composition signal
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: {
          vmId: vm.getAtt('vmId'),
          name: 'eth0',
          mode: 'auto',
        },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['networks']).toBeDefined();
      expect(Array.isArray(content['networks'])).toBe(true);
      const networks = content['networks'] as Record<string, unknown>[];
      expect(networks).toHaveLength(1);
      expect(networks[0]['name']).toBe('eth0');
      expect(networks[0]['mode']).toBe('auto');
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });

    it('does not produce a separate file for the child resource', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { vmId: vm.getAtt('vmId'), name: 'eth0' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      const files = fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith('.yaml'));
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('dev.yaml');
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });
  });

  describe('outputFileName overrides derived filename', () => {
    it('uses outputFileName when set as a plain string property', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', outputFileName: 'my-vm.yaml' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      expect(fs.existsSync(path.join(outputDir, 'my-vm.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(false);
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });

    it('excludes outputFileName field from YAML content', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', outputFileName: 'my-vm.yaml' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'my-vm.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['outputFileName']).toBeUndefined();
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });
  });

  describe('filename collision → throws', () => {
    it('throws when two root resources would produce the same filename', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'VmA', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'VmB', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' }, // same name → same filename
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      expect(() => synth.synthesize(makeSession(outdir))).toThrow(
        /filename collision/,
      );
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });
  });

  describe('{ ref, attr } token fields excluded from YAML output', () => {
    it('excludes token fields from child YAML content', () => {
      const outputDir = tmpDir();
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { vmId: vm.getAtt('vmId'), name: 'eth0' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize(makeSession(outdir));

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      const networks = content['networks'] as Record<string, unknown>[];
      // vmId was a token field — must NOT appear in the composed output
      expect(networks[0]['vmId']).toBeUndefined();
      expect(networks[0]['name']).toBe('eth0');
      fs.rmSync(outputDir, { recursive: true });
      fs.rmSync(outdir, { recursive: true });
    });
  });
});
