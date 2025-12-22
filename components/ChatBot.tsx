import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, CloseIcon, SendIcon, UserIcon } from './icons';
import type { Itinerary, ChatMessage, TripDetails } from '../types';
import { getChatResponse } from '../services/geminiService';

interface ChatBotProps {
  itinerary: Itinerary | null;
  details: TripDetails | null;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ itinerary, details, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(32); // Default 8 (32px)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  // Logic to prevent overlap with footer
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // If footer starts appearing in viewport
      if (footerRect.top < viewportHeight) {
        const visibleFooterHeight = viewportHeight - footerRect.top;
        // Shift chatbot up by the amount of footer visible + a small margin
        setBottomOffset(visibleFooterHeight + 20);
      } else {
        setBottomOffset(32); // Reset to default 8 (32px)
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initial message when chatbot is first opened
    if (isOpen && messages.length === 0) {
        const initialMessage = itinerary
            ? `Hi there! I'm GlobeTrekker AI. Feel free to ask me any questions about your trip to ${itinerary.trip_title.split(' to ')[1] || 'your destination'}!`
            : `Hi there! I'm GlobeTrekker AI. How can I help you plan your next adventure today? You can ask me about destinations, travel tips, or anything else!`;

        setMessages([{ role: 'model', text: initialMessage }]);
    }
  }, [isOpen, messages.length, itinerary]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await getChatResponse([...messages, userMessage], input, itinerary, details);
    
    const modelMessage: ChatMessage = { role: 'model', text: response };
    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const dynamicStyle = {
    bottom: `${bottomOffset}px`,
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={dynamicStyle}
        className="fixed right-8 bg-cyan-600 text-white rounded-full p-4 shadow-lg hover:bg-cyan-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-700 z-[90]"
        aria-label="Open chatbot"
      >
        <ChatBubbleIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div 
      style={dynamicStyle}
      className="fixed right-8 w-[calc(100%-4rem)] sm:w-full max-w-sm h-[60vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col transition-all duration-300 z-[90] border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-cyan-600">
        <div className="flex items-center gap-2 text-white">
            <ChatBubbleIcon className="h-5 w-5" />
            <h3 className="font-bold text-lg font-serif">GlobeTrekker AI</h3>
        </div>
        <button onClick={onToggle} className="text-white/80 hover:text-white transition-colors" aria-label="Close chatbot">
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ChatBubbleIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
             {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ChatBubbleIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-white dark:bg-gray-700 shadow-sm">
                    <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-cyan-600 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-white dark:bg-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          className="form-input flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-full py-2.5 px-5 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm text-gray-900 dark:text-white dark:border-gray-600 transition-all"
          disabled={isLoading}
        />
        <button 
            onClick={handleSend} 
            disabled={isLoading || input.trim() === ''} 
            className="bg-cyan-600 text-white rounded-full p-2.5 disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed hover:bg-cyan-700 transition-all transform hover:scale-105 active:scale-95 shadow-md"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;