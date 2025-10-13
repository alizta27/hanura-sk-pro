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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      pengajuan_sk: {
        Row: {
          approved_by_ketum: string | null
          approved_by_sekjend: string | null
          approved_ketum_at: string | null
          approved_sekjend_at: string | null
          catatan_revisi: string | null
          created_at: string
          dpd_id: string
          file_laporan_musda: string | null
          id: string
          lokasi_musda: string
          sk_terbit_at: string | null
          status: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_musda: string
          updated_at: string
          verified_by_okk: string | null
          verified_okk_at: string | null
        }
        Insert: {
          approved_by_ketum?: string | null
          approved_by_sekjend?: string | null
          approved_ketum_at?: string | null
          approved_sekjend_at?: string | null
          catatan_revisi?: string | null
          created_at?: string
          dpd_id: string
          file_laporan_musda?: string | null
          id?: string
          lokasi_musda: string
          sk_terbit_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_musda: string
          updated_at?: string
          verified_by_okk?: string | null
          verified_okk_at?: string | null
        }
        Update: {
          approved_by_ketum?: string | null
          approved_by_sekjend?: string | null
          approved_ketum_at?: string | null
          approved_sekjend_at?: string | null
          catatan_revisi?: string | null
          created_at?: string
          dpd_id?: string
          file_laporan_musda?: string | null
          id?: string
          lokasi_musda?: string
          sk_terbit_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_musda?: string
          updated_at?: string
          verified_by_okk?: string | null
          verified_okk_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_sk_approved_by_ketum_fkey"
            columns: ["approved_by_ketum"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_sk_approved_by_sekjend_fkey"
            columns: ["approved_by_sekjend"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_sk_dpd_id_fkey"
            columns: ["dpd_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_sk_verified_by_okk_fkey"
            columns: ["verified_by_okk"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pengurus: {
        Row: {
          created_at: string
          file_ktp: string
          id: string
          jabatan: string
          jenis_kelamin: string
          nama_lengkap: string
          pengajuan_id: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          file_ktp: string
          id?: string
          jabatan: string
          jenis_kelamin: string
          nama_lengkap: string
          pengajuan_id: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          file_ktp?: string
          id?: string
          jabatan?: string
          jenis_kelamin?: string
          nama_lengkap?: string
          pengajuan_id?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "pengurus_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_sk"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          provinsi: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          provinsi?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          provinsi?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "dpd" | "okk" | "sekjend" | "ketum"
      pengajuan_status:
        | "draft"
        | "diupload"
        | "diverifikasi_okk"
        | "ditolak_okk"
        | "disetujui_sekjend"
        | "ditolak_sekjend"
        | "disetujui_ketum"
        | "ditolak_ketum"
        | "sk_terbit"
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
      app_role: ["dpd", "okk", "sekjend", "ketum"],
      pengajuan_status: [
        "draft",
        "diupload",
        "diverifikasi_okk",
        "ditolak_okk",
        "disetujui_sekjend",
        "ditolak_sekjend",
        "disetujui_ketum",
        "ditolak_ketum",
        "sk_terbit",
      ],
    },
  },
} as const
