'use client'

import { useState } from 'react'
import VoiceWidget from '@/components/widget/VoiceWidget'

export default function Home() {
  const [widgetOpen, setWidgetOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-huberman-dark to-huberman-primary flex items-center justify-center">
      <button
        onClick={() => setWidgetOpen(true)}
        className="bg-huberman-secondary hover:bg-huberman-accent transition-all transform hover:scale-105 px-8 py-4 rounded-lg text-white font-semibold text-lg shadow-lg"
      >
        Huberman Lab Voice Assistant
      </button>

      <VoiceWidget isOpen={widgetOpen} onClose={() => setWidgetOpen(false)} />
    </main>
  )
}