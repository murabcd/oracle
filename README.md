<a href="https://oracle-oss.vercel.app">
  <img alt="Open-source visual thinking and synthesis workspace for product work." src="./public/preview/oracle.png">
  <h1 align="center">Oracle</h1>
</a>

<p align="center">
  Open-source visual thinking and synthesis workspace for product work.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy your own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- Canvas-first workspace for product thinking
  - Collect notes, links, screenshots, and references in one visible place
  - Connect evidence to insights, decisions, and artifacts instead of losing context in chat
- Product synthesis and artifact creation
  - Turn messy inputs into summaries, briefs, interfaces, diagrams, and other product outputs
  - Branch ideas visually and keep intermediate reasoning on the canvas
- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) for server-side rendering and performance improvements
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
- [Shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility

## Model providers

This app ships with [OpenAI](https://openai.com/) provider as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [Ollama](https://ollama.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy your own

You can deploy your own version of the Oracle to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmurabcd%2Foracle&env=NEXT_PUBLIC_APP_UR,OPENAI_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Add%20the%20API%20keys%20and%20Blob%20token%20required%20for%20Oracle%20text%2C%20image%2C%20and%20video%20generation.&envLink=https%3A%2F%2Fgithub.com%2Fmurabcd%2Foracle%2Fblob%2Fmain%2F.env.example&demo-title=Oracle&demo-description=An%20open-source%20visual%20thinking%20and%20synthesis%20workspace%20for%20product%20work.&demo-url=https%3A%2F%2Foracle-oss.vercel.app)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run oracle. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Run Vercel via Bun: `bunx vercel link`
2. Download your environment variables: `bunx vercel env pull`

```bash
bun install
bun dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).
