"""
conftest.py — Configuration de base pour les tests FindUP backend

Les clients Supabase et Anthropic sont mockés — aucune connexion réelle requise.

Usage dans tes tests :
    def test_exemple(client):
        response = client.get("/health")
        assert response.status_code == 200
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# ── Ajouter FindUP/backend/ au path Python ────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ── Variables d'env minimales (avant import de main.py) ──────────────────────
_TEST_ENV = {
    "SUPABASE_URL":         "https://test.supabase.co",
    "SUPABASE_SERVICE_KEY": "test-service-key",
    "SUPABASE_ANON_KEY":    "test-anon-key",
    "ANTHROPIC_API_KEY":    "test-anthropic-key",
}
for _key, _val in _TEST_ENV.items():
    os.environ.setdefault(_key, _val)


# ── Helpers mock ──────────────────────────────────────────────────────────────

def _make_mock_supabase():
    """
    Retourne un mock Supabase avec les chaînes de méthodes courantes
    préconfigurées pour retourner des valeurs vides (pas d'erreur).
    Dans tes tests : mock_sb.table(...).select(...).execute.return_value.data = [...]
    """
    mock = MagicMock()
    _chain = mock.table.return_value.select.return_value
    _chain.execute.return_value.data = []
    _chain.limit.return_value.execute.return_value.data = []
    _chain.eq.return_value.execute.return_value.data = []
    _chain.eq.return_value.maybe_single.return_value.execute.return_value.data = None
    _chain.eq.return_value.order.return_value.execute.return_value.data = []
    _chain.range.return_value.execute.return_value.data = []
    # Auth admin (utilisé par PUT /api/profile)
    mock.auth.admin.update_user_by_id.return_value = None
    mock.auth.admin.delete_user.return_value = None
    mock.auth.get_user.return_value = None
    # RPC (search_artisans_nearby)
    mock.rpc.return_value.execute.return_value.data = []
    return mock


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def mock_supabase_client():
    """Fixture: mock Supabase standalone (sans serveur HTTP)."""
    return _make_mock_supabase()


@pytest.fixture(scope="module")
def client():
    """
    FastAPI TestClient avec Supabase et Anthropic entièrement mockés.
    Portée 'module' → une seule instance par fichier de test.
    """
    mock_sb = _make_mock_supabase()
    mock_anthropic = MagicMock()
    # Anthropic : client.messages.create(...).content[0].text
    mock_anthropic.messages.create.return_value.content = [
        MagicMock(text="Réponse de test de l'IA")
    ]

    with patch("main.create_client", return_value=mock_sb), \
         patch("main.Anthropic", return_value=mock_anthropic):

        from fastapi.testclient import TestClient
        import main

        main.supabase_service = mock_sb
        main.supabase_anon = mock_sb
        main.anthropic_client = mock_anthropic

        with TestClient(main.app, raise_server_exceptions=False) as test_client:
            yield test_client


@pytest.fixture
def auth_client(client, mock_user):
    """Client avec require_auth et get_current_user overridés via dependency_overrides."""
    import main as _main
    from auth import require_auth as _require_auth, get_current_user as _get_current_user
    _main.app.dependency_overrides[_require_auth] = lambda: mock_user
    _main.app.dependency_overrides[_get_current_user] = lambda: mock_user
    yield client
    _main.app.dependency_overrides.pop(_require_auth, None)
    _main.app.dependency_overrides.pop(_get_current_user, None)
