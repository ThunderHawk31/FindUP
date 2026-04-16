import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import uuid

# Import du serveur principal
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from server import app, RateLimiter, init_supabase, supabase, supabase_anon


class TestRateLimiter:
    """Tests unitaires pour la classe RateLimiter."""
    
    def test_rate_limiter_init(self):
        """Test d'initialisation du rate limiter."""
        limiter = RateLimiter(max_requests=5, window_seconds=30)
        assert limiter.max_requests == 5
        assert limiter.window_seconds == 30
        assert isinstance(limiter._requests, dict)
    
    def test_rate_limiter_allows_requests_under_limit(self):
        """Test que le rate limiter autorise les requêtes sous la limite."""
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        
        # Première requête autorisée
        assert limiter.is_allowed("test_ip") is True
        # Deuxième requête autorisée
        assert limiter.is_allowed("test_ip") is True
        # Troisième requête autorisée
        assert limiter.is_allowed("test_ip") is True
        # Quatrième requête refusée
        assert limiter.is_allowed("test_ip") is False
    
    def test_rate_limiter_different_ips(self):
        """Test que le rate limiter gère différentes IPs indépendamment."""
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        
        assert limiter.is_allowed("ip1") is True
        assert limiter.is_allowed("ip2") is True
        assert limiter.is_allowed("ip1") is True
        assert limiter.is_allowed("ip2") is True
        # Maintenant les deux IPs ont atteint leur limite
        assert limiter.is_allowed("ip1") is False
        assert limiter.is_allowed("ip2") is False
    
    def test_rate_limiter_retry_after(self):
        """Test du calcul du temps d'attente."""
        limiter = RateLimiter(max_requests=1, window_seconds=60)
        
        # Première requête
        limiter.is_allowed("test_ip")
        # Deuxième requête refusée
        assert limiter.is_allowed("test_ip") is False
        
        # Le retry_after devrait être > 0
        retry_time = limiter.retry_after("test_ip")
        assert retry_time > 0
        assert retry_time <= 61  # Maximum window_seconds + 1


class TestModels:
    """Tests unitaires pour les modèles Pydantic."""
    
    def test_artisan_create_valid(self):
        """Test de création d'un artisan valide."""
        from server import ArtisanCreate
        
        artisan_data = {
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001",
            "description": "Plombier expérimenté",
            "telephone": "0123456789",
            "email": "jean@example.com",
            "site_web": "https://jean-plombier.fr",
            "prix_min": 50.0,
            "prix_max": 150.0
        }
        
        artisan = ArtisanCreate(**artisan_data)
        assert artisan.nom == "Jean Dupont"
        assert artisan.metier == "Plombier"
        assert artisan.email == "jean@example.com"
    
    def test_artisan_create_invalid_email(self):
        """Test de validation d'email invalide."""
        from server import ArtisanCreate
        from pydantic import ValidationError
        
        artisan_data = {
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001",
            "email": "email-invalide"
        }
        
        with pytest.raises(ValidationError):
            ArtisanCreate(**artisan_data)
    
    def test_artisan_create_empty_nom(self):
        """Test de validation nom vide."""
        from server import ArtisanCreate
        from pydantic import ValidationError
        
        artisan_data = {
            "nom": "",
            "metier": "Plombier",
            "localisation": "Paris 75001"
        }
        
        with pytest.raises(ValidationError):
            ArtisanCreate(**artisan_data)
    
    def test_user_create_valid(self):
        """Test de création d'utilisateur valide."""
        from server import UserCreate
        
        user_data = {
            "email": "test@example.com",
            "password": "motdepasse123",
            "nom": "Test User"
        }
        
        user = UserCreate(**user_data)
        assert user.email == "test@example.com"
        assert user.nom == "Test User"
    
    def test_user_create_password_too_short(self):
        """Test de validation mot de passe trop court."""
        from server import UserCreate
        from pydantic import ValidationError
        
        user_data = {
            "email": "test@example.com",
            "password": "123",  # Trop court
            "nom": "Test User"
        }
        
        with pytest.raises(ValidationError):
            UserCreate(**user_data)
    
    def test_chat_message_valid(self):
        """Test de création de message de chat valide."""
        from server import ChatMessage
        
        msg_data = {
            "message": "Bonjour, je cherche un plombier",
            "conversation_history": [
                {"role": "user", "content": "Message précédent"}
            ]
        }
        
        msg = ChatMessage(**msg_data)
        assert msg.message == "Bonjour, je cherche un plombier"
        assert len(msg.conversation_history) == 1
    
    def test_chat_message_empty_message(self):
        """Test de validation message vide."""
        from server import ChatMessage
        from pydantic import ValidationError
        
        msg_data = {
            "message": "",  # Vide
        }
        
        with pytest.raises(ValidationError):
            ChatMessage(**msg_data)
    
    def test_chat_message_too_long(self):
        """Test de validation message trop long."""
        from server import ChatMessage
        from pydantic import ValidationError
        
        msg_data = {
            "message": "x" * 2001,  # Trop long (max 2000)
        }
        
        with pytest.raises(ValidationError):
            ChatMessage(**msg_data)
    
    def test_review_create_valid(self):
        """Test de création d'avis valide."""
        from server import ReviewCreate
        
        review_data = {
            "artisan_id": str(uuid.uuid4()),
            "note": 4,
            "commentaire": "Très bon travail"
        }
        
        review = ReviewCreate(**review_data)
        assert review.note == 4
        assert review.commentaire == "Très bon travail"
    
    def test_review_create_invalid_note(self):
        """Test de validation note invalide."""
        from server import ReviewCreate
        from pydantic import ValidationError
        
        review_data = {
            "artisan_id": str(uuid.uuid4()),
            "note": 6,  # Invalide (max 5)
            "commentaire": "Test"
        }
        
        with pytest.raises(ValidationError):
            ReviewCreate(**review_data)


