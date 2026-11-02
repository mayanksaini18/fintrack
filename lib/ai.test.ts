import { expect, it } from 'vitest';
import { AI_MODEL, AI_PROVIDER_OPTIONS } from './ai';

it('uses the model that replaces claude-sonnet-4-5, at low effort with a fallback', () => {
  expect(AI_MODEL.modelId).toBe('claude-sonnet-5-5');
  expect(AI_PROVIDER_OPTIONS.anthropic).toEqual({ effort: 'low', fallbacks: 'default' });
});
