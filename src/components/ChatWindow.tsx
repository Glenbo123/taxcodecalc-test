import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import axios, { AxiosError } from 'axios';
import { logError } from '../utils/debug';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWindow() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('chat.welcome'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Reset error state
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Check for API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setIsTyping(false);
      setError('API key is missing. Please check your environment configuration.');
      logError(new Error('Missing OpenAI API key'), { component: 'ChatWindow' });
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I cannot process your request due to a configuration issue. Please contact support.',
        timestamp: new Date()
      }]);
      
      return;
    }

    try {
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful UK tax advisor chatbot. Provide accurate and concise information about UK taxation, including income tax, National Insurance, tax codes, and available tax reliefs. Always clarify that this is general guidance and specific cases may vary.' 
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: input }
        ],
        max_tokens: 150,
        temperature: 0.7
      };

      // Debug: Log request details without sensitive information
      console.debug('Making request to OpenAI API');

      const response = await axios.post(
        apiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Debug: Log successful response without sensitive information
      console.debug('Received OpenAI API response');

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.choices[0].message.content.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Enhanced error handling
      let errorMessage = 'I apologize, but I encountered an error. Please try asking your question again.';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Log error details for debugging without exposing sensitive information
        logError(new Error(`OpenAI API Error: ${axiosError.message}`), {
          component: 'ChatWindow',
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText
        });

        // Customize error message based on status code
        if (axiosError.response?.status === 401) {
          errorMessage = 'Authentication error. Please check the API key configuration.';
        } else if (axiosError.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (axiosError.response?.status === 500) {
          errorMessage = 'OpenAI service is currently experiencing issues. Please try again later.';
        }
      } else {
        logError(error instanceof Error ? error : new Error('Unknown error in ChatWindow'), {
          component: 'ChatWindow'
        });
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-govuk-blue text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder')}
            className="flex-1 min-h-[44px] max-h-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-govuk-blue dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-govuk-blue hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;