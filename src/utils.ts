export async function newChat(model: 'internlm-chat' | 'internvl', key: string) {
  const res = await fetch(`https://${model}.intern-ai.org.cn/puyu/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Authorization': `Bearer ${key}`,
      'cookie': `uaa-token=${key}; is-login=1`,
    },
  }).then(res => res.json())

  if(res.code === 0) {
    return res.data.id as string
  }else {
    throw new Error(res.message)
  }
}
