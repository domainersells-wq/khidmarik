'use client';

import React, { useState, useEffect } from 'react';
import { ThinkingOrbs } from './ThinkingOrbs';
import { ActivityState, OrbSize } from './types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import * as LucideIcons from 'lucide-react';

const allStates: { id: ActivityState; labelAr: string; labelEn: string; icon: any }[] = [
  { id: 'thinking', labelAr: 'تفكير وتحليل', labelEn: 'Thinking', icon: LucideIcons.Brain },
  { id: 'searching', labelAr: 'بحث واسترجاع', labelEn: 'Searching', icon: LucideIcons.Search },
  { id: 'solving', labelAr: 'معالجة وتركيب', labelEn: 'Solving', icon: LucideIcons.Puzzle },
  { id: 'composing', labelAr: 'صياغة وإعداد', labelEn: 'Composing', icon: LucideIcons.PenTool },
  { id: 'listening', labelAr: 'استماع صوتي', labelEn: 'Listening', icon: LucideIcons.Headphones },
  { id: 'loading', labelAr: 'تحميل قياسي', labelEn: 'Loading', icon: LucideIcons.Loader2 },
  { id: 'success', labelAr: 'اكتمال بنجاح', labelEn: 'Success', icon: LucideIcons.CheckCircle2 },
  { id: 'error', labelAr: 'حالة خطأ', labelEn: 'Error', icon: LucideIcons.AlertTriangle },
  { id: 'idle', labelAr: 'وضع السكون', labelEn: 'Idle', icon: LucideIcons.PauseCircle },
];

export const ThinkingOrbsShowcase: React.FC = () => {
  const [selectedState, setSelectedState] = useState<ActivityState>('thinking');
  const [selectedSize, setSelectedSize] = useState<OrbSize>('md');
  const [audioLevel, setAudioLevel] = useState<number>(0.6);
  const [isAutoTransitioning, setIsAutoTransitioning] = useState(false);

  // Simulated AI Agent Flow: Thinking -> Searching -> Solving -> Composing -> Success
  useEffect(() => {
    if (!isAutoTransitioning) return;

    const flow: ActivityState[] = ['thinking', 'searching', 'solving', 'composing', 'success'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % flow.length;
      setSelectedState(flow[currentIndex]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isAutoTransitioning]);

  return (
    <Card className="w-full max-w-3xl border border-border/80 shadow-xl bg-card/90 backdrop-blur-xl rounded-3xl overflow-hidden text-foreground">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LucideIcons.Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2">
                نظام Thinking Orbs التفاعلي
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  AI-Ready UI
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                مؤشرات بصرية حديثة لحالات التحميل، الاستماع، والتفكير الذكي
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            variant={isAutoTransitioning ? 'default' : 'outline'}
            onClick={() => setIsAutoTransitioning(!isAutoTransitioning)}
            className="text-xs h-8 rounded-xl font-bold gap-1.5"
          >
            <LucideIcons.PlayCircle className="h-3.5 w-3.5" />
            {isAutoTransitioning ? 'إيقاف دورة المحاكاة' : 'تشغيل محاكاة Agent Workflow'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Main Interactive Stage */}
        <div className="min-h-[220px] rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/60 flex flex-col items-center justify-center p-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <ThinkingOrbs
            state={selectedState}
            size={selectedSize}
            audioLevel={selectedState === 'listening' ? audioLevel : 0}
            action={
              selectedState === 'error' ? (
                <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg" onClick={() => setSelectedState('thinking')}>
                  إعادة المحاولة / Retry
                </Button>
              ) : undefined
            }
          />
        </div>

        {/* State Selection Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground block">اختر الحالة البصرية (Activity State):</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {allStates.map((st) => {
              const IconComp = st.icon;
              const isSelected = selectedState === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setIsAutoTransitioning(false);
                    setSelectedState(st.id);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all select-none ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                      : 'bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/70'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span className="truncate text-[11px]">{st.labelAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size & Options Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">الحجم (Size):</label>
            <div className="flex items-center gap-2">
              {(['sm', 'md', 'lg'] as OrbSize[]).map((sz) => (
                <Button
                  key={sz}
                  size="sm"
                  variant={selectedSize === sz ? 'default' : 'outline'}
                  onClick={() => setSelectedSize(sz)}
                  className="flex-1 text-xs h-8 rounded-xl font-bold uppercase"
                >
                  {sz === 'sm' ? 'Small (الأزرار)' : sz === 'md' ? 'Medium (النوافذ)' : 'Large (الصفحات)'}
                </Button>
              ))}
            </div>
          </div>

          {selectedState === 'listening' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">تفاعل مستوى الصوت (Audio Level):</span>
                <span className="font-mono font-bold text-primary">{Math.round(audioLevel * 100)}%</span>
              </div>
              <Slider
                value={[audioLevel]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(val) => setAudioLevel(val[0])}
                className="py-1"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
