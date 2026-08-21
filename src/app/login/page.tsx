'use client';

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, EyeOff, Eye, LogIn, UserPlus, KeyRound, User, Sparkles, Shield, Store, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GoogleIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 11.1h-9.2v2.7h5.3c-.2 1-1.5 3.2-5.3 3.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.8 0 3 .8 3.7 1.4l2.2-2.2C17.3 3.2 15 2 12.15 2c-5.4 0-9.8 4.4-9.8 9.8s4.4 9.8 9.8 9.8c5.5 0 9.5-3.9 9.5-9.5-.1-.7-.2-1.2-.3-1.7z"></path></svg>;
const FacebookIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.096 4.386 22.996 10.125 23.854V15.46H7.078V12.073h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.688.235 2.688.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.387h-2.796v8.39C19.614 22.996 24 18.096 24 12.073z"></path></svg>;
const LinkedInIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#0A66C2" d="M20.447 20.452h-3.554V13.001c0-1.806-.034-4.125-2.512-4.125-2.513 0-2.9 1.96-2.9 3.995v7.581h-3.556V8.891h3.424v1.57h.048c.477-.9 1.637-1.85 3.378-1.85 3.615 0 4.28 2.38 4.28 5.475v6.356zM4.902 7.337H4.85c-1.141 0-1.86-.79-1.86-1.783C3 .002 4.614 4.18 3.754 3.042c0 .993.719 1.784 1.86 1.784h.048c1.141 0 1.86-.79 1.86-1.783C6.772 4.18 6.043 3.042 4.902 3.042zm1.768 13.115H3.136V8.891h3.532v11.566z"></path></svg>;
const AppleIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M17.478 13.835c-.022 2.168 1.459 3.225 1.482 3.232c-.021.088-.396 1.476-1.27 2.8c-.822 1.232-1.646 2.547-2.913 2.581c-1.208.033-1.595-.793-2.992-.801c-1.397-.008-1.832.785-3.017.824c-1.233.039-2.225-1.29-3.098-2.637c-1.29-1.957-2.35-5.402-.929-7.911c.777-1.366 2.072-2.182 3.346-2.19c1.251-.008 2.412.928 3.186.928c.774 0 2.186-1.06 3.63-1.008c1.34.048 2.396.436 3.125 1.252c-1.31.802-2.155 2.073-2.018 3.455m-2.63-8.878c.65-.792 1.087-1.906.996-3.033c-.801.064-1.977.668-2.663 1.46c-.63.73-1.11 1.843-1.02 2.95c.88.128 2.046-.61 2.687-1.377"></path></svg>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (typeof window !== 'undefined') {
    document.title = activeTab === 'login' ? 'تسجيل الدخول | Khidmatik' : 'إنشاء حساب جديد | Khidmatik';
  }

  const handleSocialLogin = async (platform: string) => {
    setIsLoading(true);
    if (platform === 'Google') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast({ title: "Google Auth Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({
        title: `Connecting with ${platform}... (Conceptual)`,
        description: "Simulating social login. Minimal permissions requested.",
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      toast({
        title: `${platform} Login Successful (Conceptual)`,
        description: "You are now logged in!",
      });
    }
    setIsLoading(false);
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    if (activeTab === 'login') {
      await login(email, password);
    } else {
      await signUp(email, password, name);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-start py-8 min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-headline">
            {activeTab === 'login' ? 'مرحباً بك في خدماتك | Welcome' : 'إنشاء حساب جديد | Sign Up'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'login' 
              ? 'سجّل الدخول إلى حسابك للمتابعة' 
              : 'أنشئ حسابك الجديد للانضمام إلى منصة خدماتك'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="font-medium">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register" className="font-medium">إنشاء حساب</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Button onClick={() => handleSocialLogin('Google')} variant="outline" className="w-full justify-center text-sm py-3 h-11" type="button">
                <GoogleIcon />
              </Button>
              <Button onClick={() => handleSocialLogin('LinkedIn')} variant="outline" className="w-full justify-center text-sm py-3 h-11" type="button">
                <LinkedInIcon />
              </Button>
              <Button onClick={() => handleSocialLogin('Facebook')} variant="outline" className="w-full justify-center text-sm py-3 h-11" type="button">
                <FacebookIcon />
              </Button>
              <Button onClick={() => handleSocialLogin('Apple')} variant="outline" className="w-full justify-center text-sm py-3 h-11" type="button">
                <AppleIcon />
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  أو عبر البريد الإلكتروني
                </span>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div>
                  <Label htmlFor="name-auth" className="font-medium">الاسم الكامل / Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name-auth" 
                      type="text" 
                      placeholder="محمد علي" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                      className="pl-10 h-11 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email-auth" className="font-medium">البريد الإلكتروني / Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email-auth" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password-auth" className="font-medium">كلمة المرور / Password</Label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password-auth" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="pl-10 pr-10 h-11 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none border-none bg-transparent shadow-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 h-12 mt-2" disabled={isLoading}>
                {isLoading ? 'جاري المعالجة...' : activeTab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </Button>
            </form>
          </Tabs>
          
          <p className="text-xs text-muted-foreground text-center px-2">
            بالمتابعة، فإنك توافق على{' '}
            <Link href="/terms" className="underline hover:text-primary">شروط الاستخدام</Link> و{' '}
            <Link href="/privacy" className="underline hover:text-primary">سياسة الخصوصية</Link>.
          </p>

        </CardContent>
        <CardFooter className="px-6 py-4 flex flex-col items-center space-y-2">
           <Link href="/forgot-password" passHref>
              <Button variant="link" className="text-sm h-auto p-0">هل نسيت كلمة المرور؟</Button>
           </Link>
           <p className="text-sm text-muted-foreground">
            هل تريد تسجيل نشاطك التجاري؟{' '}
            <Link href="/register/choice" className="font-medium text-primary hover:underline">
              سجل كمقدم خدمة أو متجر
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
