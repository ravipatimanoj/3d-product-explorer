export type AiActionType =
  | 'FOCUS_FEATURE'
  | 'EXPLODE_PRODUCT'
  | 'ASSEMBLE_PRODUCT'
  | 'TOGGLE_FLASH'
  | 'SHOW_OVERVIEW'

export interface AiAction {
  type: AiActionType
  featureId?: string | null
  enabled?: boolean | null
}

export interface AiChatResponse {
  message: string
  action: AiAction | null
}
