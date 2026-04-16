"""
Fixtures pytest communes pour les tests FindUP backend.
Initialise les clients de test, mocks Supabase, et données de test.
"""

import pytest
import os
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import uuid

# Import du serveur FastAPI
import sys
from pathlib import Path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from server import app, supabase, supabase_anon


# ==================== CONFIGURATION PYTEST ====================

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Configure les variables d'environnement pour les tests."""
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    os.environ["SUPABASE_SERVICE_KEY"] = "test_service_key_123"
    os.environ["SUPABASE_ANON_KEY"] = "test_anon_key_456"
    os.environ["ANTHROPIC_API_KEY"] = "test_anthropic_key_789"
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://localhost:3001"
    os.environ["CSP_ENABLED"] = "true"


# ==================== CLIENT FIXTURES ====================

@pytest.fixture
def client():
    """TestClient FastAPI pour les tests."""
    return TestClient(app)


# ==================== AUTH FIXTURES ====================

@pytest.fixture
def test_user():
    """Données utilisateur de test."""
    return {
        "user_id": str(uuid.uuid4()),
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "name": "Test User",
        "picture": None
    }


@pytest.fixture
def test_user_2():
    """Deuxième utilisateur de test."""
    return {
        "user_id": str(uuid.uuid4()),
        "email": "test2@example.com",
        "password": "SecurePassword456!",
        "name": "Test User 2",
        "picture": None
    }


@pytest.fixture
def mock_supabase_auth(monkeypatch):
    """Mock les fonctions d'authentification Supabase."""
    mock_auth = AsyncMock()
    
    # Mock sign_up
    async def mock_sign_up(credentials):
        user = Mock()
        user.id = uuid.uuid4()
        user.email = credentials["email"]
        user.user_metadata = {"name": credentials["options"]["data"]["name"]}
        
        session = Mock()
        session.access_token = f"token_{uuid.uuid4().hex[:20]}"
        
        result = Mock()
        result.user = user
        result.session = session
        return result
    
    # Mock sign_in_with_password
    async def mock_sign_in(credentials):
        user = Mock()
        user.id = uuid.uuid4()
        user.email = credentials["email"]
        user.user_metadata = {"name": "Test User"}
        
        session = Mock()
        session.access_token = f"token_{uuid.uuid4().hex[:20]}"
        
        result = Mock()
        result.user = user
        result.session = session
        return result
    
    # Mock get_user
    async def mock_get_user(token):
        user = Mock()
        user.id = uuid.uuid4()
        user.email = "test@example.com"
        user.user_metadata = {"name": "Test User"}
        
        result = Mock()
        result.user = user
        return result
    
    # Mock admin.delete_user
    async def mock_delete_user(user_id):
        return Mock()
    
    mock_auth.sign_up = mock_sign_up
    mock_auth.sign_in_with_password = mock_sign_in
    mock_auth.get_user = mock_get_user
    mock_auth.admin = Mock()
    mock_auth.admin.delete_user = mock_delete_user
    
    return mock_auth


@pytest.fixture
def auth_headers(test_user):
    """Headers d'authentification Bearer token."""
    token = f"token_{uuid.uuid4().hex[:20]}"
    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def auth_cookies(test_user):
    """Cookies de session pour l'authentification."""
    token = f"token_{uuid.uuid4().hex[:20]}"
    return {
        "session_token": token
    }


# ==================== SUPABASE MOCKS ====================

@pytest.fixture
def mock_supabase_table(monkeypatch):
    """Mock les opérations Supabase table."""
    
    class MockQuery:
        def __init__(self, table_name):
            self.table_name = table_name
            self._filters = {}
            self._select_cols = "*"
            self._order_col = None
            self._order_desc = False
            self._limit_val = None
            self._range_start = None
            self._range_end = None
            self._data = []
        
        def select(self, cols):
            self._select_cols = cols
            return self
        
        def eq(self, col, val):
            self._filters[col] = val
            return self
        
        def in_(self, col, vals):
            self._filters[f"{col}_in"] = vals
            return self
        
        def order(self, col, desc=False):
            self._order_col = col
            self._order_desc = desc
            return self
        
        def limit(self, n):
            self._limit_val = n
            return self
        
        def range(self, start, end):
            self._range_start = start
            self._range_end = end
            return self
        
        def maybe_single(self):
            return self
        
        def execute(self):
            result = Mock()
            result.data = self._data
            return result
        
        def insert(self, doc):
            self._data = [doc]
            return self
        
        def update(self, updates):
            self._data = [updates]
            return self
        
        def delete(self):
            return self
        
        def upsert(self, doc, on_conflict=None):
            self._data = [doc]
            return self
    
    def mock_table(table_name):
        return MockQuery(table_name)
    
    return mock_table


@pytest.fixture
def mock_supabase_rpc(monkeypatch):
    """Mock les appels RPC Supabase."""
    
    async def mock_rpc(func_name, params):
        result = Mock()
        
        if func_name == "search_artisans_nearby":
            result.data = [
                {
                    "artisan_id": f"artisan_{uuid.uuid4().hex[:12]}",
                    "nom": "Plombier Test",
                    "entreprise": "Test SARL",
                    "telephone": "0123456789",
                    "email": "plombier@test.com",
                    "latitude": 48.8566,
                    "longitude": 2.3522,
                    "rayon_km": 15,
                    "photo_url": None,
                    "description": "Plombier expérimenté",
                    "horaires": "9h-18h",
                    "urgent_disponible": True,
                    "abonnement_type": "premium",
                    "is_verified": True,
                    "distance_km": 2.5,
                    "tags_list": ["FuiteEau", "Canalisation"],
                    "metiers_list": ["Plombier"],
                    "note_moyenne": 4.5,
                    "nombre_avis": 12
                }
            ]
        else:
            result.data = []
        
        return result
    
    return mock_rpc


