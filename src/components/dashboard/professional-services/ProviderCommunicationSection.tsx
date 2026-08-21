'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesSquare, Send, Archive, Search, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const defaultConversations = [
  {
    id: 'conv1', clientName: 'Amina B.', service: 'Project Alpha', archived: false,
    messages: [
      { id: 'm1', sender: 'me', text: 'Hello Amina, just checking in on Project Alpha.', time: '10:30 AM' },
      { id: 'm2', sender: 'client', text: 'Hi! Thanks for the quick response! Everything looks great so far.', time: '10:45 AM' },
      { id: 'm3', sender: 'me', text: 'Excellent! Let me know if you have any questions.', time: '11:00 AM' },
    ]
  },
  {
    id: 'conv2', clientName: 'Karim L.', service: 'Consulting Session', archived: false,
    messages: [
      { id: 'm4', sender: 'client', text: 'Can we schedule a follow-up call?', time: '2:00 PM' },
    ]
  },
  {
    id: 'conv3', clientName: 'Yasmine D.', service: 'Digital Audit', archived: false,
    messages: [
      { id: 'm5', sender: 'client', text: 'Payment sent. Please confirm.', time: '9:00 AM' },
    ]
  },
];

export function ProviderCommunicationSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length) setActiveConvId(parsed[0].id);
      } catch { setConversations(defaultConversations); setActiveConvId('conv1'); }
    } else {
      setConversations(defaultConversations);
      setActiveConvId('conv1');
      localStorage.setItem('khidmatik_conversations', JSON.stringify(defaultConversations));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, conversations]);

  const persist = (updated: any[]) => {
    setConversations(updated);
    localStorage.setItem('khidmatik_conversations', JSON.stringify(updated));
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConvId) return;
    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          messages: [...c.messages, { id: 'msg_' + Date.now(), sender: 'me', text: newMessage.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
        };
      }
      return c;
    });
    persist(updated);
    setNewMessage('');
    toast({ title: translate('messageSent', 'Message Sent') });
  };

  const handleArchive = (convId: string) => {
    const updated = conversations.map(c => c.id === convId ? { ...c, archived: !c.archived } : c);
    persist(updated);
    toast({ title: translate('conversationArchived', 'Conversation Updated') });
  };

  const filteredConversations = conversations.filter(c => {
    const matchSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArchived = showArchived ? c.archived : !c.archived;
    return matchSearch && matchArchived;
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <MessagesSquare className="mr-3 h-8 w-8 text-primary" /> {translate('clientCommunication', 'Client Communication')}
        </h1>
        <p className="text-muted-foreground">{translate('manageCommunication', 'Manage messages, track conversations, and stay connected with your clients.')}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>{translate('myConversations', 'My Conversations')}</CardTitle>
            <div className="flex gap-1 mt-1">
              <div className="relative flex-1">
                <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={translate('searchMessages', 'Search...')}
                  className="h-8 ps-7 text-xs"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant={showArchived ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setShowArchived(!showArchived)}>
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto p-2 space-y-2">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-3 rounded-md cursor-pointer hover:bg-muted/70 transition-colors ${conv.id === activeConvId ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conv.clientName}`} />
                      <AvatarFallback>{conv.clientName.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{conv.clientName}</span>
                  </div>
                  {conv.archived && <Badge variant="secondary" className="text-[10px] px-1">Archived</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{conv.messages[conv.messages.length - 1]?.text}</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">{conv.messages[conv.messages.length - 1]?.time} - {conv.service}</p>
              </div>
            ))}
            {filteredConversations.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{translate('noConversations', 'No conversations.')}</p>}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2 flex flex-col min-h-[500px]">
          <CardHeader className="flex flex-row justify-between items-center border-b py-3">
            <div>
              <CardTitle className="text-base">{activeConv ? `${activeConv.clientName} (${activeConv.service})` : translate('selectConversation', 'Select a conversation')}</CardTitle>
              <CardDescription className="text-xs">{translate('realtimeMessaging', 'Real-time messaging with your client.')}</CardDescription>
            </div>
            {activeConv && (
              <Button variant="ghost" size="icon" onClick={() => handleArchive(activeConv.id)} title={activeConv.archived ? 'Unarchive' : 'Archive'}>
                <Archive className="h-5 w-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-3 bg-background">
            {activeConv ? (
              <>
                {activeConv.messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-lg max-w-[70%] text-sm ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.text}
                      <span className="block text-[10px] opacity-70 mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <p className="text-muted-foreground text-center py-12">{translate('selectConversation', 'Select a conversation to start messaging.')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t p-3">
            <div className="flex w-full items-center gap-2">
              <Textarea
                placeholder={translate('typeMessage', 'Type your message...')}
                className="flex-grow resize-none h-10 min-h-[40px]"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!activeConv}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={!activeConv || !newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
