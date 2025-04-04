"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Login attempt started');
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Supabase auth response:', {
        hasSession: !!data?.session,
        hasError: !!error,
        userId: data?.session?.user?.id
      });

      if (error) throw error;

      if (data?.session) {
        // Get redirect path
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";
        console.log('📍 Redirect path:', redirectTo);
        console.log('🔑 Session token exists:', !!data.session.access_token);
        
        // Verify session is properly set
        const verifySession = await supabase.auth.getSession();
        console.log('🔍 Verifying session:', {
          hasVerifiedSession: !!verifySession.data.session,
          sessionMatch: verifySession.data.session?.user?.id === data.session.user.id
        });

        // Only navigate if session is verified
        if (verifySession.data.session) {
          console.log('🚀 Session verified, attempting navigation to:', redirectTo);
          router.push(redirectTo);
          console.log('✈️ Navigation called');
        } else {
          console.error('❌ Session verification failed');
          setError("Session verification failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.message || "Failed to sign in");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              href="/register" 
              className="underline hover:text-primary"
            >
              Register
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link 
              href="/reset-password" 
              className="underline hover:text-primary"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 