import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'self';

export const useSocial = (targetUser: User | null | undefined) => {
  const { user: authUser } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!authUser || !targetUser) return;

    if (authUser._id === targetUser._id) {
      setConnectionStatus('self');
      return;
    }

    setLoading(true);
    try {
      // Fetch fresh auth user to get latest connections/following
      // This is a bit inefficient (N+1), but simple for now. 
      // Optimization: Cache or update auth context.
      const freshAuth = await api.get<User>(`/users/${authUser._id}`);

      if (targetUser.userType === 'organization') {
        const followingIds = freshAuth.following?.map((u: string | User) => typeof u === 'string' ? u : u._id) || [];
        setIsFollowing(followingIds.includes(targetUser._id));
      } else {
        const connectionIds = freshAuth.connections?.map((u: string | User) => typeof u === 'string' ? u : u._id) || [];
        if (connectionIds.includes(targetUser._id)) {
          setConnectionStatus('accepted');
        } else {
          setConnectionStatus('none');
          // We'd need to check 'pending' status via a specific endpoint or by checking sent requests.
          // For now, assuming 'none' if not accepted.
        }
      }
    } catch (err) {
      console.error("Error checking social status:", err);
    } finally {
      setLoading(false);
    }
  }, [authUser, targetUser]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleConnect = async () => {
    if (!authUser || !targetUser) return;
    setLoading(true);
    try {
      await api.post('/users/request-connection', { recipientId: targetUser._id });
      setConnectionStatus('pending'); // Optimistic
      alert("Connection request sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!authUser || !targetUser) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await api.post('/users/unfollow-rso', { rsoId: targetUser._id });
        setIsFollowing(false);
      } else {
        await api.post('/users/follow-rso', { rsoId: targetUser._id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  return {
    connectionStatus,
    isFollowing,
    loading,
    handleConnect,
    handleFollow,
    refresh: checkStatus
  };
};
