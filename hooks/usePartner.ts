import { useQuery, useQueryClient } from '@tanstack/react-query';

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

export function usePartnerInfo() {
  return useQuery<PartnerInfo>({
    queryKey: ['partner-info'],
    queryFn: async () => {
      const response = await fetch('/api/partner/info');
      if (!response.ok) {
        throw new Error('Failed to fetch partner info');
      }
      return response.json();
    },
  });
}

export function usePartnerInvitations() {
  return useQuery<{ invitations: PartnerInvitation[] }>({
    queryKey: ['partner-invitations'],
    queryFn: async () => {
      const response = await fetch('/api/partner/invitations');
      if (!response.ok) {
        throw new Error('Failed to fetch partner invitations');
      }
      return response.json();
    },
  });
}

export function useSentPartnerInvitations() {
  return useQuery<{ invitations: (PartnerInvitation & { toUser: PartnerInvitation['fromUser'] })[] }>({
    queryKey: ['sent-partner-invitations'],
    queryFn: async () => {
      const response = await fetch('/api/partner/sent-invitations');
      if (!response.ok) {
        throw new Error('Failed to fetch sent partner invitations');
      }
      return response.json();
    },
  });
}

export function useRefreshPartnerInfo() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['partner-info'] });
    queryClient.invalidateQueries({ queryKey: ['partner-invitations'] });
    queryClient.invalidateQueries({ queryKey: ['sent-partner-invitations'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}