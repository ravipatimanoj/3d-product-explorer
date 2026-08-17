import type { AiChatResponse } from '../types/ai'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `AI request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) {
        message = body.message
      }
    } catch {
      // Keep the status fallback when the body is not JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function sendAiChat(
  productId: string,
  message: string,
): Promise<AiChatResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, message }),
  })

  return handleResponse<AiChatResponse>(response)
}
