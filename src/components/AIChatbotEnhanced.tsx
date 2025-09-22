import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiX, 
  FiUser, 
  FiCheck,
  FiTrendingUp
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  time: string;
}

const AIChatbotEnhanced: React.FC = () => {
  // State Management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('cropChatMessages');
    const savedHistory = localStorage.getItem('cropChatHistory');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Set initial welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        text: "🌾 Hello! I'm your AI Farming Assistant. I can help you with:\n\n• **Crop recommendations** based on your soil and climate\n• **Yield predictions** using AI analysis\n• **Irrigation scheduling** for water efficiency\n• **Fertilizer advice** for optimal growth\n• **Pest management** strategies\n• **Market insights** and pricing trends\n\nHow can I assist you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save messages and history to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cropChatMessages', JSON.stringify(messages));
    }
  }, [messages]);
  
  useEffect(() => {
    localStorage.setItem('cropChatHistory', JSON.stringify(history));
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Handle clicking outside to close chatbot
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      text: "🌾 Hello! I'm your AI Farming Assistant. I can help you with:\n\n• **Crop recommendations** based on your soil and climate\n• **Yield predictions** using AI analysis\n• **Irrigation scheduling** for water efficiency\n• **Fertilizer advice** for optimal growth\n• **Pest management** strategies\n• **Market insights** and pricing trends\n\nHow can I assist you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMessage]);
    setHistory([]);
    localStorage.removeItem('cropChatMessages');
    localStorage.removeItem('cropChatHistory');
  };

  const callGemini = async (historyToSend: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
    try {
      const backendUrl = 'http://localhost:5000';
      const resp = await fetch(`${backendUrl}/api/chat/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyToSend })
      });
      
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Request failed with status ${resp.status}`);
      }
      
      const data = await resp.json();
      return data.text || "I'm sorry, I couldn't generate a response.";
    } catch (e: any) {
      console.error('Gemini API Error:', e);
      return "I'm currently having trouble connecting to the AI service. Please check your connection and try again.";
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update UI immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const userInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Prepare history for API call
    const updatedHistory = [
      ...history,
      { role: 'user' as const, parts: [{ text: userInput }] }
    ];

    // Call Gemini API
    const responseText = await callGemini(updatedHistory);

    const botMessage: Message = {
      id: `msg_${Date.now()}_bot`,
      type: 'bot',
      text: responseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages and history
    const finalMessages = [...newMessages, botMessage];
    const finalHistory = [
      ...updatedHistory,
      { role: 'model' as const, parts: [{ text: responseText }] }
    ];

    setMessages(finalMessages);
    setHistory(finalHistory);
    
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Custom code block renderer
  const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    const blockId = `code_${Date.now()}_${Math.random()}`;
    
    return (
      <div className="relative group">
        <button
          onClick={() => copyToClipboard(value, blockId)}
          className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {copiedId === blockId ? <FiCheck size={16} /> : <span className="text-xs font-medium">Copy</span>}
        </button>
        <SyntaxHighlighter
          style={coy}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            border: '1px solid #e5e7eb'
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-blue-400/50 hover:shadow-xl"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <FiX size={24} />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <FiMessageSquare size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      {/* Enhanced Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatbotRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[48rem] lg:w-[56rem] xl:w-[64rem] max-w-[95vw] h-[40rem] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                AI Farm Assistant
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm">
                  <div className={`w-2 h-2 ${isTyping ? 'bg-orange-500' : 'bg-green-500'} rounded-full mr-2 animate-pulse`}></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {isTyping ? 'Thinking...' : 'Online'}
                  </span>
                </span>
                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear Chat"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-800">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.type === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <FiTrendingUp size={16} className="text-white" />
                        </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}>
                      {message.type === 'user' ? (
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      ) : (
                        <ReactMarkdown
                          className="prose prose-sm max-w-none"
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              return !isInline && match ? (
                                <CodeBlock
                                  language={match[1]}
                                  value={String(children).replace(/\n$/, '')}
                                />
                              ) : (
                                <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      )}
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {message.time}
                      </p>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                        <FiUser size={16} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                        <FiTrendingUp size={16} className="text-white" />
                      </div>
                    <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about crops, weather, irrigation, or farming advice..."
                  className="w-full bg-transparent p-4 pr-16 resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  rows={1}
                  style={{ minHeight: '56px', maxHeight: '200px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className={`absolute right-3 bottom-3 p-2.5 rounded-lg transition-all ${
                    inputValue.trim() && !isTyping
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiMessageSquare size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbotEnhanced;