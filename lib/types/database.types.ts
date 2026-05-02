export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole    = "user" | "admin" | "moderator"
export type PhaseType   = "swiss" | "double_elimination" | "playoffs" | "groups"
export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled"
export type MatchFormat = "bo1" | "bo3" | "bo5"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          role: UserRole
          setup_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          role?: UserRole
          setup_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
          role?: UserRole
          setup_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }

      tournaments: {
        Row: {
          id: string
          name: string
          slug: string
          is_active: boolean
          start_date: string | null
          end_date: string | null
          logo_url: string | null
          prize_pool: number | null
          location: string | null
          primary_color: string | null
          pandascore_id: string | null
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          logo_url?: string | null
          prize_pool?: number | null
          location?: string | null
          primary_color?: string | null
          pandascore_id?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          logo_url?: string | null
          prize_pool?: number | null
          location?: string | null
          primary_color?: string | null
          pandascore_id?: string | null
          last_synced_at?: string | null
        }
        Relationships: []
      }

      phases: {
        Row: {
          id: string
          tournament_id: string
          name: string
          type: PhaseType
          order_index: number
          is_active: boolean
          description: string | null
          draft_open: boolean
          salary_cap: number
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          type: PhaseType
          order_index: number
          is_active?: boolean
          description?: string | null
          draft_open?: boolean
          salary_cap?: number
          created_at?: string
        }
        Update: {
          name?: string
          type?: PhaseType
          order_index?: number
          is_active?: boolean
          description?: string | null
          draft_open?: boolean
          salary_cap?: number
        }
        Relationships: [
          {
            foreignKeyName: "phases_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          }
        ]
      }

      teams: {
        Row: {
          id: string
          name: string
          short_name: string | null
          region: string | null
          logo_url: string | null
          pandascore_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          region?: string | null
          logo_url?: string | null
          pandascore_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          short_name?: string | null
          region?: string | null
          logo_url?: string | null
          pandascore_id?: string | null
          is_active?: boolean
        }
        Relationships: []
      }

      players: {
        Row: {
          id: string
          team_id: string | null
          nickname: string
          real_name: string | null
          role: string | null
          nationality: string | null
          avatar_url: string | null
          fantasy_cost: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id?: string | null
          nickname: string
          real_name?: string | null
          role?: string | null
          nationality?: string | null
          avatar_url?: string | null
          fantasy_cost?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          team_id?: string | null
          nickname?: string
          real_name?: string | null
          role?: string | null
          nationality?: string | null
          avatar_url?: string | null
          fantasy_cost?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }

      matches: {
        Row: {
          id: string
          tournament_id: string
          phase_id: string | null
          team_a_id: string
          team_b_id: string
          format: MatchFormat
          status: MatchStatus
          winner_id: string | null
          team_a_maps_won: number
          team_b_maps_won: number
          scheduled_at: string | null
          pandascore_id: string | null
          external_stats_url: string | null
          round_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          phase_id?: string | null
          team_a_id: string
          team_b_id: string
          format?: MatchFormat
          status?: MatchStatus
          winner_id?: string | null
          team_a_maps_won?: number
          team_b_maps_won?: number
          scheduled_at?: string | null
          pandascore_id?: string | null
          external_stats_url?: string | null
          round_name?: string | null
          created_at?: string
        }
        Update: {
          phase_id?: string | null
          format?: MatchFormat
          status?: MatchStatus
          winner_id?: string | null
          team_a_maps_won?: number
          team_b_maps_won?: number
          scheduled_at?: string | null
          pandascore_id?: string | null
          external_stats_url?: string | null
          round_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }

      match_predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          predicted_winner_id: string
          is_correct: boolean | null
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          predicted_winner_id: string
          is_correct?: boolean | null
          points_earned?: number
          created_at?: string
        }
        Update: {
          predicted_winner_id?: string
          is_correct?: boolean | null
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_predicted_winner_id_fkey"
            columns: ["predicted_winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }

      match_community_picks: {
        Row: {
          match_id: string
          predicted_winner_id: string
          pick_count: number
        }
        Insert: {
          match_id: string
          predicted_winner_id: string
          pick_count?: number
        }
        Update: {
          pick_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_community_picks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }

      sync_logs: {
        Row: {
          id: string
          tournament_id: string | null
          status: string
          matches_created: number | null
          matches_updated: number | null
          error_message: string | null
          duration_ms: number | null
          triggered_by: string
          synced_at: string
        }
        Insert: {
          id?: string
          tournament_id?: string | null
          status: string
          matches_created?: number | null
          matches_updated?: number | null
          error_message?: string | null
          duration_ms?: number | null
          triggered_by?: string
          synced_at?: string
        }
        Update: {
          status?: string
          matches_created?: number | null
          matches_updated?: number | null
          error_message?: string | null
          duration_ms?: number | null
        }
        Relationships: []
      }

      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      fantasy_rosters: {
        Row: {
          id: string
          user_id: string
          tournament_id: string
          phase_id: string
          budget_spent: number
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tournament_id: string
          phase_id: string
          budget_spent?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          budget_spent?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }

      fantasy_picks: {
        Row: {
          id: string
          roster_id: string
          player_id: string
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          roster_id: string
          player_id: string
          points_earned?: number
          created_at?: string
        }
        Update: {
          points_earned?: number
        }
        Relationships: []
      }

      player_match_stats: {
        Row: {
          id: string
          match_id: string
          player_id: string
          kills: number
          deaths: number
          entry_kills: number
          entry_deaths: number
          kost: number
          plants: number
          defuses: number
          clutch_1v1: number
          clutch_1v2: number
          clutch_1v3: number
          clutch_1v4: number
          clutch_1v5: number
          rounds_survived: number
          rounds_played: number
          fantasy_points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          kills?: number
          deaths?: number
          entry_kills?: number
          entry_deaths?: number
          kost?: number
          plants?: number
          defuses?: number
          clutch_1v1?: number
          clutch_1v2?: number
          clutch_1v3?: number
          clutch_1v4?: number
          clutch_1v5?: number
          rounds_survived?: number
          rounds_played?: number
          fantasy_points_earned?: number
          created_at?: string
        }
        Update: {
          kills?: number
          deaths?: number
          entry_kills?: number
          entry_deaths?: number
          kost?: number
          plants?: number
          defuses?: number
          clutch_1v1?: number
          clutch_1v2?: number
          clutch_1v3?: number
          clutch_1v4?: number
          clutch_1v5?: number
          rounds_survived?: number
          rounds_played?: number
          fantasy_points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }

      scoring_config: {
        Row: {
          id: string
          stat_key: string
          label: string
          value: number
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          stat_key: string
          label: string
          value: number
          description?: string | null
          updated_at?: string
        }
        Update: {
          label?: string
          value?: number
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }

    Views: {
      fantasy_leaderboard: {
        Row: {
          user_id: string | null
          username: string | null
          avatar_url: string | null
          total_points: number | null
          phases_played: number | null
        }
        Relationships: []
      }
      pickem_leaderboard: {
        Row: {
          user_id: string | null
          username: string | null
          avatar_url: string | null
          total_points: number | null
          correct_picks: number | null
          resolved_picks: number | null
          accuracy_pct: number | null
          current_streak: number | null
        }
        Relationships: []
      }
    }

    Functions: Record<string, never>
    CompositeTypes: Record<string, never>

    Enums: {
      user_role: UserRole
      phase_type: PhaseType
      match_status: MatchStatus
      match_format: MatchFormat
    }
  }
}

// ── Convenient row types ──────────────────────────────────────────────────────
export type Profile            = Database["public"]["Tables"]["profiles"]["Row"]
export type Tournament         = Database["public"]["Tables"]["tournaments"]["Row"]
export type Phase              = Database["public"]["Tables"]["phases"]["Row"]
export type Team               = Database["public"]["Tables"]["teams"]["Row"]
export type Player             = Database["public"]["Tables"]["players"]["Row"]
export type Match              = Database["public"]["Tables"]["matches"]["Row"]
export type MatchPrediction    = Database["public"]["Tables"]["match_predictions"]["Row"]
export type MatchCommunityPick = Database["public"]["Tables"]["match_community_picks"]["Row"]
export type SyncLog            = Database["public"]["Tables"]["sync_logs"]["Row"]
export type PushSubscription   = Database["public"]["Tables"]["push_subscriptions"]["Row"]
export type FantasyRoster      = Database["public"]["Tables"]["fantasy_rosters"]["Row"]
export type FantasyPick        = Database["public"]["Tables"]["fantasy_picks"]["Row"]
export type PlayerMatchStats   = Database["public"]["Tables"]["player_match_stats"]["Row"]
export type ScoringConfig      = Database["public"]["Tables"]["scoring_config"]["Row"]
export type PickemRow          = Database["public"]["Views"]["pickem_leaderboard"]["Row"]

// ── Enriched types (with joins) ───────────────────────────────────────────────
export type PlayerWithTeam = Player & {
  teams: Pick<Team, "id" | "name" | "short_name" | "logo_url" | "region"> | null
}

export type MatchWithTeams = Match & {
  team_a: Pick<Team, "id" | "name" | "short_name" | "logo_url">
  team_b: Pick<Team, "id" | "name" | "short_name" | "logo_url">
  winner: Pick<Team, "id" | "name" | "short_name"> | null
  phases: Pick<Phase, "id" | "name" | "type"> | null
}

export type RosterWithPicks = FantasyRoster & {
  fantasy_picks: Array<FantasyPick & { players: PlayerWithTeam }>
  profiles: Pick<Profile, "id" | "username" | "avatar_url">
}

export type PredictionWithMatch = MatchPrediction & {
  matches: MatchWithTeams
  predicted_winner: Pick<Team, "id" | "name" | "short_name" | "logo_url">
}
