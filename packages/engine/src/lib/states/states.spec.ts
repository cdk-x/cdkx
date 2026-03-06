import { StackStatus } from './stack-status';
import { ResourceStatus } from './resource-status';

describe('StackStatus', () => {
  it('has 16 values', () => {
    expect(Object.keys(StackStatus)).toHaveLength(16);
  });

  describe('creation states', () => {
    it('defines CREATE_IN_PROGRESS', () => {
      expect(StackStatus.CREATE_IN_PROGRESS).toBe('CREATE_IN_PROGRESS');
    });

    it('defines CREATE_COMPLETE', () => {
      expect(StackStatus.CREATE_COMPLETE).toBe('CREATE_COMPLETE');
    });

    it('defines CREATE_FAILED', () => {
      expect(StackStatus.CREATE_FAILED).toBe('CREATE_FAILED');
    });
  });

  describe('update states', () => {
    it('defines UPDATE_IN_PROGRESS', () => {
      expect(StackStatus.UPDATE_IN_PROGRESS).toBe('UPDATE_IN_PROGRESS');
    });

    it('defines UPDATE_COMPLETE', () => {
      expect(StackStatus.UPDATE_COMPLETE).toBe('UPDATE_COMPLETE');
    });

    it('defines UPDATE_FAILED', () => {
      expect(StackStatus.UPDATE_FAILED).toBe('UPDATE_FAILED');
    });

    it('defines UPDATE_ROLLBACK_IN_PROGRESS', () => {
      expect(StackStatus.UPDATE_ROLLBACK_IN_PROGRESS).toBe(
        'UPDATE_ROLLBACK_IN_PROGRESS',
      );
    });

    it('defines UPDATE_ROLLBACK_COMPLETE', () => {
      expect(StackStatus.UPDATE_ROLLBACK_COMPLETE).toBe(
        'UPDATE_ROLLBACK_COMPLETE',
      );
    });

    it('defines UPDATE_ROLLBACK_FAILED', () => {
      expect(StackStatus.UPDATE_ROLLBACK_FAILED).toBe('UPDATE_ROLLBACK_FAILED');
    });
  });

  describe('deletion states', () => {
    it('defines DELETE_IN_PROGRESS', () => {
      expect(StackStatus.DELETE_IN_PROGRESS).toBe('DELETE_IN_PROGRESS');
    });

    it('defines DELETE_COMPLETE', () => {
      expect(StackStatus.DELETE_COMPLETE).toBe('DELETE_COMPLETE');
    });

    it('defines DELETE_FAILED', () => {
      expect(StackStatus.DELETE_FAILED).toBe('DELETE_FAILED');
    });
  });

  describe('creation rollback states', () => {
    it('defines ROLLBACK_IN_PROGRESS', () => {
      expect(StackStatus.ROLLBACK_IN_PROGRESS).toBe('ROLLBACK_IN_PROGRESS');
    });

    it('defines ROLLBACK_COMPLETE', () => {
      expect(StackStatus.ROLLBACK_COMPLETE).toBe('ROLLBACK_COMPLETE');
    });

    it('defines ROLLBACK_FAILED', () => {
      expect(StackStatus.ROLLBACK_FAILED).toBe('ROLLBACK_FAILED');
    });
  });

  it('enum values equal their key names', () => {
    for (const [key, value] of Object.entries(StackStatus)) {
      expect(value).toBe(key);
    }
  });

  describe('no-op states', () => {
    it('defines NO_CHANGES', () => {
      expect(StackStatus.NO_CHANGES).toBe('NO_CHANGES');
    });
  });
});

describe('ResourceStatus', () => {
  it('has 13 values', () => {
    expect(Object.keys(ResourceStatus)).toHaveLength(13);
  });

  describe('creation states', () => {
    it('defines CREATE_IN_PROGRESS', () => {
      expect(ResourceStatus.CREATE_IN_PROGRESS).toBe('CREATE_IN_PROGRESS');
    });

    it('defines CREATE_COMPLETE', () => {
      expect(ResourceStatus.CREATE_COMPLETE).toBe('CREATE_COMPLETE');
    });

    it('defines CREATE_FAILED', () => {
      expect(ResourceStatus.CREATE_FAILED).toBe('CREATE_FAILED');
    });
  });

  describe('update states', () => {
    it('defines UPDATE_IN_PROGRESS', () => {
      expect(ResourceStatus.UPDATE_IN_PROGRESS).toBe('UPDATE_IN_PROGRESS');
    });

    it('defines UPDATE_COMPLETE', () => {
      expect(ResourceStatus.UPDATE_COMPLETE).toBe('UPDATE_COMPLETE');
    });

    it('defines UPDATE_FAILED', () => {
      expect(ResourceStatus.UPDATE_FAILED).toBe('UPDATE_FAILED');
    });

    it('defines UPDATE_COMPLETE_CLEANUP_IN_PROGRESS', () => {
      expect(ResourceStatus.UPDATE_COMPLETE_CLEANUP_IN_PROGRESS).toBe(
        'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      );
    });

    it('defines UPDATE_ROLLBACK_IN_PROGRESS', () => {
      expect(ResourceStatus.UPDATE_ROLLBACK_IN_PROGRESS).toBe(
        'UPDATE_ROLLBACK_IN_PROGRESS',
      );
    });

    it('defines UPDATE_ROLLBACK_COMPLETE', () => {
      expect(ResourceStatus.UPDATE_ROLLBACK_COMPLETE).toBe(
        'UPDATE_ROLLBACK_COMPLETE',
      );
    });

    it('defines UPDATE_ROLLBACK_FAILED', () => {
      expect(ResourceStatus.UPDATE_ROLLBACK_FAILED).toBe(
        'UPDATE_ROLLBACK_FAILED',
      );
    });
  });

  describe('deletion states', () => {
    it('defines DELETE_IN_PROGRESS', () => {
      expect(ResourceStatus.DELETE_IN_PROGRESS).toBe('DELETE_IN_PROGRESS');
    });

    it('defines DELETE_COMPLETE', () => {
      expect(ResourceStatus.DELETE_COMPLETE).toBe('DELETE_COMPLETE');
    });

    it('defines DELETE_FAILED', () => {
      expect(ResourceStatus.DELETE_FAILED).toBe('DELETE_FAILED');
    });
  });

  it('enum values equal their key names', () => {
    for (const [key, value] of Object.entries(ResourceStatus)) {
      expect(value).toBe(key);
    }
  });
});
