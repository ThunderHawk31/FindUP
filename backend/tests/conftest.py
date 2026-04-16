"""
conftest.py — Configuration de base pour les tests FindUP backend

Les clients Supabase et Anthropic sont mockés — aucune connexion réelle requise.
Le Tester du Squad IA écrit ses tests dans ce dossier, ils s'appuient sur ce conftest.

Usage dans tes tests :
    def test_exemple(client):
        response = client.get("/api/artisans")
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

# ── Variables d'env minimales (avant import de server.py) ─────────────────────
_TEST_ENV = {
    "SUPABASE_URL":         "https://test.supabase.co",
    "SUPABASE_KEY":         "test-service-key",
    "SUPABASE_ANON_KEY":    "test-anon-key",
    "ANTHROPIC_API_KEY":    "test-anthropic-key",
}
for _key, _val in _TEST_ENV.items():
    os.environ.setdefault(_key, _val)


# ── Helpers mock ──────────────────────────────────────────────────────────────

def _make_mock_supabase():
    """
    Retourne un mock Supabase avec les chaînes de méthodes les plus courantes
    préconfigurées pour retourner des valeurs vides (pas d'erreur).
    Dans tes tests, tu peux surcharger : mock_sb.table(...).select(...).execute.return_value.data = [...]
    """
    mock = MagicMock()
    # Chaînes courantes → listes vides par défaut
    _chain = mock.table.return_value.select.return_value
    _chain.execute.return_value.data = []
    _chain.limit.return_value.execute.return_value.data = []
    _chain.eq.return_value.execute.return_value.data = []
    _chain.eq.return_value.maybe_single.return_value.execute.return_value.data = None
    _chain.eq.return_value.order.return_value.execute.return_value.data = []
    _chain.range.return_value.execute.return_value.data = []
    # Auth
    mock.auth.get_user.return_value = None
    mock.auth.sign_up.return_value = MagicMock(user=None, session=None)
    mock.auth.sign_in_with_password.return_value = MagicMock(user=None, session=None)
    mock.auth.admin.delete_user.return_value = None
    # RPC
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
    Portée 'module' → une seule instance par fichier de test (performant).

    Exemple d'utilisation:
        def test_get_artisans(client):
            resp = client.get("/api/artisans")
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)
    """
    mock_sb = _make_mock_supabase()
    mock_anthropic = MagicMock()
    # Mocker le retour du client Anthropic messages.create
    mock_anthropic.return_value.messages.create.return_value.content = [
        MagicMock(text='{"message":"Test","suggestions":[],"collected":{},"diagnosis":null,"needs_location":false,"ready_to_search":false}')
    ]

    with patch("server.create_client", return_value=mock_sb), \
         patch("server.anthropic_module.Anthropic", return_value=mock_anthropic):

        from fastapi.testclient import TestClient
        from server import app
        import server

        # Injecter les mocks directement dans les globals de server.py
        server.supabase = mock_sb
        server.supabase_anon = mock_sb
        server.anthropic_client = mock_anthropic.return_value

        with TestClient(app, raise_server_exceptions=False) as test_client:
            yield test_client
