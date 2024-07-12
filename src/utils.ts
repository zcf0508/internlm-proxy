export async function newChat() {
  const res = await fetch('https://internlm-chat.intern-ai.org.cn/puyu/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Authorization': `Bearer ${process.env.INTERNLM_API_KEY}`,
      'cookie': `uaa-token=${process.env.INTERNLM_API_KEY}; is-login=1`,
    },
  }).then(res => res.json())

  if(res.code === 0) {
    return res.data.id as string
  }else {
    throw new Error(res.message)
  }
}
