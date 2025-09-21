'use client'

import { useState, useEffect } from 'react'
import { Mic, Volume2, Loader2, WifiOff, Wifi, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayercodeVoice } from '@/hooks/useSimpleLayercodeVoice'

interface SimplifiedVoiceInterfaceProps {
  onClose: () => void
}

export default function SimplifiedVoiceInterface({ onClose }: SimplifiedVoiceInterfaceProps) {
  const [hasStarted, setHasStarted] = useState(false)
  const [hasHadFirstInteraction, setHasHadFirstInteraction] = useState(false)

  const {
    isConnected,
    isConnecting,
    connectionStatus,
    userAudioLevel,
    agentAudioLevel,
    startNewConversation
  } = useLayercodeVoice({
    metadata: {
      source: 'huberman-lab-widget',
      timestamp: new Date().toISOString()
    }
  })

  // Auto-start conversation when connected
  useEffect(() => {
    if (isConnected && !hasStarted) {
      setHasStarted(true)
      // Conversation starts automatically - user can just speak
    }
  }, [isConnected, hasStarted])

  // Handle end conversation
  const handleEndConversation = () => {
    startNewConversation()
    onClose()
  }

  // Debug: Log amplitude values when they're non-zero
  useEffect(() => {
    if (userAudioLevel > 0) {
      console.log('User amplitude:', userAudioLevel)
    }
    if (agentAudioLevel > 0) {
      console.log('Agent amplitude:', agentAudioLevel)
    }
  }, [userAudioLevel, agentAudioLevel])

  // Determine current state
  // Lower threshold for user speaking detection (was 0.1, now 0.01)
  const isSpeaking = userAudioLevel > 0.01
  const isListening = agentAudioLevel > 0.05  // Keep agent threshold slightly higher
  const isActive = hasStarted && isConnected

  // Track first interaction
  useEffect(() => {
    if ((isSpeaking || isListening) && !hasHadFirstInteraction) {
      setHasHadFirstInteraction(true)
    }
  }, [isSpeaking, isListening, hasHadFirstInteraction])

  // Get button color based on state
  const getButtonColor = () => {
    if (!isConnected) return 'bg-gray-400'
    if (isSpeaking) return 'bg-green-500'
    if (isListening) return 'bg-huberman-secondary'
    return 'bg-huberman-secondary hover:bg-huberman-accent'
  }

  // Get status text - only three states, no bouncing
  const getStatusText = () => {
    if (!isConnected) return 'Connecting...'
    if (!hasStarted) return 'Click to start conversation'

    // During conversation - only show these two states
    if (isSpeaking) return 'Listening to you...'
    if (isListening) return 'Speaking...'

    // Initial state only (before first interaction)
    if (!hasHadFirstInteraction) return 'Ask me anything'

    // After interaction has happened, show nothing during silence
    return ' '  // Space to maintain layout
  }

  return (
    <div className="relative p-8 space-y-6 min-h-[320px]">
      {/* Connection Status - Upper left */}
      <div className="absolute top-6 left-6 flex items-center space-x-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Close Modal Button - Upper right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Main Interface */}
      <div className="flex flex-col items-center space-y-6">
        {/* Voice Button */}
        <motion.button
          onClick={() => {
            if (!hasStarted && isConnected) {
              setHasStarted(true)
            }
          }}
          disabled={!isConnected || (hasStarted && isActive)}
          className={`relative p-8 rounded-full transition-all ${getButtonColor()} ${
            !isConnected ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileTap={!hasStarted ? { scale: 0.95 } : {}}
        >
          {/* Icon */}
          {isConnecting ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isListening ? (
            <Volume2 className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}

          {/* Pulse effect when active */}
          <AnimatePresence>
            {(isSpeaking || isListening) && (
              <motion.span
                initial={{ scale: 1, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.3, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className={`absolute inset-0 rounded-full ${
                  isSpeaking ? 'bg-green-400' : 'bg-huberman-secondary'
                }`}
              />
            )}
          </AnimatePresence>

          {/* Audio level ring - Show for both user and AI speaking */}
          {isActive && (userAudioLevel > 0 || agentAudioLevel > 0) && (
            <motion.span
              className={`absolute inset-0 rounded-full border-4 ${
                isSpeaking ? 'border-green-300' : 'border-huberman-accent'
              }`}
              animate={{
                scale: 1 + (isSpeaking ? userAudioLevel : agentAudioLevel) * 0.3,
                opacity: 0.3 + (isSpeaking ? userAudioLevel : agentAudioLevel) * 0.5
              }}
              transition={{ duration: 0.1 }}
            />
          )}
        </motion.button>

        {/* Status Text - Fixed height container */}
        <div className="h-6 flex items-center justify-center">
          <motion.p
            className="text-sm text-gray-600 dark:text-gray-400 text-center"
            key={getStatusText()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getStatusText()}
          </motion.p>
        </div>

        {/* Removed visualizer bars - keeping empty div for spacing */}
        <div className="h-10"></div>
      </div>

    </div>
  )
}