export type PromptMessage = {
  role: 'system' | 'user'
  content: string
}

export type PromptJSON = {
  model: 'internlm-chat' | 'internvl'
  temperature: number
  top_p: number,
  frequency_penalty: number,
  presence_penalty: number,
  stream: boolean,
  messages: PromptMessage[]
}
