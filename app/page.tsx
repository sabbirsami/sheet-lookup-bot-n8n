'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface InstagramEntry {
  date?: string;
  instagram?: string;
  email?: string;
  telegram?: string;
}

interface ApiResponse {
  results?: InstagramEntry[];
  total_found?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  data?: ApiResponse;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        'Hello! I can help you query Instagram entries from your APPICS bounty campaign data. You can ask me to:\n\n• Show Instagram links\n• Get email addresses or Telegram IDs\n• Sort entries by date\n• Find who submitted first\n• Search for specific users\n• Or ask me anything else about the data!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.content || data.message || 'I processed your request.',
        data: data.data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderEntryCard = (entry: InstagramEntry, index: number) => (
    <Card key={index} className="p-3 bg-gray-50 border-l-4 border-l-blue-400">
      <div className="space-y-1 text-xs">
        {entry.date && (
          <div>
            <span className="font-medium text-gray-700">Date:</span>{' '}
            <span className="text-gray-600">{entry.date}</span>
          </div>
        )}
        {entry.instagram && (
          <div>
            <span className="font-medium text-gray-700">Instagram:</span>
            <a
              href={entry.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1 break-all"
            >
              {entry.instagram}
            </a>
          </div>
        )}
        {entry.email && (
          <div>
            <span className="font-medium text-gray-700">Email:</span>{' '}
            <span className="text-gray-600">{entry.email}</span>
          </div>
        )}
        {entry.telegram && (
          <div>
            <span className="font-medium text-gray-700">Telegram:</span>{' '}
            <span className="text-gray-600">@{entry.telegram}</span>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b mb-6">
          <div>
            <h1 className="text-xl font-light text-gray-800">APPICS Instagram Assistant</h1>
            <p className="text-sm text-gray-500">Bounty Campaign Data Helper</p>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Files
          </Button>
        </div>

        {/* Chat Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 scroll-smooth"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>

                {/* Display structured data if available */}
                {message.data?.results && message.data.results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Results
                      </p>
                      {message.data.total_found && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {message.data.total_found} found
                        </span>
                      )}
                    </div>
                    <div className="space-y-2  overflow-y-auto">
                      {message.data.results.map((entry, index) => renderEntryCard(entry, index))}
                    </div>
                  </div>
                )}

                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Processing your query...</span>
                </div>
              </div>
            </div>
          )}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="relative">
            {/* Suggested Messages */}
            <div className="absolute -top-10 left-4 right-0 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setInput('Show all Instagram links')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Instagram links
              </button>
              <button
                onClick={() => setInput('Sort by date')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Sort by date
              </button>
              <button
                onClick={() => setInput('Get all email addresses')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Email addresses
              </button>
              <button
                onClick={() => setInput('Show Telegram IDs')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Telegram IDs
              </button>
              <button
                onClick={() => setInput('Who submitted first?')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                First submission
              </button>
              <button
                onClick={() => setInput('Count total entries')}
                className="flex-shrink-0 px-3 py-1.5 shadow opacity-75 hover:opacity-100 cursor-pointer text-xs bg-white/30 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Total count
              </button>
            </div>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Instagram entries, dates, emails, Telegram IDs..."
              className="w-full rounded-2xl border-0 bg-white shadow-lg pl-4 pr-20 py-8 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="rounded-full cursor-pointer p-4 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
