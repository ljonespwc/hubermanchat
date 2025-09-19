# Huberman Lab Voice Assistant - Project Status

## Project Overview
Building a voice-enabled AI assistant widget for the Huberman Lab website that helps visitors find answers to frequently asked questions through natural conversation. The widget appears as a small button on the page that opens a modal with voice interaction capabilities.

## Supabase Configuration
**Project ID**: `qkotdvjrsyzdcgwqsqyc`
Always use this project_id when interacting with Supabase MCP tools.

## Current Status: ✅ Scaffolding Complete
- Project structure created and organized
- Core components implemented
- API routes set up
- FAQ data scraped and stored
- Git repository initialized
- Ready for development server testing

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (configured but not connected)
- **Voice**: Web Speech API (Layercode integration planned)
- **AI**: OpenAI GPT-4.1-mini
- **State Management**: React hooks + Zustand (installed)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (planned)

## What's Been Built

### 1. Data Layer
- **FAQ Data**: Scraped from hubermanlab.com/faq
  - 36 Q&A pairs across 9 categories
  - Stored in `/docs/huberman_lab_faqs.json`
  - Categories include: Huberman Lab, Premium, Newsletter, Events, etc.

### 2. Core Components (`/src/components/widget/`)
- **VoiceWidget.tsx**: Main widget controller
- **WidgetButton.tsx**: Floating button to open widget
- **WidgetModal.tsx**: Modal container with animations
- **VoiceInterface.tsx**: Voice recording UI with visual feedback

### 3. API Routes (`/src/app/api/`)
- **`/chat`**: Processes questions, matches FAQs, falls back to OpenAI
- **`/voice`**: Handles voice-to-text and text-to-speech (placeholder for Layercode)

### 4. Business Logic (`/src/lib/`)
- **faq-matcher.ts**: Intelligent FAQ matching with similarity scoring
- **openai.ts**: GPT-4 integration for unmatched questions
- **supabase.ts**: Database client and types (ready to connect)
- **layercode.ts**: Voice service placeholder

### 5. Custom Hooks (`/src/hooks/`)
- **useVoice.ts**: Manages voice recording and playback
- **useChat.ts**: Handles chat messages and API calls

## User Experience Flow
1. User clicks floating widget button
2. Modal opens with microphone interface
3. User clicks mic to ask a question
4. Voice is transcribed to text
5. System searches FAQ database for matches
6. If match found (>60% confidence): returns FAQ answer
7. If no match: uses OpenAI to generate helpful response
8. Answer is displayed and read aloud
9. Links to relevant resources are provided

## Next Steps Required

### Immediate (Before Testing)
1. **Environment Setup**:
   ```bash
   cp .env.local.example .env.local
   # Add your OpenAI API key to .env.local
   ```

2. **Test Development Server**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

### Short Term
1. **GitHub Connection**:
   ```bash
   git remote set-url origin https://github.com/[USERNAME]/hubermanchat.git
   git push -u origin main
   ```

2. **Supabase Setup** (Optional):
   - Create Supabase project
   - Create tables for FAQs and analytics
   - Add credentials to `.env.local`
   - Run migration to populate FAQ data

3. **Testing & Refinement**:
   - Test voice recognition across browsers
   - Refine FAQ matching algorithm
   - Improve error handling
   - Add loading states

### Medium Term
1. **Layercode Integration**: Replace Web Speech API when available
2. **Widget Embed Script**: Create standalone script for external sites
3. **Analytics**: Track usage, popular questions, success rates
4. **Vercel Deployment**: Deploy and configure production environment

## Project Structure
```
hubermanchat/
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components
│   ├── lib/          # Utilities and integrations
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript definitions
├── docs/             # FAQ data and documentation
├── public/           # Static assets
└── [config files]    # Next, TypeScript, Tailwind configs
```

## Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter (when configured)
```

## Known Limitations
- Voice recognition requires Chrome/Edge (Web Speech API)
- Layercode integration pending (using Web Speech API fallback)
- Supabase not connected yet (using local JSON file)
- No authentication system (public access only)

## Resources
- FAQ Data Source: https://www.hubermanlab.com/faq
- GitHub Repo: https://github.com/[USERNAME]/hubermanchat
- OpenAI Docs: https://platform.openai.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

## Contact
For questions about implementation, check this file first or review the README.md.