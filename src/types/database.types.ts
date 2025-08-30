export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          full_name: string | null
          bio: string | null
        }
        Insert: {
          id?: string
          username?: string | null
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          full_name?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          full_name?: string | null
          bio?: string | null
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
          invite_code: string
          description: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
          invite_code: string
          description?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          invite_code?: string
          description?: string | null
          avatar_url?: string | null
        }
      }
      challenges: {
        Row: {
          id: string
          creator_id: string
          group_id: string
          title: string
          description: string | null
          deadline: string | null
          created_at: string
          updated_at: string
          status: 'active' | 'completed' | 'expired'
          category: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          group_id: string
          title: string
          description?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'completed' | 'expired'
          category?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          group_id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'completed' | 'expired'
          category?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
