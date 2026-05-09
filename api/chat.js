import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  
  // Use VITE_HF_TOKEN if present, otherwise HF_TOKEN
  const hfToken = process.env.VITE_HF_TOKEN || process.env.HF_TOKEN;

  if (!hfToken) {
    console.error("No Hugging Face token found in environment variables.");
    return res.status(500).json({ error: 'AI Token not configured on server' });
  }

  try {
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: hfToken,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
      messages: messages,
    });

    return res.status(200).json(chatCompletion);
  } catch (error) {
    console.error('AI Server Error:', error);
    return res.status(error.status || 500).json({ 
      error: 'AI service failed', 
      details: error.message 
    });
  }
}
