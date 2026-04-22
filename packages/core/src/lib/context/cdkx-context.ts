import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Interface for the cdkx.context.json file structure.
 * Matches AWS CDK format: { "acknowledged-issue-numbers": [34892, 12345] }
 */
export interface CdkxContextData {
  readonly 'acknowledged-issue-numbers'?: number[];
}

/**
 * Manages the cdkx.context.json file for persisting acknowledgements.
 * Uses AWS CDK format: { "acknowledged-issue-numbers": [34892, 12345] }
 */
export class CdkxContext {
  constructor(private readonly filePath: string) {}

  /**
   * Acknowledges an issue ID.
   * Creates the context file if it doesn't exist.
   */
  public acknowledge(id: string | number): void {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId)) {
      throw new Error(`Invalid acknowledgement ID: ${id}. Must be a number.`);
    }

    const data = this.readContext();
    const existingIds = data['acknowledged-issue-numbers'] ?? [];
    
    if (!existingIds.includes(numId)) {
      const updatedData: CdkxContextData = {
        'acknowledged-issue-numbers': [...existingIds, numId],
      };
      this.writeContext(updatedData);
    }
  }

  /**
   * Returns a Set of all acknowledged IDs as strings.
   */
  public getAcknowledgedIds(): Set<string> {
    const data = this.readContext();
    const ids = data['acknowledged-issue-numbers'] ?? [];
    return new Set(ids.map(id => id.toString()));
  }

  /**
   * Returns all acknowledged issue numbers.
   */
  public listAcknowledgements(): number[] {
    const data = this.readContext();
    return [...(data['acknowledged-issue-numbers'] ?? [])];
  }

  /**
   * Checks if a specific ID is acknowledged.
   */
  public isAcknowledged(id: string | number): boolean {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numId)) return false;
    
    const data = this.readContext();
    const ids = data['acknowledged-issue-numbers'] ?? [];
    return ids.includes(numId);
  }

  private readContext(): CdkxContextData {
    if (!fs.existsSync(this.filePath)) {
      return {};
    }

    const content = fs.readFileSync(this.filePath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<CdkxContextData>;
    
    return {
      'acknowledged-issue-numbers': parsed['acknowledged-issue-numbers'] ?? [],
    };
  }

  private writeContext(data: CdkxContextData): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
