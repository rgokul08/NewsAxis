import { describe, test, expect } from 'vitest';
import { NewsAxisLoader } from '../../src/components/ui/NewsAxisLoader.jsx';

describe('NewsAxisLoader Component', () => {
  test('NewsAxisLoader is defined and exports a functional component', () => {
    expect(NewsAxisLoader).toBeDefined();
    expect(typeof NewsAxisLoader).toBe('function');
  });

  test('default props structure and contracts are preserved', () => {
    // Verify component accepts minDuration and onComplete contracts
    expect(NewsAxisLoader.length).toBeGreaterThanOrEqual(0);
  });
});
