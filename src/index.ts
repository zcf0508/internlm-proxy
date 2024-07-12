import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PromptJSON } from './type'
import { newChat } from './utils'
import { streamSSE } from 'hono/streaming'

const app = new Hono().basePath('/v1')

function createSSEResponse(chatId: string) {
  return {
    useSSE: (content: string) => {
      return {
        data: content,
        event: 'time-update',
        id: chatId,
      }
    }
  }
}

app.post('/chat/completions', async (c, next) => {
  const key = c.req.header()['authorization']?.split('Bearer ')[1] ?? process.env.INTERNLM_API_KEY

  const body = await c.req.json<PromptJSON>()

  let model = 'internlm-chat' as 'internlm-chat' | 'internvl'

  if(['internlm-chat', 'internvl'].includes(body.model)) {
    model = body.model
  }

  const prompt = body.messages.map(m => `${m.role}: ${m.content}`).join('\n\n---\n\n')

  const chatId = await newChat(model, key)

  /** raw response */
  const oRes = await fetch(`https://${model}.intern-ai.org.cn/puyu/chats/${chatId}/records/generate`, {
    method: 'GET',
    headers: {
      'content-type': 'text/event-stream',
      'accept': 'text/event-stream',
      'cache-control': 'no-cache',
      'authorization': `Bearer ${key}`,
      'cookie': `uaa-token=${key}; is-login=1`,
      'prompt': encodeURIComponent(prompt),
    },
  })

  const reader = oRes.body?.getReader()
  if (!reader) {
    return c.text('Error')
  }

  return streamSSE(c, async (stream) => {
    const {useSSE} = createSSEResponse(chatId)
    const decoder = new TextDecoder()
    let done = false
    let content = ''
    let delta = ''
    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      if (chunkValue) {
        const ress = chunkValue.split('\n').filter(c => c.includes('data:')).map(c => JSON.parse(c.split('data: ')[1]))
        for (let res of ress) {
          if(res.code === 0 && res.msg === 'success') {
            await stream.writeSSE(useSSE('[DONE]'))
          } else  if(res.code === 1 ) {
            if(content && res.msg.length <= content.length) {
              return
            }

            delta = content ? res.msg.split(content)[1] : res.msg
            content = res.msg

            await stream.writeSSE(
              useSSE(
                JSON.stringify({
                  id: chatId,
                  object: "chat.completion",
                  model,
                  choices:[
                    {
                      delta: {
                        role: "assistant",
                        content: delta
                      }
                    }
                  ]
                })
              )
            )
          } else if(res.code < 0 ) {
            await stream.writeSSE(
              useSSE(
                JSON.stringify({
                  error:{
                    message: res.msg
                  }
                })
              )
            )
          }
        }
      }
    }
  })
})

app.get('/models', async (c) => {
  return c.json({
    object: "list",
    data: [
      {
        "id": "internlm-chat",
        "object": "model",
        "created": 1677649963,
        "owned_by": "intern-ai",
        "permission": null,
        "root": null,
        "parent": null,
        "price": null
      },
      {
        "id": "internvl",
        "object": "model",
        "created": 1677649963,
        "owned_by": "intern-ai",
        "permission": null,
        "root": null,
        "parent": null,
        "price": null
      },
    ],
  })
})

const port = process.env.PORT ? Number(process.env.PORT) : 3000

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
