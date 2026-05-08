import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatBot({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Hello! I am your Mission Control Assistant. Ask me anything about the current ISS position or breaking news.' }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages.slice(-30)));
    scrollToBottom();
  }, [messages]);

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you today?' }]);
    localStorage.removeItem('chatHistory');
    toast.success("Chat history cleared");
  };

  const buildSystemPrompt = () => {
    const { issData, newsData } = dashboardData;
    const { currentPos, nearestPlace, astros } = issData;
    const { articles } = newsData;

    return `You are a restricted dashboard assistant. 
RULES:
1. ONLY answer questions using the provided data.
2. If the answer is not in the data, strictly say: "I only know dashboard data."
3. DO NOT use any outside knowledge or the internet.

DATA:
ISS: Lat ${currentPos?.lat}, Lng ${currentPos?.lng}, Speed ${currentPos?.speed} km/h, Place: ${nearestPlace}, People: ${astros.number}
NEWS: ${articles.map((a, i) => `${i+1}. ${a.title}`).join(' | ')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const systemPrompt = buildSystemPrompt();
    
    try {
      const hfToken = import.meta.env.VITE_HF_TOKEN;
      if (!hfToken) throw new Error("Hugging Face token missing");

      // We use the direct Inference API as it is more stable for browser-based requests than the Router
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
        { 
          inputs: `<s>[INST] ${systemPrompt}\n\nUser Question: ${input} [/INST]`,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.1,
            return_full_text: false
          }
        },
        { 
          headers: { 
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
            "x-wait-for-model": "true"
          } 
        }
      );

      let botResponse = "";
      if (Array.isArray(response.data) && response.data[0].generated_text) {
        botResponse = response.data[0].generated_text.trim();
      } else if (response.data.choices) {
        botResponse = response.data.choices[0].message.content.trim();
      } else {
        throw new Error("Invalid AI response format");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      
      let errorMessage = "I only know dashboard data and the AI service is currently unavailable.";
      if (error.response?.status === 401) {
        errorMessage = "Error: Invalid Hugging Face Token. Please check your Vercel environment variables.";
      } else if (error.response?.status === 503) {
        errorMessage = "The AI model is currently loading or overloaded. Please try again in a few seconds.";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ff4d4d] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[500px] glass-card flex flex-col z-50 animate-fade-in overflow-hidden border-[#ff4d4d]/20 border-2 shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-[#ff4d4d] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold">AI Mission Assistant</h3>
            </div>
            <button onClick={handleClear} className="p-1 hover:bg-white/20 rounded transition-colors">
              <Trash2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-navy-900">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-navy-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-navy-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ask from dashboard data only..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-navy-900 border-none rounded-lg focus:ring-2 focus:ring-[#ff4d4d]/50 text-sm dark:text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 bg-[#ff4d4d] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
