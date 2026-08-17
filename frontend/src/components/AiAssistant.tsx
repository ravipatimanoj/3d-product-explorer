import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendAiChat } from '../services/aiApi'
import type { AiAction } from '../types/ai'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface AiAssistantProps {
  productId: string
  viewerActionsAvailable: boolean
  onAction: (action: AiAction | null) => void
}

export default function AiAssistant({
  productId,
  viewerActionsAvailable,
  onAction,
}: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, loading])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const response = await sendAiChat(productId, text)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.message,
        },
      ])
      onAction(response.action)
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'AI request failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ai-assistant" aria-label="AI Product Assistant">
      <div className="ai-assistant-header">
        <h3>AI Product Assistant</h3>
        <p>
          {viewerActionsAvailable
            ? 'Ask about this product or control the 3D view.'
            : '3D AI interactions are not currently available for this product. You can still ask catalog questions.'}
        </p>
      </div>

      <div className="ai-assistant-messages" ref={listRef} role="log">
        {messages.length === 0 && !loading ? (
          <p className="ai-assistant-empty">Ask me about this product</p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-assistant-bubble ai-assistant-bubble--${message.role}`}
          >
            <span className="ai-assistant-role">
              {message.role === 'user' ? 'You' : 'AI'}
            </span>
            <p>{message.text}</p>
          </div>
        ))}
        {loading ? (
          <p className="ai-assistant-status" role="status">
            Thinking…
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="ai-assistant-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="ai-assistant-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="ai-assistant-input">
          Ask something
        </label>
        <input
          id="ai-assistant-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask something..."
          autoComplete="off"
          disabled={loading}
        />
        <button type="submit" disabled={loading || input.trim().length === 0}>
          Send
        </button>
      </form>
    </section>
  )
}
