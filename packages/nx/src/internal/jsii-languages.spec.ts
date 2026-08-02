import { JsiiLanguages } from './jsii-languages';

describe('JsiiLanguages', () => {
  it('maps npm to the js pacmak target and publib-npm binary', () => {
    expect(JsiiLanguages.pacmakTarget('npm')).toBe('js');
    expect(JsiiLanguages.publibBinary('npm')).toBe('publib-npm');
    expect(JsiiLanguages.packageSubdir('npm')).toBe('js');
  });

  it.each([
    ['python', 'python', 'publib-pypi'],
    ['java', 'java', 'publib-maven'],
    ['dotnet', 'dotnet', 'publib-nuget'],
    ['go', 'go', 'publib-golang'],
  ] as const)(
    'maps %s to pacmak target %s and binary %s',
    (language, pacmakTarget, publibBinary) => {
      expect(JsiiLanguages.pacmakTarget(language)).toBe(pacmakTarget);
      expect(JsiiLanguages.publibBinary(language)).toBe(publibBinary);
      expect(JsiiLanguages.packageSubdir(language)).toBe(language);
    },
  );
});
