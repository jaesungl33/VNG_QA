'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@vng-qa/api-client';
import { parseDirectives } from '@vng-qa/rag-core';
import type { Chat, ChatMessage, Workspace, RagRetrieveResponse, RagRetrievalResult } from '@vng-qa/shared';

// Extend ChatMessage to include retrieval context
interface ExtendedChatMessage extends ChatMessage {
  retrievalContext?: RagRetrievalResult[];
}
import { ArrowLeft, Plus, Send, MessageCircle, Hash } from 'lucide-react';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
      loadChats();
    } else {
      setLoading(false);
      setError('No workspace selected. Please select a workspace first.');
    }
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadWorkspace = async () => {
    if (!workspaceId) return;
    try {
      const data = await apiClient.getWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      console.error('Error loading workspace:', err);
    }
  };

  const loadChats = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await apiClient.getChats(workspaceId);
      setChats(data);
    } catch (err) {
      setError('Failed to load chats. Make sure the API is running.');
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    if (!workspaceId) return;
    try {
      const data = await apiClient.getChatMessages(workspaceId, chatId);
      setMessages(data as ExtendedChatMessage[]);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const selectChat = async (chat: Chat) => {
    setCurrentChat(chat);
    await loadChatMessages(chat.id);
  };

  const createChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newChatTitle.trim()) return;

    try {
      setCreatingChat(true);
      const chat = await apiClient.createChat(workspaceId, {
        workspace_id: workspaceId,
        title: newChatTitle.trim(),
      });
      setChats(prev => [...prev, chat]);
      setNewChatTitle('');
      setCurrentChat(chat);
      setMessages([]);
    } catch (err) {
      setError('Failed to create chat.');
      console.error('Error creating chat:', err);
    } finally {
      setCreatingChat(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !currentChat || !newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chat_id: currentChat.id,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Parse directives
      const parsed = parseDirectives(messageContent);

      // Perform RAG retrieval if we have a workspace
      let retrievalResults: RagRetrievalResult[] = [];
      try {
        const ragResponse = await apiClient.ragRetrieve({
          workspace_id: workspaceId,
          query: parsed.cleanQuery || messageContent,
          scope: parsed.scope === 'both' ? 'both' : (parsed.scope === 'doc' ? 'doc' : 'codebase'),
          file_slugs: parsed.fileSlugs.length > 0 ? parsed.fileSlugs : undefined,
          top_k: 5,
        });
        retrievalResults = ragResponse.results;
      } catch (ragError) {
        console.warn('RAG retrieval failed, continuing without context:', ragError);
      }

      // Send message with directive context
      const assistantMessage = await apiClient.sendMessage(workspaceId, currentChat.id, messageContent);

      // Update messages with real data
      await loadChatMessages(currentChat.id);

      // Add retrieval results as context to the assistant message display
      if (retrievalResults.length > 0) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, retrievalContext: retrievalResults }
            : msg
        ));
      }
    } catch (err) {
      setError('Failed to send message.');
      console.error('Error sending message:', err);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chats...</div>
      </div>
    );
  }

  if (error && !workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/workspace">
                <Button>Select Workspace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-6 h-[calc(100vh-2rem)]">
          {/* Sidebar */}
          <div className="w-80 flex flex-col">
            <div className="mb-4">
              <Link href="/workspace">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Workspaces
                </Button>
              </Link>
              <h2 className="text-xl font-semibold">
                {workspace?.name || 'Workspace'}
              </h2>
            </div>

            {/* Create Chat */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createChat}>
                  <Input
                    placeholder="Chat title"
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    className="mb-2"
                  />
                  <Button type="submit" size="sm" disabled={creatingChat} className="w-full">
                    {creatingChat ? 'Creating...' : 'Create Chat'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Chats List */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Chats</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 px-6 pb-6">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                        currentChat?.id === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{chat.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                  {chats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No chats yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentChat ? (
              <>
                {/* Messages */}
                <Card className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      {currentChat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className="max-w-[80%]">
                            <div
                              className={`p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="text-xs mt-1 opacity-70">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </div>
                            </div>

                            {/* Show retrieval context for assistant messages */}
                            {message.role === 'assistant' && (message as ExtendedChatMessage).retrievalContext && (
                              <div className="mt-2 space-y-2">
                                <div className="text-xs text-gray-500 font-medium">Sources:</div>
                                {(message as ExtendedChatMessage).retrievalContext!.slice(0, 3).map((result, idx) => (
                                  <div key={idx} className="bg-gray-100 p-2 rounded text-xs">
                                    <div className="font-medium text-gray-700">
                                      {result.file_name} ({result.source_type})
                                    </div>
                                    <div className="text-gray-600 mt-1">
                                      {result.text.length > 100
                                        ? `${result.text.substring(0, 100)}...`
                                        : result.text
                                      }
                                    </div>
                                    <div className="text-gray-500 mt-1">
                                      Score: {(result.score * 100).toFixed(1)}%
                                      {result.line_start !== null && result.line_end !== null && (
                                        <span> • Lines {result.line_start}-{result.line_end}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <Input
                          placeholder="Type your message... (try @doc, @codebase, or @file.py)"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                          disabled={sending}
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a chat to start messaging
                  </h3>
                  <p className="text-gray-600">
                    Choose an existing chat from the sidebar or create a new one
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
