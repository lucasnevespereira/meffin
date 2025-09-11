'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  Users2, 
  Search, 
  UserPlus, 
  X, 
  Heart, 
  Loader2, 
  AlertTriangle,
  Send,
  UserX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useI18n } from '@/locales/client';

type UserSearchResult = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

type PartnerInfo = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    partnerId?: string;
  };
  partner: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
};

const searchSchema = z.object({
  query: z.string().min(2, 'Entrez au moins 2 caractères pour rechercher'),
});

type SearchFormData = {
  query: string;
};

// Generate a fallback avatar URL based on user's name or email using initials
const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

// Get the best available avatar URL
const getAvatarUrl = (user: { name?: string; email?: string; image?: string }): string => {
  if (user.image) return user.image;
  return generateFallbackAvatarUrl(user.name || user.email || 'user');
};

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

interface PartnerManagementProps {
  partnerInfo?: PartnerInfo;
  sentInvitations?: SentInvitation[];
  onPartnerUpdate?: () => void;
}

export default function PartnerManagement({ partnerInfo, sentInvitations, onPartnerUpdate }: PartnerManagementProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const t = useI18n();

  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const searchQuery = watch('query');

  // Search for users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/partner/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.users || []);
      } else {
        toast.error('Erreur lors de la recherche');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Send invitation
  const sendInvitation = async (userId: string) => {
    setIsInviting(true);
    try {
      const response = await fetch('/api/partner/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toUserId: userId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitation envoyée!', {
          description: 'Votre partenaire recevra un email d\'invitation.',
        });
        setShowInviteDialog(false);
        reset();
        setSearchResults([]);
        setSelectedUser(null);
        onPartnerUpdate?.();
      } else {
        toast.error('Erreur', {
          description: data.error || 'Impossible d\'envoyer l\'invitation',
        });
      }
    } catch (error) {
      console.error('Invitation error:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  // Remove partnership
  const removePartnership = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch('/api/partner/remove', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Partenariat supprimé', {
          description: 'Vous n\'êtes plus partenaires budgétaires.',
        });
        setShowRemoveDialog(false);
        onPartnerUpdate?.();
      } else {
        const data = await response.json();
        toast.error('Erreur', {
          description: data.error || 'Impossible de supprimer le partenariat',
        });
      }
    } catch (error) {
      console.error('Remove partnership error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      {/* Partner Section */}
      <div className="rounded-lg md:rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <Users2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{t('partner_budget_title')}</h2>
          </div>

          {partnerInfo?.partner ? (
            // Has Partner
            <div className="space-y-4">
              {/* Partner Card */}
              <div className="relative p-6 rounded-xl border border-border bg-gradient-to-r from-emerald-50/30 via-transparent to-transparent dark:from-emerald-950/10 dark:via-transparent dark:to-transparent">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border-2 border-emerald-200 dark:border-emerald-800/50">
                      <Image
                        src={getAvatarUrl(partnerInfo.partner)}
                        alt={partnerInfo.partner.name || 'Partner Avatar'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Heart className="h-2.5 w-2.5 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        {t('partner_active_status')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground truncate mb-0.5">
                      {partnerInfo.partner.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {partnerInfo.partner.email}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/20">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    <strong>{t('partner_shared_budget')}</strong> • {t('partner_shared_description')}
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {t('partner_stop_sharing')}
                  </Button>
                </div>
              </div>
            </div>
          ) : sentInvitations && sentInvitations.length > 0 ? (
            // Has sent invitations - don't show invite button
            null
          ) : (
            // No Partner and no sent invitations
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                <Users2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('partner_no_partner_title')}
              </h3>
              
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
                {t('partner_no_partner_description')}
              </p>

              <Button
                onClick={() => setShowInviteDialog(true)}
                className="px-8 py-2.5 rounded-xl font-medium"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('partner_invite_button')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="text-left space-y-3">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {t('partner_invite_title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground leading-relaxed">
              {t('partner_invite_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('partner_search_label')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('partner_search_placeholder')}
                  className="pl-10 h-11 rounded-xl border-border focus:border-blue-500 focus:ring-blue-500/20"
                  {...register('query')}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {errors.query && (
                <p className="text-sm text-destructive">{errors.query.message}</p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                <Label className="text-sm font-medium text-muted-foreground">{t('partner_search_results')}</Label>
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedUser?.id === user.id
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 ring-1 ring-blue-200 dark:ring-blue-800/50'
                          : 'hover:bg-muted/50 border-border hover:border-border'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        <Image
                          src={getAvatarUrl(user)}
                          alt={user.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t('partner_no_results', { query: searchQuery })}
              </div>
            )}

            {selectedUser && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg mb-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={getAvatarUrl(selectedUser)}
                      alt={selectedUser.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      reset();
                    }}
                    className="flex-1 h-11 rounded-xl font-medium border-border"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('common_cancel')}
                  </Button>
                  <Button
                    onClick={() => sendInvitation(selectedUser.id)}
                    disabled={isInviting}
                    className="flex-1 h-11 rounded-xl font-medium bg-foreground hover:bg-foreground/90 text-background"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('partner_sending')}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('partner_send_invitation')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Partnership Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('partner_remove_dialog_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {t('partner_remove_dialog_description', { name: partnerInfo?.partner?.name || '' })}
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {t('partner_remove_dialog_warning')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={removePartnership}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('partner_removing')}
                </>
              ) : (
                t('partner_confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}