class TestArtisanRoutes:
    """Tests d'intégration pour les routes artisans."""
    
    def test_create_artisan_success(self, client, mock_supabase):
        """Test de création d'artisan réussie."""
        # Mock de la réponse Supabase
        mock_result = Mock()
        mock_result.data = [{
            "artisan_id": "test-id",
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001",
            "description": "Plombier expérimenté",
            "telephone": "0123456789",
            "email": "jean@example.com",
            "site_web": "https://jean-plombier.fr",
            "prix_min": 50.0,
            "prix_max": 150.0,
            "avis_moyen": None,
            "nombre_avis": None,
            "created_at": "2024-01-01T00:00:00Z"
        }]
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
        
        artisan_data = {
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001",
            "description": "Plombier expérimenté",
            "telephone": "0123456789",
            "email": "jean@example.com",
            "site_web": "https://jean-plombier.fr",
            "prix_min": 50.0,
            "prix_max": 150.0
        }
        
        response = client.post("/api/artisans", json=artisan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Jean Dupont"
        assert data["metier"] == "Plombier"
    
    def test_create_artisan_invalid_data(self, client):
        """Test de création d'artisan avec données invalides."""
        artisan_data = {
            "nom": "",  # Nom vide
            "metier": "Plombier",
            "localisation": "Paris 75001"
        }
        
        response = client.post("/api/artisans", json=artisan_data)
        assert response.status_code == 422  # Validation error
    
    def test_get_artisan_success(self, client, mock_supabase):
        """Test de récupération d'artisan réussie."""
        mock_result = Mock()
        mock_result.data = {
            "artisan_id": "test-id",
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001",
            "description": "Plombier expérimenté",
            "telephone": "0123456789",
            "email": "jean@example.com",
            "site_web": "https://jean-plombier.fr",
            "prix_min": 50.0,
            "prix_max": 150.0,
            "avis_moyen": 4.5,
            "nombre_avis": 10,
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
        
        response = client.get("/api/artisans/test-id")
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Jean Dupont"
    
    def test_get_artisan_not_found(self, client, mock_supabase):
        """Test de récupération d'artisan inexistant."""
        mock_result = Mock()
        mock_result.data = None
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
        
        response = client.get("/api/artisans/inexistant")
        assert response.status_code == 404
    
    def test_list_artisans_success(self, client, mock_supabase):
        """Test de listage d'artisans réussi."""
        mock_result = Mock()
        mock_result.data = [
            {
                "artisan_id": "test-id-1",
                "nom": "Jean Dupont",
                "metier": "Plombier",
                "localisation": "Paris 75001"
            },
            {
                "artisan_id": "test-id-2",
                "nom": "Marie Martin",
                "metier": "Électricien",
                "localisation": "Lyon 69001"
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/artisans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["nom"] == "Jean Dupont"
    
    def test_list_artisans_with_filters(self, client, mock_supabase):
        """Test de listage d'artisans avec filtres."""
        mock_result = Mock()
        mock_result.data = []
        
        mock_supabase.table.return_value.select.return_value.ilike.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/artisans?metier=plombier&localisation=paris")
        assert response.status_code == 200
    
    def test_update_artisan_success(self, client, mock_supabase):
        """Test de mise à jour d'artisan réussie."""
        mock_result = Mock()
        mock_result.data = [{
            "artisan_id": "test-id",
            "nom": "Jean Dupont Modifié",
            "metier": "Plombier",
            "localisation": "Paris 75001"
        }]
        
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result
        
        update_data = {"nom": "Jean Dupont Modifié"}
        response = client.put("/api/artisans/test-id", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Jean Dupont Modifié"
    
    def test_delete_artisan_success(self, client, mock_supabase):
        """Test de suppression d'artisan réussie."""
        mock_result = Mock()
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_result
        
        response = client.delete("/api/artisans/test-id")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Artisan supprimé"


class TestUserRoutes:
    """Tests d'intégration pour les routes utilisateurs."""
    
    def test_register_user_success(self, client, mock_supabase):
        """Test d'enregistrement d'utilisateur réussi."""
        mock_result = Mock()
        mock_result.data = [{
            "user_id": "test-user-id",
            "email": "test@example.com",
            "nom": "Test User",
            "created_at": "2024-01-01T00:00:00Z"
        }]
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
        
        user_data = {
            "email": "test@example.com",
            "password": "motdepasse123",
            "nom": "Test User"
        }
        
        response = client.post("/api/users/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["nom"] == "Test User"
    
    def test_register_user_invalid_email(self, client):
        """Test d'enregistrement avec email invalide."""
        user_data = {
            "email": "email-invalide",
            "password": "motdepasse123",
            "nom": "Test User"
        }
        
        response = client.post("/api/users/register", json=user_data)
        assert response.status_code == 422
    
    def test_login_user_success(self, client, mock_supabase):
        """Test de connexion d'utilisateur réussie."""
        mock_result = Mock()
        mock_result.data = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "password": "motdepasse123",
            "nom": "Test User"
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
        
        login_data = {
            "email": "test@example.com",
            "password": "motdepasse123"
        }
        
        response = client.post("/api/users/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "user_id" in data
    
    def test_login_user_invalid_credentials(self, client, mock_supabase):
        """Test de connexion avec identifiants invalides."""
        mock_result = Mock()
        mock_result.data = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "password": "motdepasse123",
            "nom": "Test User"
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
        
        login_data = {
            "email": "test@example.com",
            "password": "mauvais-mot-de-passe"
        }
        
        response = client.post("/api/users/login", json=login_data)
        assert response.status_code == 401
    
    def test_get_user_success(self, client, mock_supabase):
        """Test de récupération d'utilisateur réussie."""
        mock_result = Mock()
        mock_result.data = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "nom": "Test User",
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
        
        response = client.get("/api/users/test-user-id")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


class TestReviewRoutes:
    """Tests d'intégration pour les routes d'avis."""
    
    def test_create_review_success(self, client, mock_supabase):
        """Test de création d'avis réussie."""
        mock_result = Mock()
        mock_result.data = [{
            "review_id": "test-review-id",
            "artisan_id": "test-artisan-id",
            "user_id": "anonymous",
            "note": 4,
            "commentaire": "Très bon travail",
            "created_at": "2024-01-01T00:00:00Z"
        }]
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
        
        review_data = {
            "artisan_id": "test-artisan-id",
            "note": 4,
            "commentaire": "Très bon travail"
        }
        
        response = client.post("/api/reviews", json=review_data)
        assert response.status_code == 200
        data = response.json()
        assert data["note"] == 4
        assert data["commentaire"] == "Très bon travail"
    
    def test_create_review_invalid_note(self, client):
        """Test de création d'avis avec note invalide."""
        review_data = {
            "artisan_id": "test-artisan-id",
            "note": 6,  # Invalide (max 5)
            "commentaire": "Test"
        }
        
        response = client.post("/api/reviews", json=review_data)
        assert response.status_code == 422
    
    def test_get_reviews_success(self, client, mock_supabase):
        """Test de récupération d'avis réussie."""
        mock_result = Mock()
        mock_result.data = [
            {
                "review_id": "review-1",
                "artisan_id": "test-artisan-id",
                "note": 4,
                "commentaire": "Bon travail"
            },
            {
                "review_id": "review-2",
                "artisan_id": "test-artisan-id",
                "note": 5,
                "commentaire": "Excellent"
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result
        
        response = client.get("/api/reviews/artisan/test-artisan-id")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["note"] == 4


class TestSearchRoutes:
    """Tests d'intégration pour les routes de recherche."""
    
    def test_search_success(self, client, mock_supabase):
        """Test de recherche réussie."""
        mock_result = Mock()
        mock_result.data = [
            {
                "artisan_id": "test-id-1",
                "nom": "Jean Plombier",
                "metier": "Plombier",
                "localisation": "Paris"
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value = mock_result
        
        response = client.get("/api/search?q=plombier")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["metier"] == "Plombier"
    
    def test_search_empty_query(self, client):
        """Test de recherche avec requête vide."""
        response = client.get("/api/search?q=")
        assert response.status_code == 422
    
    def test_search_rate_limit(self, client, mock_supabase):
        """Test du rate limiting sur la recherche."""
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value = mock_result
        
        # Faire 21 requêtes (limite = 20)
        for i in range(21):
            response = client.get(f"/api/search?q=test{i}")
            if i < 20:
                assert response.status_code == 200
            else:
                assert response.status_code == 429  # Too Many Requests


class TestChatRoutes:
    """Tests d'intégration pour les routes de chat."""
    
    @patch('server.anthropic_client')
    def test_chat_send_success(self, mock_anthropic, client):
        """Test d'envoi de message de chat réussi."""
        # Mock de la réponse Anthropic
        mock_response = Mock()
        mock_response.content = [Mock(text="Bonjour ! Comment puis-je vous aider ?")]
        mock_anthropic.messages.create.return_value = mock_response
        
        chat_data = {
            "message": "Bonjour, je cherche un plombier",
            "conversation_history": []
        }
        
        response = client.post("/api/chat/send", json=chat_data)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "conversation_history" in data
    
    def test_chat_send_empty_message(self, client):
        """Test d'envoi de message vide."""
        chat_data = {
            "message": "",
            "conversation_history": []
        }
        
        response = client.post("/api/chat/send", json=chat_data)
        assert response.status_code == 422
    
    def test_chat_send_rate_limit(self, client):
        """Test du rate limiting sur le chat."""
        chat_data = {
            "message": "Test message",
            "conversation_history": []
        }
        
        # Faire 11 requêtes (limite = 10)
        with patch('server.anthropic_client') as mock_anthropic:
            mock_response = Mock()
            mock_response.content = [Mock(text="Réponse test")]
            mock_anthropic.messages.create.return_value = mock_response
            
            for i in range(11):
                response = client.post("/api/chat/send", json=chat_data)
                if i < 10:
                    assert response.status_code == 200
                else:
                    assert response.status_code == 429  # Too Many Requests


class TestHistoryRoutes:
    """Tests d'intégration pour les routes d'historique."""
    
    def test_add_to_history_success(self, client, mock_supabase):
        """Test d'ajout à l'historique réussi."""
        # Mock pour la vérification utilisateur
        mock_user_result = Mock()
        mock_user_result.data = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "nom": "Test User"
        }
        
        # Mock pour récupérer le nom de l'artisan
        mock_artisan_result = Mock()
        mock_artisan_result.data = {"nom": "Jean Plombier"}
        
        # Mock pour l'insertion dans l'historique
        mock_insert_result = Mock()
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.side_effect = [
            mock_user_result,  # Première requête pour l'utilisateur
            mock_artisan_result  # Deuxième requête pour l'artisan
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_result
        
        headers = {"Authorization": "Bearer test-user-id"}
        response = client.post("/api/history/add/test-artisan-id", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ajouté à l'historique"
    
    def test_add_to_history_no_auth(self, client):
        """Test d'ajout à l'historique sans authentification."""
        response = client.post("/api/history/add/test-artisan-id")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Non connecté, historique non enregistré"


class TestInitialization:
    """Tests pour l'initialisation de l'application."""
    
    @patch('server.create_client')
    @patch.dict(os.environ, {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_KEY': 'test-key',
        'SUPABASE_ANON_KEY': 'test-anon-key'
    })
    def test_init_supabase_success(self, mock_create_client):
        """Test d'initialisation Supabase réussie."""
        mock_client = Mock()
        mock_create_client.return_value = mock_client
        
        init_supabase()
        
        assert mock_create_client.call_count == 2
        mock_create_client.assert_any_call('https://test.supabase.co', 'test-key')
        mock_create_client.assert_any_call('https://test.supabase.co', 'test-anon-key')
    
    @patch.dict(os.environ, {}, clear=True)
    def test_init_supabase_missing_env(self):
        """Test d'initialisation Supabase avec variables manquantes."""
        with pytest.raises(ValueError, match="Variables d'environnement Supabase manquantes"):
            init_supabase()


class TestErrorHandling:
    """Tests pour la gestion d'erreurs."""
    
    def test_create_artisan_database_error(self, client, mock_supabase):
        """Test de gestion d'erreur base de données lors de création d'artisan."""
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Database error")
        
        artisan_data = {
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "localisation": "Paris 75001"
        }
        
        response = client.post("/api/artisans", json=artisan_data)
        assert response.status_code == 500
    
    def test_get_artisan_database_error(self, client, mock_supabase):
        """Test de gestion d'erreur base de données lors de récupération d'artisan."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.side_effect = Exception("Database error")
        
        response = client.get("/api/artisans/test-id")
        assert response.status_code == 500
    
    @patch('server.anthropic_client')
    def test_chat_send_anthropic_error(self, mock_anthropic, client):
        """Test de gestion d'erreur Anthropic lors du chat."""
        mock_anthropic.messages.create.side_effect = Exception("Anthropic API error")
        
        chat_data = {
            "message": "Test message",
            "conversation_history": []
        }
        
        response = client.post("/api/chat/send", json=chat_data)
        assert response.status_code == 500