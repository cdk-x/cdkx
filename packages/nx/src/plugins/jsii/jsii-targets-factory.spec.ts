import { JsiiTargetsFactory } from './jsii-targets-factory';

describe('JsiiTargetsFactory', () => {
  it('always includes jsii-compile, jsii-docs, jsii-package-all and the npm package/publish targets', () => {
    const targets = JsiiTargetsFactory.build([]);

    expect(targets['jsii-compile']).toEqual({
      executor: '@cdk-x/nx:jsii-compile',
      dependsOn: ['^jsii-compile'],
      outputs: ['{projectRoot}/dist', '{projectRoot}/.jsii'],
      cache: true,
    });
    expect(targets['jsii-docs']).toEqual({
      executor: '@cdk-x/nx:jsii-docs',
      dependsOn: ['jsii-compile'],
      outputs: ['{projectRoot}/dist-jsii/docs'],
    });
    expect(targets['jsii-package-npm']).toEqual({
      executor: '@cdk-x/nx:jsii-package',
      options: { target: 'npm' },
      dependsOn: ['jsii-compile'],
      outputs: ['{projectRoot}/dist-jsii/js'],
    });
    expect(targets['jsii-publish-npm']).toEqual({
      executor: '@cdk-x/nx:jsii-publish',
      options: { target: 'npm' },
      dependsOn: ['jsii-package-npm'],
    });
    expect(targets['jsii-package-all']).toEqual({
      executor: 'nx:noop',
      dependsOn: ['jsii-docs', 'jsii-package-npm'],
    });
    expect(targets['nx-release-publish']).toEqual({
      dependsOn: ['^nx-release-publish', 'jsii-compile'],
    });
    expect(targets['build']).toEqual({
      dependsOn: ['^build', 'jsii-package-all'],
    });
    expect(Object.keys(targets).sort()).toEqual(
      [
        'build',
        'jsii-compile',
        'jsii-docs',
        'jsii-package-all',
        'jsii-package-npm',
        'jsii-publish-npm',
        'nx-release-publish',
      ].sort(),
    );
  });

  it('adds package/publish targets only for the requested additional languages', () => {
    const targets = JsiiTargetsFactory.build(['python']);

    expect(Object.keys(targets)).toEqual(
      expect.arrayContaining(['jsii-package-python', 'jsii-publish-python']),
    );
    expect(targets['jsii-package-python']).toEqual({
      executor: '@cdk-x/nx:jsii-package',
      options: { target: 'python' },
      dependsOn: ['jsii-compile'],
      outputs: ['{projectRoot}/dist-jsii/python'],
    });
    expect(targets['jsii-package-java']).toBeUndefined();
    expect(targets['jsii-package-all'].dependsOn).toEqual([
      'jsii-docs',
      'jsii-package-npm',
      'jsii-package-python',
    ]);
  });

  it('adds the cross-project ^jsii-package-* dependency only for java/dotnet/go, not npm/python', () => {
    const targets = JsiiTargetsFactory.build([
      'python',
      'java',
      'dotnet',
      'go',
    ]);

    expect(targets['jsii-package-npm'].dependsOn).toEqual(['jsii-compile']);
    expect(targets['jsii-package-python'].dependsOn).toEqual(['jsii-compile']);
    expect(targets['jsii-package-java'].dependsOn).toEqual([
      'jsii-compile',
      '^jsii-package-java',
    ]);
    expect(targets['jsii-package-dotnet'].dependsOn).toEqual([
      'jsii-compile',
      '^jsii-package-dotnet',
    ]);
    expect(targets['jsii-package-go'].dependsOn).toEqual([
      'jsii-compile',
      '^jsii-package-go',
    ]);
  });
});
