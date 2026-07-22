export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          external_url: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          show_in_nav: boolean
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          external_url?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          show_in_nav?: boolean
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          external_url?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          show_in_nav?: boolean
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_content: {
        Row: {
          content_type: string
          created_at: string
          data: Json
          date: string
          id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          data?: Json
          date: string
          id?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          data?: Json
          date?: string
          id?: string
        }
        Relationships: []
      }
      dictionary_words: {
        Row: {
          antonyms: string[] | null
          created_at: string
          example: string | null
          extra: Json | null
          id: string
          language: string
          meaning_bn: string | null
          meaning_en: string | null
          part_of_speech: string | null
          pronunciation: string | null
          source_name: string | null
          source_url: string | null
          synonyms: string[] | null
          updated_at: string
          word: string
          word_normalized: string
        }
        Insert: {
          antonyms?: string[] | null
          created_at?: string
          example?: string | null
          extra?: Json | null
          id?: string
          language?: string
          meaning_bn?: string | null
          meaning_en?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          source_name?: string | null
          source_url?: string | null
          synonyms?: string[] | null
          updated_at?: string
          word: string
          word_normalized: string
        }
        Update: {
          antonyms?: string[] | null
          created_at?: string
          example?: string | null
          extra?: Json | null
          id?: string
          language?: string
          meaning_bn?: string | null
          meaning_en?: string | null
          part_of_speech?: string | null
          pronunciation?: string | null
          source_name?: string | null
          source_url?: string | null
          synonyms?: string[] | null
          updated_at?: string
          word?: string
          word_normalized?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          bn_name: string
          division_id: string
          id: string
          name: string
        }
        Insert: {
          bn_name: string
          division_id: string
          id?: string
          name: string
        }
        Update: {
          bn_name?: string
          division_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          bn_name: string
          id: string
          name: string
        }
        Insert: {
          bn_name: string
          id?: string
          name: string
        }
        Update: {
          bn_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      ebooks: {
        Row: {
          author: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          download_count: number
          file_path: string | null
          file_size: number | null
          id: string
          is_public: boolean
          language: string | null
          pages: number | null
          pdf_url: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean
          language?: string | null
          pages?: number | null
          pdf_url: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean
          language?: string | null
          pages?: number | null
          pdf_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      historical_events: {
        Row: {
          category: string
          created_at: string
          event: string
          event_date: string
          id: string
          source_url: string | null
          year: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          event: string
          event_date: string
          id?: string
          source_url?: string | null
          year?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          event?: string
          event_date?: string
          id?: string
          source_url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string | null
          file_url: string
          id: string
          media_type: string | null
          post_id: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
          media_type?: string | null
          post_id?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
          media_type?: string | null
          post_id?: string | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: {
        Row: {
          category_id: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_locations: {
        Row: {
          district_id: string | null
          division_id: string | null
          id: string
          post_id: string
          union_id: string | null
          upazila_id: string | null
        }
        Insert: {
          district_id?: string | null
          division_id?: string | null
          id?: string
          post_id: string
          union_id?: string | null
          upazila_id?: string | null
        }
        Update: {
          district_id?: string | null
          division_id?: string | null
          id?: string
          post_id?: string
          union_id?: string | null
          upazila_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_locations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_locations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_locations_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_locations_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          likes: number | null
          post_type: string
          published_at: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          likes?: number | null
          post_type?: string
          published_at?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          likes?: number | null
          post_type?: string
          published_at?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          facebook_url: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_verified: boolean
          linkedin_url: string | null
          location: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      quotes_pool: {
        Row: {
          author: string | null
          category: string | null
          created_at: string
          id: string
          source_name: string | null
          source_url: string | null
          text: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string
          id?: string
          source_name?: string | null
          source_url?: string | null
          text: string
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string
          id?: string
          source_name?: string | null
          source_url?: string | null
          text?: string
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          url?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          config: Json | null
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          label: string
          section_key: string
          sort_order: number
          updated_at: string
          zone: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label: string
          section_key: string
          sort_order?: number
          updated_at?: string
          zone?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tag_locations: {
        Row: {
          district_id: string | null
          division_id: string | null
          id: string
          tag_id: string
          union_id: string | null
          upazila_id: string | null
        }
        Insert: {
          district_id?: string | null
          division_id?: string | null
          id?: string
          tag_id: string
          union_id?: string | null
          upazila_id?: string | null
        }
        Update: {
          district_id?: string | null
          division_id?: string | null
          id?: string
          tag_id?: string
          union_id?: string | null
          upazila_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_locations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_locations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_locations_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_locations_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      unions: {
        Row: {
          bn_name: string
          id: string
          name: string
          upazila_id: string
        }
        Insert: {
          bn_name: string
          id?: string
          name: string
          upazila_id: string
        }
        Update: {
          bn_name?: string
          id?: string
          name?: string
          upazila_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unions_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      upazilas: {
        Row: {
          bn_name: string
          district_id: string
          id: string
          name: string
        }
        Insert: {
          bn_name: string
          district_id: string
          id?: string
          name: string
        }
        Update: {
          bn_name?: string
          district_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_words: {
        Row: {
          created_at: string
          id: string
          note: string | null
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "dictionary_words"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "editor"],
    },
  },
} as const
