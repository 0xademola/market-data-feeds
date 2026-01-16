# Multi-LLM Setup Guide

Configure multiple AI providers with automatic fallback for cost optimization and reliability.

## Supported Providers

| Provider | Models | Cost | Speed | Get Key |
|----------|--------|------|-------|---------|
| **Google Gemini** | flash, pro | **FREE!** | Fast | [Get Key](https://aistudio.google.com/app/apikey) |
| **Anthropic Claude** | haiku, sonnet, opus | $$ | Medium | [Get Key](https://console.anthropic.com/) |
| **Groq** | llama-3.1, mixtral | $ | **Ultra-fast** | [Get Key](https://console.groq.com/) |
| **OpenAI** | gpt-4o-mini, gpt-4 | $$$ | Medium | [Get Key](https://platform.openai.com/api-keys) |

## Quick Start

### 1. Get API Keys

**Gemini (Recommended - FREE):**
- Visit https://aistudio.google.com/app/apikey
- Click "Get API Key"
- Copy key (starts with `AIza...`)

**Anthropic Claude:**
- Visit https://console.anthropic.com/
- Go to "API Keys" → Create key
- Copy key (starts with `sk-ant-...`)

**Groq:**
- Visit https://console.groq.com/
- Go to "API Keys" → Create key
- Copy key (starts with `gsk_...`)

### 2. Configure in Code

```typescript
import { feeds } from 'market-data-feeds';

feeds.configure({
  // Add providers you have keys for
  geminiKey: 'YOUR_GEMINI_KEY',
  anthropicKey: 'YOUR_CLAUDE_KEY',
  groqKey: 'YOUR_GROQ_KEY',
  openAiKey: 'YOUR_OPENAI_KEY',  // Optional
  
  // Set default provider
  llmProvider: 'gemini',
  
  // Auto-fallback chain (if primary fails)
  llmFallbackChain: ['gemini', 'anthropic', 'groq', 'openai']
});
```

### 3. Use AI Features

```typescript
// Uses your configured primary provider (Gemini)
const result = await feeds.ai.verify("Who is the CEO of Tesla?");
console.log(result.answer);     // "Elon Musk"
console.log(result.provider);   // "gemini"

// Specify provider for this request
const fast = await feeds.ai.verify("Simple question", { provider: 'groq' });
```

## Configuration Options

### Single Provider
```typescript
feeds.configure({
 geminiKey: 'KEY'  // Uses Gemini only
});
```

### Multi-Provider with Fallback
```typescript
feeds.configure({
  geminiKey: 'KEY1',
  anthropicKey: 'KEY2',
  llmProvider: 'gemini',
  llmFallbackChain: ['gemini', 'anthropic']  // Auto-fallback
});
```

### Per-Request Provider
```typescript
// Fast inference
const result1 = await feeds.ai.verify("Q", { provider: 'groq' });

// Better reasoning
const result2 = await feeds.ai.verify("Complex Q", { provider: 'anthropic' });
```

## Environment Variables

Add to `.env`:
```bash
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
```

Then:
```typescript
feeds.configure({
  geminiKey: process.env.GEMINI_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  llmProvider: 'gemini'
});
```

## Cost Optimization

```typescript
// FREE tier first, then cheap, then expensive
feeds.configure({
  geminiKey: 'KEY',       // FREE: 60 req/min
  groqKey: 'KEY',         // $: $0.05/1M tokens
  anthropicKey: 'KEY',    // $$: $3/1M tokens
  openAiKey: 'KEY',       // $$$: $15/1M tokens
  
  llmFallbackChain: ['gemini', 'groq', 'anthropic', 'openai']
});
```

**Savings**: With Gemini free tier → **$0/month** for moderate usage!

## Response Format

```typescript
{
  answer: "Tesla CEO is Elon Musk",
  provider: "gemini",           // Which LLM answered
  model: "gemini-1.5-flash",    // Specific model used
  confidence: 0.95,
  sources: ["..."]
}
```

## Troubleshooting

**"All LLM providers failed"**
- Check API keys are correct
- Verify internet connection
- Check provider API status pages

**"Provider X failed"**
- Fallback chain activates automatically
- Check logs for which provider succeeded
- Provider failures don't stop execution
