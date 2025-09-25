# AI Provider Switching Guide

This app now supports easy switching between OpenAI (GPT-4.1-mini) and Google Gemini (2.5-flash-lite) for FAQ matching.

## Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Choose which provider to use: 'openai' or 'gemini'
AI_PROVIDER=openai

# OpenAI API Key (required if AI_PROVIDER=openai)
OPENAI_API_KEY=your-openai-key-here

# Gemini API Key (required if AI_PROVIDER=gemini)
GEMINI_API_KEY=your-gemini-key-here
```

### 2. Vercel Configuration

Add the same environment variables to your Vercel project:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `AI_PROVIDER` (set to `openai` or `gemini`)
   - `OPENAI_API_KEY` (your OpenAI API key)
   - `GEMINI_API_KEY` (your Gemini API key)

## Switching Providers

To switch between providers:

1. **Local Development**: Change `AI_PROVIDER` in `.env.local` and restart the dev server
2. **Production**: Change `AI_PROVIDER` in Vercel and redeploy

That's it! No code changes needed.

## Testing

Run the test script to compare both providers:

```bash
npx tsx scripts/test-ai-providers.ts
```

This will test both providers (if API keys are set) and show response times and quality.

## How It Works

The implementation uses an abstraction layer (`src/lib/ai-provider.ts`) that:

1. Defines a common `AIProvider` interface
2. Implements provider-specific classes for OpenAI and Gemini
3. Uses a factory pattern to instantiate the correct provider based on `AI_PROVIDER`
4. Handles message format conversion between providers

The FAQ matcher (`src/lib/faq-ai-matcher.ts`) uses this abstraction, so it works identically regardless of which provider is active.

## Provider Comparison

| Feature | OpenAI (GPT-4.1-mini) | Gemini (2.5-flash-lite) |
|---------|----------------------|------------------------|
| Model | gpt-4-1106-preview | gemini-2.5-flash-lite |
| Typical Response Time | 3-5 seconds | 1-3 seconds (expected) |
| Cost | ~$0.0002 per query | Free tier available |
| Context Window | 128k tokens | 1M tokens |

## Troubleshooting

- **"OPENAI_API_KEY is not set"**: Make sure your OpenAI API key is in `.env.local`
- **"GEMINI_API_KEY is not set"**: Add your Gemini API key when using `AI_PROVIDER=gemini`
- **Provider not switching**: Restart the dev server or redeploy on Vercel after changing `AI_PROVIDER`

## Adding New Providers

To add a new AI provider:

1. Create a new class in `src/lib/ai-provider.ts` implementing the `AIProvider` interface
2. Add a case for it in the `getAIProvider()` factory function
3. Add the necessary API key to environment variables

Example:
```typescript
class ClaudeProvider implements AIProvider {
  // Implementation here
}
```