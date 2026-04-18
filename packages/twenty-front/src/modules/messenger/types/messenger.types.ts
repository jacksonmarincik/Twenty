export type MessengerUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  status?: string;
};

export type MessengerChannel = {
  id: string;
  name: string;
  type: 'public' | 'private' | 'announcement' | string;
  created_by?: string | null;
  created_at?: string;
  last_message_at?: string | null;
  unread_count?: number;
};

export type MessengerChannelMember = {
  user_id: string;
  name?: string;
  email?: string;
  role?: string;
};

export type MessengerDMThread = {
  id: string;
  user1_id: string;
  user2_id: string;
  other_user?: { id: string; name: string; email: string };
  last_message_at?: string | null;
  unread_count?: number;
};

export type MessengerMessage = {
  id: string;
  channel_id?: string | null;
  thread_id?: string | null;
  sender_id: string;
  sender_name?: string;
  body: string;
  image_url?: string | null;
  is_system?: boolean;
  created_at: string;
};

export type MessengerConversationRef =
  | { kind: 'channel'; channelId: string }
  | { kind: 'dm'; threadId: string; otherUserId?: string };
