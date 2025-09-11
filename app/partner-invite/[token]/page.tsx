'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle, Heart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerInvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function PartnerInvitePage({ params }: PartnerInvitePageProps) {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'unauthorized'>('loading');
  const [message, setMessage] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const router = useRouter();
  
  // Extract token from params
  React.useEffect(() => {
    params.then(resolvedParams => {
      setToken(resolvedParams.token);
    });
  }, [params]);

  const acceptInvitation = async () => {
    if (!token) return;
    
    setIsAccepting(true);
    
    try {
      const response = await fetch('/api/partner/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`You are now budget partners with ${data.partnership?.fromUser?.name || 'your partner'}!`);
        toast.success('Partnership accepted successfully!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        if (response.status === 410 || data.error?.includes('expired')) {
          setStatus('expired');
          setMessage('This invitation has expired. Please ask for a new invitation.');
        } else if (response.status === 403) {
          setStatus('unauthorized');
          setMessage('You need to be signed in to accept this invitation.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to accept invitation.');
        }
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage('An unexpected error occurred.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsAccepting(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Heart className="h-12 w-12 text-pink-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'expired':
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
      case 'error':
      case 'unauthorized':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Budget Partner Invitation';
      case 'success':
        return `Welcome to partnership!`;
      case 'expired':
        return 'Invitation Expired';
      case 'unauthorized':
        return 'Sign In Required';
      case 'error':
        return 'Something Went Wrong';
      default:
        return 'Budget Partner Invitation';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl text-white">{getStatusTitle()}</CardTitle>
          <CardDescription className="text-slate-400">
            {status === 'loading' && 'You&apos;ve been invited to become budget partners'}
            {status === 'success' && 'You can now manage your finances together'}
            {status === 'expired' && 'Please ask for a new invitation'}
            {status === 'unauthorized' && 'Please sign in with your account'}
            {status === 'error' && 'Please try again or contact support'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {message && (
            <p className="text-sm text-slate-300">
              {message}
            </p>
          )}
          
          {status === 'loading' && token && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  As budget partners, you&apos;ll share:
                </h3>
                <ul className="text-sm text-slate-300 space-y-1 text-left">
                  <li>• All transactions and expenses</li>
                  <li>• Categories and budget goals</li>
                  <li>• Monthly financial overview</li>
                  <li>• Spending insights together</li>
                </ul>
              </div>
              
              <Button 
                onClick={acceptInvitation} 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Accept Partnership
                  </>
                )}
              </Button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-400">
                  Redirecting you to your shared dashboard...
                </p>
              </div>
            </div>
          )}
          
          {(status === 'error' || status === 'expired' || status === 'unauthorized') && (
            <Button 
              onClick={() => router.push('/login')} 
              variant="outline" 
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Go to Sign In
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}