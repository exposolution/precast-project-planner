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
      calendario_trabalho: {
        Row: {
          created_at: string
          data: string
          eh_feriado: boolean
          id: string
          nome_feriado: string | null
          turno_fim: string
          turno_inicio: string
        }
        Insert: {
          created_at?: string
          data: string
          eh_feriado?: boolean
          id?: string
          nome_feriado?: string | null
          turno_fim?: string
          turno_inicio?: string
        }
        Update: {
          created_at?: string
          data?: string
          eh_feriado?: boolean
          id?: string
          nome_feriado?: string | null
          turno_fim?: string
          turno_inicio?: string
        }
        Relationships: []
      }
      formas: {
        Row: {
          capacity: number
          code: string
          created_at: string
          disponivel: boolean
          height_cm: number
          id: string
          length_cm: number
          name: string
          setup_minutes: number | null
          status: Database["public"]["Enums"]["forma_status"]
          updated_at: string
          width_cm: number
        }
        Insert: {
          capacity?: number
          code: string
          created_at?: string
          disponivel?: boolean
          height_cm: number
          id?: string
          length_cm: number
          name: string
          setup_minutes?: number | null
          status?: Database["public"]["Enums"]["forma_status"]
          updated_at?: string
          width_cm: number
        }
        Update: {
          capacity?: number
          code?: string
          created_at?: string
          disponivel?: boolean
          height_cm?: number
          id?: string
          length_cm?: number
          name?: string
          setup_minutes?: number | null
          status?: Database["public"]["Enums"]["forma_status"]
          updated_at?: string
          width_cm?: number
        }
        Relationships: []
      }
      gantt_lotes: {
        Row: {
          created_at: string
          fim: string
          forma_id: string
          grupo_altura_cm: number
          grupo_base_cm: number
          id: string
          inicio: string
          obra_id: string
          ordem_fila: number
          quantidade: number
          setup_aplicado: boolean
          setup_minutos: number
          tempo_producao_min: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fim: string
          forma_id: string
          grupo_altura_cm: number
          grupo_base_cm: number
          id?: string
          inicio: string
          obra_id: string
          ordem_fila?: number
          quantidade?: number
          setup_aplicado?: boolean
          setup_minutos?: number
          tempo_producao_min: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fim?: string
          forma_id?: string
          grupo_altura_cm?: number
          grupo_base_cm?: number
          id?: string
          inicio?: string
          obra_id?: string
          ordem_fila?: number
          quantidade?: number
          setup_aplicado?: boolean
          setup_minutos?: number
          tempo_producao_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_lotes_forma_id_fkey"
            columns: ["forma_id"]
            isOneToOne: false
            referencedRelation: "formas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_lotes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          code: string
          created_at: string
          deadline: string
          id: string
          location: string
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["obra_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_type"] | null
          urgency_after_forma_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          deadline: string
          id?: string
          location: string
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["obra_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_type"] | null
          urgency_after_forma_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          deadline?: string
          id?: string
          location?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["obra_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_type"] | null
          urgency_after_forma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_urgency_after_forma_id_fkey"
            columns: ["urgency_after_forma_id"]
            isOneToOne: false
            referencedRelation: "formas"
            referencedColumns: ["id"]
          },
        ]
      }
      production_items: {
        Row: {
          created_at: string
          end_date: string
          forma_id: string
          id: string
          notes: string | null
          obra_id: string
          piece_height_cm: number | null
          piece_length_cm: number | null
          piece_width_cm: number | null
          priority: Database["public"]["Enums"]["priority_level"]
          produced: number
          quantity: number
          start_date: string
          status: Database["public"]["Enums"]["production_item_status"]
          tempo_unitario_minutos: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          forma_id: string
          id?: string
          notes?: string | null
          obra_id: string
          piece_height_cm?: number | null
          piece_length_cm?: number | null
          piece_width_cm?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          produced?: number
          quantity?: number
          start_date: string
          status?: Database["public"]["Enums"]["production_item_status"]
          tempo_unitario_minutos?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          forma_id?: string
          id?: string
          notes?: string | null
          obra_id?: string
          piece_height_cm?: number | null
          piece_length_cm?: number | null
          piece_width_cm?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          produced?: number
          quantity?: number
          start_date?: string
          status?: Database["public"]["Enums"]["production_item_status"]
          tempo_unitario_minutos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_items_forma_id_fkey"
            columns: ["forma_id"]
            isOneToOne: false
            referencedRelation: "formas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_items_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      forma_status: "available" | "in-use" | "maintenance"
      obra_status: "active" | "paused" | "completed"
      priority_level: "critical" | "high" | "medium" | "low"
      production_item_status:
        | "pending"
        | "in-progress"
        | "completed"
        | "delayed"
      urgency_type: "passa_frente" | "normal" | "vai_fim_fila"
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
      forma_status: ["available", "in-use", "maintenance"],
      obra_status: ["active", "paused", "completed"],
      priority_level: ["critical", "high", "medium", "low"],
      production_item_status: [
        "pending",
        "in-progress",
        "completed",
        "delayed",
      ],
      urgency_type: ["passa_frente", "normal", "vai_fim_fila"],
    },
  },
} as const
