import { PropertyNaming } from './property-naming.js';

describe('PropertyNaming.tsPropertyName', () => {
  it('camelCases a kebab-case key', () => {
    expect(PropertyNaming.tsPropertyName('runs-on')).toBe('runsOn');
  });

  it('leaves an already-camelCase key unchanged', () => {
    expect(PropertyNaming.tsPropertyName('name')).toBe('name');
  });

  it('strips a leading $', () => {
    expect(PropertyNaming.tsPropertyName('$schema')).toBe('schema');
  });

  it('replaces a slash with an underscore before camelCasing', () => {
    expect(PropertyNaming.tsPropertyName('kubernetes/io')).toBe('kubernetesIo');
  });

  it('appends an underscore to a jsii-reserved member name', () => {
    expect(PropertyNaming.tsPropertyName('build')).toBe('build_');
    expect(PropertyNaming.tsPropertyName('equals')).toBe('equals_');
    expect(PropertyNaming.tsPropertyName('hashCode')).toBe('hashCode_');
  });
});
