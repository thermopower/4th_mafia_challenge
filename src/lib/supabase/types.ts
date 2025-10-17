export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          profile_image_url: string;
          account_status: 'active' | 'inactive' | 'suspended' | 'withdrawn';
          terms_agreed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          profile_image_url?: string;
          account_status?: 'active' | 'inactive' | 'suspended' | 'withdrawn';
          terms_agreed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          profile_image_url?: string;
          account_status?: 'active' | 'inactive' | 'suspended' | 'withdrawn';
          terms_agreed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          room_type: 'direct' | 'group';
          name: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_type: 'direct' | 'group';
          name?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_type?: 'direct' | 'group';
          name?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_members: {
        Row: {
          id: string;
          chat_room_id: string;
          user_id: string;
          joined_at: string;
          last_read_message_id: string | null;
          last_read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_room_id: string;
          user_id: string;
          joined_at?: string;
          last_read_message_id?: string | null;
          last_read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_room_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_message_id?: string | null;
          last_read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_direct_pairs: {
        Row: {
          chat_room_id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          chat_room_id: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          chat_room_id?: string;
          user_a_id?: string;
          user_b_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_room_id: string;
          sender_id: string;
          message_type: 'text' | 'emoji' | 'file' | 'system';
          content: string | null;
          reply_to_message_id: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_room_id: string;
          sender_id: string;
          message_type: 'text' | 'emoji' | 'file' | 'system';
          content?: string | null;
          reply_to_message_id?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_room_id?: string;
          sender_id?: string;
          message_type?: 'text' | 'emoji' | 'file' | 'system';
          content?: string | null;
          reply_to_message_id?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_attachments: {
        Row: {
          id: string;
          message_id: string;
          file_url: string;
          file_type: string;
          file_size_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          file_url: string;
          file_type: string;
          file_size_bytes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          file_url?: string;
          file_type?: string;
          file_size_bytes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          reaction_type: 'like' | 'bookmark' | 'empathy';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          reaction_type: 'like' | 'bookmark' | 'empathy';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          message_id?: string;
          user_id?: string;
          reaction_type?: 'like' | 'bookmark' | 'empathy';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
