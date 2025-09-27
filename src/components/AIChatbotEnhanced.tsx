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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const serverCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Server health monitoring function
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Server health check failed:', error);
      return false;
    }
  };

  // Clear chat history when server goes offline
  const handleServerOffline = async () => {
    console.log('🔴 Server went offline - clearing chat history');
    await clearChat('server_offline');
    // Note: Don't reset serverOnline here - let the monitoring handle it
  };

  // Start server monitoring
  const startServerMonitoring = () => {
    if (serverCheckInterval.current) {
      clearInterval(serverCheckInterval.current);
    }
    
    serverCheckInterval.current = setInterval(async () => {
      const isOnline = await checkServerHealth();
      
      if (!isOnline && serverOnline) {
        // Server just went offline
        setServerOnline(false);
        await handleServerOffline();
      } else if (isOnline && !serverOnline) {
        // Server came back online
        setServerOnline(true);
        console.log('✅ Server is back online');
      }
    }, 5000); // Check every 5 seconds
  };

  // Stop server monitoring
  const stopServerMonitoring = () => {
    if (serverCheckInterval.current) {
      clearInterval(serverCheckInterval.current);
      serverCheckInterval.current = null;
    }
  };

  // Initialize welcome message and start server monitoring
  useEffect(() => {
    const savedMessages = localStorage.getItem('cropChatMessages');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Set initial welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        text: "🌾 **Welcome to your Smart Agricultural Assistant!** 🌾\n\nI'm here to help you with everything related to farming and this agricultural platform. I can assist you with:\n\n🌱 **Smart Crop Management**: Recommendations based on your soil, climate, and data\n📊 **AI-Powered Predictions**: Yield forecasting and harvest timing\n🚿 **Precision Irrigation**: Water scheduling and efficiency tips\n🧪 **Soil Health**: Nutrient analysis and fertilizer guidance\n🐛 **Pest & Disease Control**: Identification and treatment strategies\n💰 **Market Intelligence**: Price trends and optimal selling times\n🌡️ **Weather Insights**: Climate-based farming recommendations\n🔧 **Platform Help**: How to use dashboard, data input, and analysis features\n\n💬 **Ask me anything about farming, agriculture, or how to use this platform!**\n\nWhat agricultural challenge can I help you solve today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }

    // Start monitoring server health
    startServerMonitoring();

    // Browser lifecycle event handlers
    const handleBeforeUnload = () => {
      // Clear chat history when page is about to unload (synchronous)
      localStorage.removeItem('cropChatMessages');
      localStorage.removeItem('cropChatHistory');
      console.log('📄 Chat history cleared on page unload');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (tab switched, minimized, etc.)
        console.log('🙈 Page hidden - maintaining chat history');
      } else {
        // Page is visible again - check if server is still online
        checkServerHealth().then(isOnline => {
          if (!isOnline && serverOnline) {
            handleServerOffline();
          }
        });
      }
    };

    const handlePageHide = () => {
      // Clear chat when page is hidden (synchronous for reliability)
      localStorage.removeItem('cropChatMessages');
      localStorage.removeItem('cropChatHistory');
      console.log('📄 Chat history cleared on page hide');
    };

    const handleFocus = () => {
      // When window regains focus, check server status
      checkServerHealth().then(isOnline => {
        if (isOnline && !serverOnline) {
          setServerOnline(true);
          console.log('✅ Server is back online (detected on focus)');
        } else if (!isOnline && serverOnline) {
          handleServerOffline();
        }
      });
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopServerMonitoring();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Save messages and history to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cropChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

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

  const clearChat = async (reason: string = 'manual') => {
    try {
      // Call backend to clear chat history if server is online
      if (serverOnline) {
        const backendUrl = 'http://localhost:8000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        await fetch(`${backendUrl}/api/chat/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: 'default',
            reason: reason,
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ Server-side chat history cleared (${reason})`);
      }
    } catch (error) {
      console.log(`⚠️ Could not clear server-side chat history (${reason}):`, error);
    }
    
    // Clear client-side chat
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      text: `🌾 **Welcome to your Smart Agricultural Assistant!** 🌾\n\n${reason === 'server_offline' ? '⚠️ **Connection Status**: The server was recently offline, so I\'ve cleared our chat history for a fresh start.\n\n' : ''}I'm here to help you with everything related to farming and this agricultural platform. I can assist you with:\n\n🌱 **Smart Crop Management**: Recommendations based on your soil, climate, and data\n📊 **AI-Powered Predictions**: Yield forecasting and harvest timing\n🚿 **Precision Irrigation**: Water scheduling and efficiency tips\n🧪 **Soil Health**: Nutrient analysis and fertilizer guidance\n🐛 **Pest & Disease Control**: Identification and treatment strategies\n💰 **Market Intelligence**: Price trends and optimal selling times\n🌡️ **Weather Insights**: Climate-based farming recommendations\n🔧 **Platform Help**: How to use dashboard, data input, and analysis features\n\n💬 **Ask me anything about farming, agriculture, or how to use this platform!**\n\nWhat agricultural challenge can I help you solve today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([welcomeMessage]);
    localStorage.removeItem('cropChatMessages');
    localStorage.removeItem('cropChatHistory');
    console.log(`📄 Client-side chat history cleared (${reason})`);
  };

  const handleClose = async () => {
    // Clear chat history when closing the chatbot
    await clearChat('chatbot_closed');
    setIsOpen(false);
  };

  const isAgricultureRelated = (question: string): boolean => {
    const agricultureKeywords = [
      // Core agriculture terms
      'crop', 'farm', 'soil', 'plant', 'seed', 'harvest', 'agriculture', 'farming',
      'irrigation', 'fertilizer', 'pesticide', 'herbicide', 'organic', 'yield',
      'cultivation', 'livestock', 'cattle', 'poultry', 'dairy', 'greenhouse',
      
      // Specific crops
      'wheat', 'rice', 'corn', 'maize', 'cotton', 'soybean', 'sugarcane', 'potato',
      'tomato', 'onion', 'garlic', 'mustard', 'barley', 'millet', 'sorghum',
      'chickpea', 'lentil', 'pea', 'groundnut', 'sunflower',
      
      // Weather and climate
      'weather', 'climate', 'rainfall', 'drought', 'flood', 'season', 'monsoon',
      'temperature', 'humidity', 'frost', 'hail',
      
      // Soil and nutrients
      'nitrogen', 'phosphorus', 'potassium', 'npk', 'ph', 'nutrients', 'compost',
      'manure', 'organic matter', 'soil health', 'erosion',
      
      // Pests and diseases
      'pest', 'insect', 'disease', 'fungus', 'virus', 'bacteria', 'weed',
      'aphid', 'caterpillar', 'nematode', 'blight', 'rot',
      
      // Technology and tools
      'tractor', 'plow', 'harvester', 'sprayer', 'drone', 'sensor', 'precision',
      'automation', 'ai prediction', 'yield prediction', 'crop monitoring',
      
      // Market and economics
      'market price', 'commodity', 'export', 'import', 'subsidy', 'insurance',
      'loan', 'cooperative', 'mandi', 'procurement',
      
      // Website features
      'dashboard', 'data input', 'prediction', 'recommendation', 'suggestion',
      'analysis', 'profile', 'field management', 'crop rotation', 'tutorial',
      'help', 'how to use', 'features', 'navigation'
    ];
    
    const questionLower = question.toLowerCase();
    return agricultureKeywords.some(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
  };

  const callOpenRouterAI = async (userQuestion: string) => {
    try {
      // Check if the user message is agriculture-related
      if (!isAgricultureRelated(userQuestion)) {
        return "🌾 I'm your AI Farming Assistant, and I'm here to help you with agriculture-related questions only! I can assist you with:\n\n🌱 **Crop Management**: Planting, growing, and harvesting advice\n🚿 **Irrigation**: Water management and scheduling\n🧪 **Soil Health**: Nutrient management and soil testing\n🐛 **Pest Control**: Identification and treatment strategies\n📊 **Yield Prediction**: AI-powered crop yield forecasting\n💰 **Market Insights**: Pricing trends and selling strategies\n🌡️ **Weather Advice**: Climate-based farming recommendations\n🔧 **Website Help**: How to use our farming platform features\n\nPlease ask me something related to farming, agriculture, or how to use this agricultural platform!";
      }
      
      // Use the new OpenRouter-based FastAPI endpoint
      const backendUrl = 'http://localhost:8000';
      const resp = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuestion,
          location: 'India',
          crops: 'Mixed crops',
          farm_size: 'Small-Medium',
          irrigation: 'Available'
        })
      });
      
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Request failed with status ${resp.status}`);
      }
      
      const data = await resp.json();
      return data.response || "I'm sorry, I couldn't generate a response. Please try asking about crops, farming techniques, or how to use our agricultural platform!";
    } catch (e: any) {
      console.error('OpenRouter AI Error:', e);
      return "🌾 I'm currently having trouble connecting to the AI service. Please check your connection and try again. In the meantime, feel free to explore the dashboard for crop predictions and farming insights!";
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

    // Call OpenRouter AI (no history tracking needed)
    const responseText = await callOpenRouterAI(userInput);

    const botMessage: Message = {
      id: `msg_${Date.now()}_bot`,
      type: 'bot',
      text: responseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages
    const finalMessages = [...newMessages, botMessage];
    setMessages(finalMessages);
    
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
          onClick={() => isOpen ? handleClose() : setIsOpen(true)}
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
                  <div className={`w-2 h-2 ${
                    isTyping ? 'bg-orange-500' : 
                    serverOnline ? 'bg-green-500' : 'bg-red-500'
                  } rounded-full mr-2 animate-pulse`}></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {isTyping ? 'Thinking...' : serverOnline ? 'Online' : 'Server Offline'}
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