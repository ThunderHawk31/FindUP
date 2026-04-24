"""Configuration pytest et fixtures communes pour tous les tests."""

import os
import pytest
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

# Doit être défini avant tout import de main.py / auth.py
for _k, _v in {
    "SUPABASE_URL":         "https://test.supabase.co",
    "SUPABASE_SERVICE_KEY": "test-service-key",
    "SUPABASE_ANON_KEY":    "test-anon-key",
    "ANTHROPIC_API_KEY":    "test-anthropic-key",
}.items():
    os.environ.setdefault(_k, _v)

from main import app


@pytest.fixture
def client():
    """Fixture client TestClient pour tous les tests."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Fixture pour headers d'authentification avec token de test."""
    return {
        "Authorization": "Bearer test_token_12345",
        "Content-Type": "application/json"
    }


@pytest.fixture
def mock_user():
    """Fixture pour utilisateur authentifié mocké."""
    return {
        "id": f"user_{uuid.uuid4().hex[:12]}",
        "email": "test@example.com",
        "created_at": datetime.now().isoformat(),
        "user_metadata": {
            "full_name": "Test User"
        }
    }


@pytest.fixture
def test_user_data():
    """Fixture données utilisateur pour tests d'authentification."""
    return {
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "TestPassword123!",
        "name": "Test User"
    }


@pytest.fixture
def test_artisan_data():
    """Fixture données artisan pour tests."""
    return {
        "id": 1,
        "nom": "Test Artisan",
        "description": "Artisan de confiance depuis 10 ans",
        "ville": "Paris",
        "metier": "Plombier",
        "telephone": "0123456789",
        "email": "artisan@example.com",
        "adresse_complete": "123 rue de Test, Paris",
        "note_moyenne": 4.5,
        "nombre_avis": 12,
        "photo_profil": "photo.jpg",
        "certifie": True,
        "disponible": True
    }


@pytest.fixture
def test_artisan_response():
    """Fixture réponse artisan formatée."""
    return {
        "id": 1,
        "nom": "Test Artisan",
        "description": "Artisan de confiance",
        "ville": "Paris",
        "metier": "Plombier",
        "telephone": "0123456789",
        "email": "artisan@example.com",
        "note_moyenne": 4.5,
        "nombre_avis": 12,
        "photo_profil": "photo.jpg",
        "certifie": True,
        "disponible": True
    }


@pytest.fixture
def test_search_request():
    """Fixture requête de recherche artisans."""
    return {
        "metier": "Plombier",
        "ville": "Paris",
        "note_minimum": 4.0,
        "certifie_seulement": False,
        "disponible_seulement": True
    }


@pytest.fixture
def test_avis_data():
    """Fixture données avis pour tests."""
    return {
        "note": 5,
        "commentaire": "Excellent travail, très professionnel"
    }


@pytest.fixture
def test_avis_response():
    """Fixture réponse avis formatée."""
    return {
        "id": 1,
        "artisan_id": 1,
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "note": 5,
        "commentaire": "Excellent travail",
        "nom_client": "Test User",
        "created_at": datetime.now().isoformat()
    }


@pytest.fixture
def test_chat_message():
    """Fixture message chat pour tests."""
    return {
        "message": "J'ai une fuite d'eau urgente, que faire ?"
    }


@pytest.fixture
def test_profile_data():
    """Fixture données profil utilisateur."""
    return {
        "nom": "Nouveau Nom"
    }