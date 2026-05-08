const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;
  const hfToken = process.env.VITE_HF_TOKEN || process.env.HF_TOKEN;

  if (!hfToken) {
    return res.status(500).json({ error: 'AI Token not configured on server' });
  }

  try {
    // We use the Inference API on the server side
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessage = messages.find(m => m.role === 'user')?.content || '';

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2`,
      {
        inputs: `<s>[INST] ${systemMessage}\n\nUser Question: ${userMessage} [/INST]`,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.1,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true'
        },
        timeout: 20000
      }
    );

    let content = "";
    if (Array.isArray(response.data) && response.data[0].generated_text) {
      content = response.data[0].generated_text.trim();
    } else {
      content = "I'm sorry, I couldn't process that request.";
    }

    return res.status(200).json({ 
      choices: [{ message: { content } }] 
    });
  } catch (error) {
    console.error('AI Server Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ 
      error: 'AI service failed', 
      details: error.response?.data || error.message 
    });
  }
}
