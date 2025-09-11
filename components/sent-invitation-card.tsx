'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Clock, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useI18n } from '@/locales/client';

type SentInvitation = {
  id: string;
  token: string;
  status?: string;
  createdAt: string;
  expiresAt: string;
  toUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

interface SentInvitationCardProps {
  invitation: SentInvitation;
  onUpdate: () => void;
}

const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

const getAvatarUrl = (user: { name?: string; email?: string; image?: string }): string => {
  if (user.image) return user.image;
  return generateFallbackAvatarUrl(user.name || user.email || 'user');
};

export default function SentInvitationCard({ invitation, onUpdate }: SentInvitationCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const t = useI18n();

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/partner/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId: invitation.id }),
      });

      if (response.ok) {
        toast.success(t('partner_invitation_sent'));
        onUpdate();
      } else {
        const data = await response.json();
        toast.error('Error', {
          description: data.error || 'Failed to cancel invitation',
        });
      }
    } catch (error) {
      console.error('Cancel invitation error:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setIsCancelling(false);
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
      return 'Just sent';
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('partner_invitation_sent')}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('partner_waiting_response')}
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
              {t('partner_pending_status')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border">
                <Image
                  src={getAvatarUrl(invitation.toUser)}
                  alt={invitation.toUser.name || 'User Avatar'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground rounded-full flex items-center justify-center">
                <Clock className="h-2.5 w-2.5 text-background" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-foreground mb-1">
                {invitation.toUser.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {invitation.toUser.email}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {t('partner_invitation_processing')}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{t('partner_sent_time').replace('{time}', formatTimeAgo(invitation.createdAt))}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>•</span>
              <span>{t('partner_expires_in').replace('{time}', formatExpiresIn(invitation.expiresAt))}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
              className="rounded-xl font-medium h-10 border-border hover:border-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('partner_cancelling')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('partner_cancel_invitation')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}