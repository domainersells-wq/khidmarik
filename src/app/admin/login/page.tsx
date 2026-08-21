
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ShieldCheck, LogIn, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (typeof window !== 'undefined') {
    document.title = 'Admin Login | Khidmatik';
  }

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    setIsLoading(false);

    if (!success) {
      toast({
        title: "Admin Login Failed",
        description: "Invalid administrator credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40 py-12">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl font-headline">Khidmatik Site Administration</CardTitle>
          <CardDescription>Secure login for authorized personnel only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <Label htmlFor="admin-email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Administrator Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Administrator Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3" disabled={isLoading}>
              {isLoading ? 'Logging In...' : <><LogIn className="mr-2 h-5 w-5" /> Log In to Admin Panel</>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center px-6 py-4">
          <Link href="/" passHref>
            <Button variant="link" className="text-sm">
              &larr; Back to Main Site
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
