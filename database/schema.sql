-- Relational PostgreSQL Schema for Gevents Unlimited Cricket Tournament Ecosystem

-- ENUMS AND CUSTOM DOMAINS FOR SECURITY AND ACCESS CONTROL
CREATE TYPE user_role AS ENUM ('super_admin', 'team_manager', 'player', 'scorer', 'audience');
CREATE TYPE tournament_type AS ENUM ('leather_ball', 'box_cricket', 'turf_cricket', 'indoor_cricket');
CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE team_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'paused', 'completed');
CREATE TYPE extra_type AS ENUM ('wide', 'noball', 'bye', 'legbye');
CREATE TYPE wicket_type AS ENUM ('bowled', 'caught', 'runout', 'lbw', 'stumped', 'retired_out', 'hit_wicket');

-- 1. USERS TABLE (Supports OTP and regular login)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'audience' NOT NULL,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TOURNAMENTS TABLE
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type tournament_type NOT NULL,
    rules JSONB NOT NULL, -- e.g., {"overs": 16, "players_per_team": 11, "powerplay_overs": 4, "free_hit": true}
    prize_money NUMERIC(12, 2) DEFAULT 0.00,
    venue_details JSONB, -- e.g., {"ground_name": "Gevents Arena A", "address": "Baner, Pune"}
    status tournament_status DEFAULT 'draft' NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. TEAMS TABLE
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(512),
    jersey_color VARCHAR(100),
    manager_id INT REFERENCES users(id) ON DELETE SET NULL,
    status team_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_tournament_team UNIQUE (tournament_id, name)
);

-- 4. PLAYERS TABLE
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(512),
    jersey_number INT,
    batting_style VARCHAR(50), -- e.g., "Right-hand bat"
    bowling_style VARCHAR(50), -- e.g., "Right-arm medium fast"
    is_captain BOOLEAN DEFAULT FALSE NOT NULL,
    is_vice_captain BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. FIXTURES TABLE
CREATE TABLE fixtures (
    id SERIAL PRIMARY KEY,
    tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    team1_id INT REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    team2_id INT REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    ground VARCHAR(255) NOT NULL,
    scorer_id INT REFERENCES users(id) ON DELETE SET NULL,
    status match_status DEFAULT 'scheduled' NOT NULL,
    result_summary VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. MATCH STATE TABLE (Real-time live details)
CREATE TABLE match_state (
    id SERIAL PRIMARY KEY,
    fixture_id INT REFERENCES fixtures(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_innings INT DEFAULT 1 CHECK (current_innings IN (1, 2)),
    current_over INT DEFAULT 0,
    current_ball INT DEFAULT 0,
    striker_id INT REFERENCES players(id) ON DELETE SET NULL,
    non_striker_id INT REFERENCES players(id) ON DELETE SET NULL,
    bowler_id INT REFERENCES players(id) ON DELETE SET NULL,
    team1_score JSONB DEFAULT '{"runs": 0, "wickets": 0, "overs": 0.0, "extras": 0}'::jsonb NOT NULL,
    team2_score JSONB DEFAULT '{"runs": 0, "wickets": 0, "overs": 0.0, "extras": 0}'::jsonb NOT NULL,
    status match_status DEFAULT 'scheduled' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. BALL COMMENTARY TABLE (For commentary, run rates, and statistical metrics)
CREATE TABLE ball_commentary (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES match_state(id) ON DELETE CASCADE NOT NULL,
    innings INT NOT NULL,
    over_num INT NOT NULL,
    ball_num INT NOT NULL,
    batsman_id INT REFERENCES players(id) ON DELETE SET NULL NOT NULL,
    bowler_id INT REFERENCES players(id) ON DELETE SET NULL NOT NULL,
    runs INT DEFAULT 0 NOT NULL,
    extra_runs INT DEFAULT 0 NOT NULL,
    extra_type extra_type,
    wicket_type wicket_type,
    dismissed_player_id INT REFERENCES players(id) ON DELETE SET NULL,
    description VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- PERFORMANCE OPTIMIZING INDEXES
CREATE INDEX idx_teams_tournament ON teams(tournament_id);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX idx_commentary_match ON ball_commentary(match_id, innings, over_num, ball_num);
CREATE INDEX idx_users_email ON users(email);
