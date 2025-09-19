'use client'

import { useState } from 'react'
import VoiceWidget from '@/components/widget/VoiceWidget'

export default function Home() {
  const [widgetOpen, setWidgetOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-huberman-dark to-huberman-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4">
          Huberman Lab Voice Assistant
        </h1>
        <p className="text-xl text-huberman-light mb-8">
          Demo page for the voice-enabled FAQ assistant
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Try the Voice Assistant
          </h2>
          <p className="text-huberman-light mb-6">
            Click the button below to open the voice assistant. You can ask questions about:
          </p>
          <ul className="list-disc list-inside text-huberman-light space-y-2 mb-6">
            <li>Huberman Lab podcast episodes and schedule</li>
            <li>How to access Premium content</li>
            <li>Newsletter and past issues</li>
            <li>Dr. Huberman&apos;s research and credentials</li>
            <li>Events and speaking invitations</li>
            <li>Sponsors and merchandise</li>
          </ul>

          <button
            onClick={() => setWidgetOpen(true)}
            className="bg-huberman-secondary hover:bg-huberman-accent transition-colors px-6 py-3 rounded-lg text-white font-semibold"
          >
            Open Voice Assistant
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Widget Integration
          </h3>
          <p className="text-huberman-light text-sm">
            This widget can be embedded on any page of the Huberman Lab website by including a simple script tag.
          </p>
        </div>
      </div>

      <VoiceWidget isOpen={widgetOpen} onClose={() => setWidgetOpen(false)} />
    </main>
  )
}