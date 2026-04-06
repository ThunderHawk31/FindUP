-- FindUP — Schéma Supabase (PostgreSQL + PostGIS)
-- Projet ID : jazxlqjgvldxeppkofnx
-- Région : eu-west-3 (Paris)

-- Extension géospatiale
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Profils utilisateurs (lié à Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artisans
CREATE TABLE artisans (
    artisan_id TEXT PRIMARY KEY,  -- "art_001", "art_002"
    nom TEXT NOT NULL,
    entreprise TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    location GEOGRAPHY(POINT, 4326),  -- PostGIS
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rayon_km INTEGER DEFAULT 15,
    photo_url TEXT,
    description TEXT,
    horaires TEXT,
    urgent_disponible BOOLEAN DEFAULT FALSE,
    abonnement_type TEXT DEFAULT 'gratuit',  -- 'gratuit' ou 'pro'
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Référentiel des compétences
CREATE TABLE tags (
    tag_id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    metier TEXT NOT NULL
);

-- Association artisan <-> compétence (many-to-many)
CREATE TABLE artisan_tags (
    tag_artisan_id TEXT PRIMARY KEY,
    artisan_id TEXT NOT NULL REFERENCES artisans(artisan_id) ON DELETE CASCADE,
    tag_nom TEXT NOT NULL,
    metier TEXT NOT NULL
);

-- Notes et commentaires
CREATE TABLE avis (
    avis_id TEXT PRIMARY KEY,
    artisan_id TEXT NOT NULL REFERENCES artisans(artisan_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    note INTEGER NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire TEXT NOT NULL,
    auteur TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favoris utilisateur
CREATE TABLE favoris (
    favori_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    artisan_id TEXT NOT NULL REFERENCES artisans(artisan_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des actions
CREATE TABLE historique (
    historique_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    artisan_id TEXT NOT NULL REFERENCES artisans(artisan_id) ON DELETE CASCADE,
    action TEXT NOT NULL,  -- 'vu' ou 'appele'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions de chat IA
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction de recherche géospatiale
CREATE FUNCTION search_artisans_nearby(
    search_lat DOUBLE PRECISION,
    search_lon DOUBLE PRECISION,
    search_rayon_km INTEGER DEFAULT 15,
    search_metiers TEXT[] DEFAULT NULL,
    search_tags TEXT[] DEFAULT NULL,
    search_urgence BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    artisan_id TEXT, nom TEXT, entreprise TEXT, telephone TEXT, email TEXT,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION, tags_list TEXT[], metiers_list TEXT[],
    note_moyenne NUMERIC, nombre_avis BIGINT, is_verified BOOLEAN,
    abonnement_type TEXT
);
-- Tri : Pro en premier, puis par distance croissante. Max 10 résultats.
