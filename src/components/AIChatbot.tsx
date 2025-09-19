import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiUser } from 'react-icons/fi';
// import { useTranslation } from 'react-i18next';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  time: string;
  suggestions?: string[];
}

interface AIResponse {
  text: string;
  suggestions: string[];
}

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m your AI farming assistant. I can help you with yield predictions, irrigation schedules, fertilizer advice, and more. How can I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['Yield prediction', 'Irrigation help', 'Fertilizer advice', 'Weather insights']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const { t } = useTranslation();

  // Enhanced AI responses with more contextual farming advice
  const aiResponses: Record<string, AIResponse> = {
    'yield': {
      text: 'Based on your current field conditions and AI analysis, I predict a yield of 4.5 tons/ha for your next harvest with 87% confidence. This represents a 12% increase from last season! Key factors: optimal soil moisture (68%), favorable weather patterns, and your improved irrigation schedule.',
      suggestions: ['Show detailed analysis', 'Factors affecting yield', 'Compare with last year', 'Improvement tips']
    },
    'irrigation': {
      text: 'Your AI-optimized irrigation schedule shows: Next watering tomorrow at 6:00 AM for 4 hours. Current soil moisture is 68% - optimal range! Skip Tuesday due to 40mm rainfall forecast. This smart scheduling saves 23% water compared to manual irrigation.',
      suggestions: ['View full schedule', 'Adjust timing', 'Check soil moisture', 'Water savings report']
    },
    'fertilizer': {
      text: 'AI recommends NPK application in 3 days during growth phase. Optimal ratio: 30-15-25 kg/ha for your wheat crop. Current soil nitrogen: 45ppm (good), phosphorus: 22ppm (needs boost). Expected cost savings: $145/month with precision application.',
      suggestions: ['View fertilizer plan', 'NPK calculator', 'Cost analysis', 'Application timing']
    },
    'weather': {
      text: 'Weather analysis: Current 28°C with 72% humidity - perfect for crop growth! Heavy rainfall alert: 40mm expected tomorrow evening. AI suggests: delay field operations until Wednesday, ensure proper drainage, consider fungicide application if humidity stays >75%.',
      suggestions: ['7-day forecast', 'Rain impact analysis', 'Best work timing', 'Weather alerts']
    },
    'pest': {
      text: 'AI pest risk assessment: Low risk detected (12% probability). However, increasing humidity may attract aphids next week. Preventive measures: monitor yellow sticky traps, apply neem oil spray if humidity >75%. Early detection saves 30% crop damage.',
      suggestions: ['Pest identification', 'Organic solutions', 'Monitoring schedule', 'Risk assessment']
    },
    'soil': {
      text: 'Soil health analysis: pH 6.8 (optimal), organic matter 3.2% (good), moisture 68% (perfect). Recommendations: add compost before next season, consider lime application if pH drops below 6.5. Your soil score: 85/100 - excellent farming!',
      suggestions: ['Detailed soil report', 'pH adjustment', 'Organic matter tips', 'Testing schedule']
    },
    'market': {
      text: 'Market intelligence: Current wheat prices ₹2,250/quintal (+12% from last month). Best selling window: March 10-20. Predicted price trend: slight increase due to export demand. Your expected revenue: ₹101,250/hectare at current yield.',
      suggestions: ['Price trends', 'Best selling time', 'Revenue calculator', 'Market analysis']
    },
    'default': {
      text: 'I\'m your intelligent farming companion! I can provide insights on: 🌾 Yield predictions with AI confidence scores, 💧 Smart irrigation scheduling, 🧪 Precision fertilizer recommendations, 🌤️ Weather-based farming advice, 🐛 Pest & disease management, 📊 Market price analysis.',
      suggestions: ['Yield prediction', 'Irrigation help', 'Fertilizer advice', 'Weather insights']
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (input: string): AIResponse => {
    const lowercaseInput = input.toLowerCase();
    const keywords = ['yield', 'irrigation', 'water', 'fertilizer', 'weather', 'rain', 'pest', 'disease', 'soil', 'market', 'price'];
    
    for (const keyword of keywords) {
      if (lowercaseInput.includes(keyword)) {
        if (keyword === 'water') return aiResponses.irrigation;
        if (keyword === 'rain') return aiResponses.weather;
        if (keyword === 'disease') return aiResponses.pest;
        if (keyword === 'price') return aiResponses.market;
        return aiResponses[keyword] || aiResponses.default;
      }
    }
    return aiResponses.default;
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = getAIResponse(inputValue);
      const botMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const chatVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-r from-ai-purple to-ai-purple-light rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-glow transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiX size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <FiMessageSquare size={24} />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-success-green rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-ai-purple to-ai-purple-light rounded-full"
            animate={{
              scale: [1, 1.3, 1.3, 1],
              opacity: [0.7, 0.3, 0, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
          />
        )}
      </motion.div>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-24 right-6 z-40 w-80 sm:w-96"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-ai-purple to-ai-purple-light p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FiUser size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI Farm Assistant</h3>
                      <p className="text-sm text-white/80 flex items-center">
                        <motion.div
                          className="w-2 h-2 bg-success-green rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        Online & Learning
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 bg-gray-50/50">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-leaf-green text-white' 
                            : 'bg-ai-purple text-white'
                        }`}>
                  {message.type === 'user' ? <FiUser size={16} /> : <FiUser size={16} />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-leaf-green text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {message.time}
                          </p>
                          
                          {/* Suggestions */}
                          {message.suggestions && (
                            <div className="mt-3 space-y-1">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="block w-full text-left px-3 py-2 text-xs bg-ai-purple/10 hover:bg-ai-purple/20 text-ai-purple rounded-lg transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 mb-4"
                  >
                    <div className="w-8 h-8 bg-ai-purple rounded-full flex items-center justify-center">
                      <FiUser size={16} className="text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-ai-purple rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-ai-purple rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-ai-purple rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about crops, weather, irrigation..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-ai-purple/50 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="w-10 h-10 bg-gradient-to-r from-ai-purple to-ai-purple-light text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;