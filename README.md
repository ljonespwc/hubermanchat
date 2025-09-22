# Huberman Lab Voice Assistant

![Status: Development](https://img.shields.io/badge/Status-Development-yellow)

A voice-enabled AI assistant widget for the Huberman Lab website that answers frequently asked questions using natural language processing and voice interaction.

## Features

- 🎤 Voice input/output using Web Speech API (Layercode integration coming soon)
- 💬 Natural language FAQ matching
- 🤖 OpenAI GPT-4 fallback for unmatched questions
- 🎨 Beautiful, responsive modal interface
- 📊 Analytics tracking via Supabase
- 🔌 Embeddable widget for any page
- 🌙 Dark/light mode support

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **AI:** OpenAI GPT-4.1-mini
- **Voice:** Layercode (WebSocket + SSE)
- **Animation:** Framer Motion
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account (optional)
- Layercode account (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hubermanchat.git
cd hubermanchat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your API keys.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo page.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   │   ├── chat/        # Chat processing
│   │   └── voice/       # Voice processing
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Demo page
├── components/          # React components
│   └── widget/          # Widget components
├── lib/                 # Utilities
│   ├── faq-matcher.ts   # FAQ matching logic
│   ├── openai.ts        # OpenAI integration
│   └── supabase.ts      # Database client
└── hooks/               # Custom React hooks
```

## Widget Integration

To embed the widget on any page:

```html
<!-- Add to your HTML -->
<script src="https://hubermanchat.vercel.app/widget.js"></script>
```

The widget will automatically initialize and appear as a floating button in the bottom-right corner.

## API Endpoints

### POST /api/chat
Process user messages and return FAQ matches or AI-generated responses.

### POST /api/voice
Handle voice-to-text and text-to-voice conversions.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This project is configured for easy deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_KEY` (optional) - For enhanced database access
   - `LAYERCODE_API_KEY` - Your Layercode API key
   - `NEXT_PUBLIC_LAYERCODE_PIPELINE_ID` - Your Layercode pipeline ID
   - `LAYERCODE_WEBHOOK_SECRET` - Your Layercode webhook secret
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://hubermanchat.vercel.app)
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For questions about the widget, please open an issue on GitHub.
For questions about Huberman Lab, visit [hubermanlab.com/faq](https://www.hubermanlab.com/faq).
