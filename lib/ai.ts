import { anthropic, type AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';

export const AI_MODEL = anthropic('claude-sonnet-5-5');

// Insight bullets and statement parsing are short content generation and extraction, so low
// effort is enough. If the model declines a request, the API retries it on a fallback model
// chosen for the kind of refusal.
export const AI_PROVIDER_OPTIONS = {
  anthropic: { effort: 'low', fallbacks: 'default' } satisfies AnthropicLanguageModelOptions,
};
