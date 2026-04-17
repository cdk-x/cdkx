import { IResolvable } from '@cdk-x/core';
import { TestApp, TestStack } from '@cdk-x/testing';
import {
  MltInstance,
  MltMount,
  MltNetwork,
  MltProvider,
} from '../../index';

describe('MltInstance', () => {
  describe('props and attributes', () => {
    it('accepts required name prop', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', { name: 'dev' });
      expect(vm.name).toBe('dev');
    });

    it('accepts all optional props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', {
        name: 'dev',
        image: '22.04',
        cpus: 4,
        memory: '4G',
        disk: '40G',
        bridged: true,
        timeout: 300,
        cloudInit: '#cloud-config\npackages:\n  - git\n',
      });

      expect(vm.image).toBe('22.04');
      expect(vm.cpus).toBe(4);
      expect(vm.memory).toBe('4G');
      expect(vm.disk).toBe('40G');
      expect(vm.bridged).toBe(true);
      expect(vm.timeout).toBe(300);
      expect(vm.cloudInit).toBe('#cloud-config\npackages:\n  - git\n');
    });

    it('exposes attrIpAddress as IResolvable', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', { name: 'dev' });
      expect(vm.attrIpAddress).toBeDefined();
      expect(typeof (vm.attrIpAddress as IResolvable).resolve).toBe('function');
    });

    it('exposes attrSshUser as IResolvable', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', { name: 'dev' });
      expect(vm.attrSshUser).toBeDefined();
      expect(typeof (vm.attrSshUser as IResolvable).resolve).toBe('function');
    });

    it('has the correct RESOURCE_TYPE_NAME', () => {
      expect(MltInstance.RESOURCE_TYPE_NAME).toBe(
        'Multipass::Compute::Instance',
      );
    });
  });

  describe('MltProvider', () => {
    it('identifier is "multipass"', () => {
      const provider = new MltProvider();
      expect(provider.identifier).toBe('multipass');
    });
  });

  describe('MltNetwork', () => {
    it('is importable with correct props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const net = new MltNetwork(stack, 'Net', {
        name: 'bridge',
        mode: 'auto',
      });
      expect(net.name).toBe('bridge');
      expect(net.mode).toBe('auto');
      expect(MltNetwork.RESOURCE_TYPE_NAME).toBe('Multipass::VM::Network');
    });
  });

  describe('MltMount', () => {
    it('is importable with correct props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const mount = new MltMount(stack, 'Mnt', {
        source: '/Users/antonio/code',
        target: '/home/ubuntu/code',
      });
      expect(mount.source).toBe('/Users/antonio/code');
      expect(mount.target).toBe('/home/ubuntu/code');
      expect(MltMount.RESOURCE_TYPE_NAME).toBe('Multipass::VM::Mount');
    });
  });

  describe('synthesis', () => {
    it('synthesises without errors and includes cloudInit in rendered props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      new MltInstance(stack, 'Vm', {
        name: 'dev',
        image: 'jammy',
        cpus: 2,
        memory: '2G',
        cloudInit: '#cloud-config\n',
      });
      expect(() => app.synth()).not.toThrow();
    });

    it('networks and mounts are attached and synthesise without errors', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const net = new MltNetwork(stack, 'Net', { name: 'bridge', mode: 'auto' });
      const mount = new MltMount(stack, 'Mnt', { source: '/code' });
      new MltInstance(stack, 'Vm', {
        name: 'dev',
        networks: [net.ref],
        mounts: [mount.ref],
      });
      expect(() => app.synth()).not.toThrow();
    });
  });
});
