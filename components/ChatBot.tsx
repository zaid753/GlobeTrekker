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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
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

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-cyan-600 text-white rounded-full p-4 shadow-lg hover:bg-cyan-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-700"
        aria-label="Open chatbot"
      >
        <ChatBubbleIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[60vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col transition-all duration-300 z-50">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Chat with GlobeTrekker AI</h3>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Close chatbot">
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center flex-shrink-0"><ChatBubbleIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" /></div>}
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
             {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center flex-shrink-0"><ChatBubbleIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" /></div>
                <div className="max-w-xs p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="form-input flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 text-gray-900 dark:text-white dark:border-gray-600 dark:focus:ring-cyan-400/50 dark:focus:border-cyan-400"
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="bg-cyan-600 text-white rounded-full p-2 disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-cyan-700 transition-all transform hover:scale-110 active:scale-100">
          <SendIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