# ==================== ANTHROPIC MOCKS ====================

@pytest.fixture
def mock_anthropic_client(monkeypatch):
    """Mock le client Anthropic Claude."""
    
    mock_client = Mock()
    
    def mock_messages_create(**kwargs):
        response = Mock()
        
        # Réponse par défaut pour le chat
        if "system" in kwargs and "ROUTER_PROMPT" in kwargs.get("system", ""):
            response.content = [Mock(text="chat")]
        elif "system" in kwargs and "GUIDE_PROMPT" in kwargs.get("system", ""):
            response.content = [Mock(text='{"message":"Guide DIY","suggestions":["Étape 1","Étape 2"]}')]
        else:
            response.content = [Mock(text='{"message":"Réponse test","suggestions":[],"collected":{"problem_understood":false,"location_known":false,"urgency_known":false},"diagnosis":null,"needs_location":false,"ready_to_search":false}')]
        
        return response
    
    mock_client.messages.create = mock_messages_create
    return mock_client


# ==================== ARTISAN FIXTURES ====================

@pytest.fixture
def test_artisan():
    """Données artisan de test."""
    return {
        "artisan_id": f"artisan_{uuid.uuid4().hex[:12]}",
        "nom": "Jean Dupont",
        "entreprise": "Dupont Plomberie",
        "telephone": "0123456789",
        "email": "jean@dupont.com",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "rayon_km": 15,
        "photo_url": "https://example.com/photo.jpg",
        "description": "Plombier expérimenté depuis 20 ans",
        "horaires": "9h-18h, fermé dimanche",
        "urgent_disponible": True,
        "abonnement_type": "premium",
        "is_verified": True
    }


@pytest.fixture
def test_artisan_2():
    """Deuxième artisan de test."""
    return {
        "artisan_id": f"artisan_{uuid.uuid4().hex[:12]}",
        "nom": "Marie Martin",
        "entreprise": "Martin Électricité",
        "telephone": "0987654321",
        "email": "marie@martin.com",
        "latitude": 48.8700,
        "longitude": 2.3600,
        "rayon_km": 20,
        "photo_url": None,
        "description": "Électricienne qualifiée",
        "horaires": "8h-17h",
        "urgent_disponible": False,
        "abonnement_type": "gratuit",
        "is_verified": False
    }


@pytest.fixture
def test_avis():
    """Données avis de test."""
    return {
        "avis_id": f"avis_{uuid.uuid4().hex[:12]}",
        "artisan_id": "artisan_test",
        "note": 5,
        "commentaire": "Excellent travail, très professionnel!",
        "auteur": "Client Satisfait",
        "user_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== CHAT FIXTURES ====================

@pytest.fixture
def test_chat_message():
    """Message de chat de test."""
    return {
        "message": "J'ai une fuite d'eau à Paris",
        "image_base64": None,
        "conversation_history": None,
        "location": None
    }


@pytest.fixture
def test_chat_history():
    """Historique de conversation de test."""
    return [
        {
            "role": "user",
            "content": "Bonjour, j'ai besoin d'aide"
        },
        {
            "role": "assistant",
            "content": "Bonjour! Comment puis-je vous aider?"
        }
    ]


# ==================== PROFILE FIXTURES ====================

@pytest.fixture
def test_profile():
    """Données profil de test."""
    return {
        "id": str(uuid.uuid4()),
        "prenom": "Jean",
        "nom": "Dupont",
        "name": "Jean Dupont",
        "adresse": "123 Rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "telephone": "0123456789",
        "picture": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== FAVORIS FIXTURES ====================

@pytest.fixture
def test_favori():
    """Données favori de test."""
    return {
        "favori_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": str(uuid.uuid4()),
        "artisan_id": "artisan_test",
        "created_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== HISTORIQUE FIXTURES ====================

@pytest.fixture
def test_historique():
    """Données historique de test."""
    return {
        "historique_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": str(uuid.uuid4()),
        "artisan_id": "artisan_test",
        "action": "vu",
        "created_at": datetime.now(timezone.utc).isoformat()
    }


@pytest.fixture
def test_historique_guide():
    """Données historique guide de test."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "theme": "Plomberie",
        "titre": "Comment réparer une fuite d'eau",
        "description": "Guide complet pour réparer une fuite",
        "date": datetime.now(timezone.utc).isoformat()
    }


# ==================== TRANSACTION FIXTURES ====================

@pytest.fixture
def test_transaction():
    """Données transaction de test."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "amount": 99.99,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== SEARCH FIXTURES ====================

@pytest.fixture
def test_search_request():
    """Requête de recherche de test."""
    return {
        "metiers": ["Plombier"],
        "tags": ["FuiteEau"],
        "latitude": 48.8566,
        "longitude": 2.3522,
        "rayon_km": 15,
        "urgence": False
    }


# ==================== PARAMETRIZED FIXTURES ====================

@pytest.fixture(params=[
    {"metier": "plombier", "ville": "paris"},
    {"metier": "electricien", "ville": "lyon"},
    {"metier": "menuisier", "ville": "marseille"},
])
def seo_params(request):
    """Paramètres SEO pour tests."""
    return request.param


# ==================== CLEANUP FIXTURES ====================

@pytest.fixture(autouse=True)
def cleanup_after_test():
    """Nettoie après chaque test."""
    yield
    # Cleanup code here if needed
