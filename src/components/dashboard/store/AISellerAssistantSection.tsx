
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Lightbulb, MessageSquare, BarChart3, Languages, AlertTriangle, CalendarDays, TrendingDown, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function AISellerAssistantSection() {
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState('');

  const handleAIAction = (action: string, params?: any) => {
    toast({
      title: `AI Assistant: ${action} (Conceptual)`,
      description: params ? `Processing: ${JSON.stringify(params)}` : `This would trigger the AI ${action.toLowerCase()} feature.`,
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleAIAction("Chat Query", { query: chatInput });
    // Conceptual: Add user query and AI response to a chat log
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Sparkles className="mr-3 h-8 w-8 text-primary" /> AI Seller Assistant
        </h1>
        <p className="text-muted-foreground">Your smart partner for optimizing your store and sales.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/>Smart Optimizations</CardTitle>
          <CardDescription>Let AI help improve your product listings and sales performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-md bg-muted/30">
            <h4 className="font-semibold">Product Title & Description Optimization</h4>
            <p className="text-xs text-muted-foreground mb-2">Select a product (conceptual) and get AI suggestions to enhance its appeal and SEO.</p>
            <Button variant="outline" size="sm" onClick={() => handleAIAction("Optimize Product Listing")} disabled>Optimize Listing</Button>
          </div>
          <div className="p-3 border rounded-md bg-muted/30">
            <h4 className="font-semibold">Pricing & Image Suggestions</h4>
            <p className="text-xs text-muted-foreground mb-2">AI analyzes market trends and similar products to suggest optimal pricing or image improvements.</p>
            <Button variant="outline" size="sm" onClick={() => handleAIAction("Get Pricing/Image Suggestions")} disabled>Get Suggestions</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Automated Communication</CardTitle>
          <CardDescription>Save time with AI-generated replies for reviews and common support messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/30">
                <h4 className="font-semibold">Auto-Generated Review Replies</h4>
                <p className="text-xs text-muted-foreground mb-2">AI drafts replies to customer reviews. You can approve or edit before posting.</p>
                <Button variant="outline" size="sm" onClick={() => handleAIAction("Manage AI Review Replies")} disabled>Configure Review Replies</Button>
            </div>
            <div className="p-3 border rounded-md bg-muted/30">
                <h4 className="font-semibold">Smart Support Message Templates</h4>
                <p className="text-xs text-muted-foreground mb-2">AI suggests templates for frequently asked questions or support issues.</p>
                <Button variant="outline" size="sm" onClick={() => handleAIAction("Manage AI Support Templates")} disabled>View Support Templates</Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Performance Insights & Alerts</CardTitle>
            <CardDescription>Receive smart alerts and monthly performance reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/30 flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">Smart Alerts</h4>
                    <p className="text-xs text-muted-foreground">Get notified of performance drops or seasonal opportunities.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleAIAction("View Smart Alerts")} disabled><AlertTriangle className="h-5 w-5 text-destructive"/></Button>
            </div>
            <div className="p-3 border rounded-md bg-muted/30 flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">Monthly Smart Performance Reports</h4>
                    <p className="text-xs text-muted-foreground">Receive AI-generated reports with improvement tips.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleAIAction("View Performance Reports")} disabled><CalendarDays className="h-5 w-5"/></Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Languages className="mr-2 h-5 w-5 text-primary"/>Bilingual Content Generation</CardTitle>
          <CardDescription>AI can help generate product descriptions and marketing content in Arabic & English.</CardDescription>
        </CardHeader>
        <CardContent>
            <Textarea placeholder="Enter text to translate or generate content for..." rows={3} disabled/>
            <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => handleAIAction("Generate Bilingual Content")} disabled>Generate Content (AR/EN)</Button>
            </div>
        </CardContent>
      </Card>

      <Card className="sticky bottom-4 z-10 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Chat with AI Assistant</CardTitle>
          <CardDescription>Ask questions like "How can I increase sales for Product X?" or "Suggest marketing ideas for Ramadan."</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted/50 rounded-md p-2 overflow-y-auto text-xs text-muted-foreground mb-2">
            {/* Conceptual chat log */}
            <p><strong className="text-primary">AI:</strong> Hello! How can I help you optimize your store today?</p>
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question here..." 
            />
            <Button type="submit" disabled={!chatInput.trim()}><Send className="h-4 w-4"/></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
