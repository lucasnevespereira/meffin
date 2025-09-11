'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, Check, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useI18n } from '@/locales/client';

type PartnerInvitation = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

interface PartnerInvitationCardProps {
  invitation: PartnerInvitation;
  onUpdate: () => void;
}

const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

const getAvatarUrl = (user: { name?: string; email?: string; image?: string }): string => {
  if (user.image) return user.image;
  return generateFallbackAvatarUrl(user.name || user.email || 'user');
};

export default function PartnerInvitationCard({ invitation, onUpdate }: PartnerInvitationCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const t = useI18n();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch('/api/partner/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitation.token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Partnership accepted!', {
          description: `You are now budget partners with ${invitation.fromUser.name}.`,
        });
        onUpdate();
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to accept invitation',
        });
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const response = await fetch('/api/partner/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitation.token }),
      });

      if (response.ok) {
        toast.success('Invitation declined');
        onUpdate();
      } else {
        const data = await response.json();
        toast.error('Error', {
          description: data.error || 'Failed to decline invitation',
        });
      }
    } catch (error) {
      console.error('Decline invitation error:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setIsDeclining(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatExpiresIn = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return `${diffDays} days`;
    } else if (diffDays === 1) {
      return '1 day';
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Heart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('partner_invitation_title')}</h3>
              <p className="text-xs text-muted-foreground font-medium">
                {t('partner_collaborative_budget')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border">
                <Image
                  src={getAvatarUrl(invitation.fromUser)}
                  alt={invitation.fromUser.name || 'User Avatar'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-foreground mb-1">
                {invitation.fromUser.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {invitation.fromUser.email}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {t('partner_wants_to_share')}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{t('partner_received_time', { time: formatTimeAgo(invitation.createdAt) })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>•</span>
              <span>{t('partner_expires_in', { time: formatExpiresIn(invitation.expiresAt) })}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-medium h-11"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('partner_accepting')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('partner_accept_partnership')}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="flex-1 rounded-xl font-medium h-11 border-border hover:border-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
            >
              {isDeclining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('partner_declining')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('partner_decline')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}