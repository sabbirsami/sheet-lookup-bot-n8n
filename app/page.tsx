'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Send } from 'lucide-react';
import { useState } from 'react';

interface InstagramEntry {
  date: string;
  instagram: string;
  email: string;
  telegram: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  entries?: InstagramEntry[];
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        'Hello! I can help you query Instagram entries from your Google Sheet. Ask me about dates, emails, Telegram IDs, or request a list of entries.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      // Replace with your actual n8n webhook URL
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
        content: data.content || 'I received your request and processed it.',
        entries: data.entries,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b mb-6">
          <h1 className="text-xl font-light text-gray-800">Instagram Entries Assistant</h1>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Files
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>

                {/* Display Instagram entries if available */}
                {message.entries && message.entries.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Instagram Entries ({message.entries.length})
                    </p>
                    {message.entries.map((entry, index) => (
                      <Card key={index} className="p-3 bg-gray-50">
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="font-medium">Date:</span> {entry.date}
                          </div>
                          <div>
                            <span className="font-medium">Instagram:</span>
                            <a
                              href={entry.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-1"
                            >
                              {entry.instagram}
                            </a>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {entry.email}
                          </div>
                          <div>
                            <span className="font-medium">Telegram:</span> @{entry.telegram}
                          </div>
                        </div>
                      </Card>
                    ))}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Instagram entries..."
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
