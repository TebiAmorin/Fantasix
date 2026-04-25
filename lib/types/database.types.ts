export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "user" | "admin" | "moderator"
export type PhaseType = "swiss" | "double_elimination" | "playoffs" | "groups"
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
          role?: UserRole
          updated_at?: string
        }
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
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          logo_url?: string | null
        }
      }
      phases: {
        Row: {
          id: string
          tournament_id: string
          name: string
          type: PhaseType
          order_index: number
          is_active: boolean
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
          draft_open?: boolean
          salary_cap?: number
          created_at?: string
        }
        Update: {
          name?: string
          type?: PhaseType
          order_index?: number
          is_active?: boolean
          draft_open?: boolean
          salary_cap?: number
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          short_name: string | null
          region: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          region?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          short_name?: string | null
          region?: string | null
          logo_url?: string | null
          is_active?: boolean
        }
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
          external_stats_url: string | null
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
          external_stats_url?: string | null
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
          external_stats_url?: string | null
        }
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
        }
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
export type FantasyRoster      = Database["public"]["Tables"]["fantasy_rosters"]["Row"]
export type FantasyPick        = Database["public"]["Tables"]["fantasy_picks"]["Row"]
export type PlayerMatchStats   = Database["public"]["Tables"]["player_match_stats"]["Row"]
export type ScoringConfig      = Database["public"]["Tables"]["scoring_config"]["Row"]

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
