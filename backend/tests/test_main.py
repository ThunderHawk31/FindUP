"""
Tests pour le module principal main.py
Tests unitaires et d'intégration pour l'API FindUP
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
import json

from main import app, _build_artisan_response, _update_artisan_rating


class TestBuildArtisanResponse:
    """Tests unitaires pour _build_artisan_response"""
    
    def test_build_artisan_response_authorized_user(self):
        """Test avec utilisateur autorisé - données complètes"""
        artisan_data = {
            "id": 1,
            "nom": "Jean Dupont",
            "description": "Plombier expérimenté",
            "ville": "Paris",
            "note_moyenne": 4.5,
            "nombre_avis": 10,
            "photo_profil": "photo.jpg",
            "certifie": True,
            "disponible": True,
            "telephone": "0123456789",
            "email": "jean@example.com",
            "adresse_complete": "123 rue de la Paix, Paris"
        }
        
        result = _build_artisan_response(artisan_data, user_authorized=True)
        
        assert result["id"] == 1
        assert result["nom"] == "Jean Dupont"
        assert result["telephone"] == "0123456789"
        assert result["email"] == "jean@example.com"
        assert result["adresse_complete"] == "123 rue de la Paix, Paris"
    
    def test_build_artisan_response_unauthorized_user(self):
        """Test avec utilisateur non autorisé - données masquées"""
        artisan_data = {
            "id": 1,
            "nom": "Jean Dupont",
            "description": "Plombier expérimenté",
            "ville": "Paris",
            "note_moyenne": 4.5,
            "nombre_avis": 10,
            "photo_profil": "photo.jpg",
            "certifie": True,
            "disponible": True,
            "telephone": "0123456789",
            "email": "jean@example.com",
            "adresse_complete": "123 rue de la Paix, Paris"
        }
        
        result = _build_artisan_response(artisan_data, user_authorized=False)
        
        assert result["id"] == 1
        assert result["nom"] == "Jean Dupont"
        assert result["telephone"] == "***-***-****"
        assert result["email"] == "***@***.***"
        assert result["adresse_complete"] == "Adresse masquée"
    
    def test_build_artisan_response_missing_fields(self):
        """Test avec données manquantes - valeurs par défaut"""
        artisan_data = {"id": 1}
        
        result = _build_artisan_response(artisan_data, user_authorized=True)
        
        assert result["id"] == 1
        assert result["nom"] == ""
        assert result["description"] == ""
        assert result["ville"] == ""
        assert result["note_moyenne"] == 0
        assert result["nombre_avis"] == 0
        assert result["certifie"] is False
        assert result["disponible"] is True
    
    def test_build_artisan_response_exception_handling(self):
        """Test gestion d'erreur dans _build_artisan_response"""
        # Données invalides qui causent une exception
        artisan_data = None
        
        with pytest.raises(HTTPException) as exc_info:
            _build_artisan_response(artisan_data, user_authorized=True)
        
        assert exc_info.value.status_code == 500
        assert "Erreur interne" in str(exc_info.value.detail)


class TestUpdateArtisanRating:
    """Tests unitaires pour _update_artisan_rating"""
    
    @pytest.mark.asyncio
    @patch('main.supabase_anon')
    @patch('main.supabase_service')
    async def test_update_artisan_rating_success(self, mock_supabase_service, mock_supabase_anon):
        """Test mise à jour réussie de la note"""
        # Mock des avis
        mock_avis_response = Mock()
        mock_avis_response.data = [
            {"note": 5},
            {"note": 4},
            {"note": 3}
        ]
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_avis_response
        
        # Mock de la mise à jour
        mock_supabase_service.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()
        
        await _update_artisan_rating(1)
        
        # Vérifications
        mock_supabase_anon.table.assert_called_with("avis")
        mock_supabase_service.table.assert_called_with("artisans")
        
        # Vérifier que la mise à jour a été appelée avec les bonnes valeurs
        update_call = mock_supabase_service.table.return_value.update.call_args[0][0]
        assert update_call["note_moyenne"] == 4.0  # (5+4+3)/3 = 4.0
        assert update_call["nombre_avis"] == 3
    
    @pytest.mark.asyncio
    @patch('main.supabase_anon')
    @patch('main.logger')
    async def test_update_artisan_rating_no_avis(self, mock_logger, mock_supabase_anon):
        """Test avec aucun avis"""
        # Mock sans avis
        mock_avis_response = Mock()
        mock_avis_response.data = []
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_avis_response
        
        await _update_artisan_rating(1)
        
        # Aucune erreur ne doit être levée
        mock_logger.error.assert_not_called()
    
    @pytest.mark.asyncio
    @patch('main.supabase_anon')
    @patch('main.logger')
    async def test_update_artisan_rating_exception(self, mock_logger, mock_supabase_anon):
        """Test gestion d'erreur"""
        # Mock qui lève une exception
        mock_supabase_anon.table.side_effect = Exception("DB Error")
        
        await _update_artisan_rating(1)
        
        # Vérifier que l'erreur est loggée
        mock_logger.error.assert_called_once()


class TestAPIEndpoints:
    """Tests d'intégration pour les endpoints API"""
    
    def test_root_endpoint(self, client):
        """Test endpoint racine"""
        response = client.get("/")
        assert response.status_code == 200
        assert "FindUP API" in response.json()["message"]
    
    @patch('main.supabase_service')
    def test_health_check_healthy(self, mock_supabase_service, client):
        """Test health check - état sain"""
        mock_response = Mock()
        mock_response.data = [{"artisan_id": 1}]
        mock_supabase_service.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_response

        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["supabase"] == "connected"

    @patch('main.supabase_service')
    def test_health_check_unhealthy(self, mock_supabase_service, client):
        """Test health check - état malsain"""
        mock_supabase_service.table.side_effect = Exception("DB Connection failed")

        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
    
    @patch('main.supabase_anon')
    def test_search_artisans_authenticated(self, mock_supabase_anon, auth_client):
        """Test recherche d'artisans avec utilisateur authentifié"""
        mock_response = Mock()
        mock_response.data = [{
            "id": 1,
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "ville": "Paris",
            "note_moyenne": 4.5,
            "nombre_avis": 10,
            "telephone": "0123456789",
            "email": "jean@example.com"
        }]
        mock_supabase_anon.table.return_value.select.return_value.ilike.return_value.ilike.return_value.eq.return_value.limit.return_value.execute.return_value = mock_response

        response = auth_client.post("/api/search", json={"metier": "Plombier", "ville": "Paris"})

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["nom"] == "Jean Dupont"
        assert data[0]["telephone"] == "0123456789"
    
    @patch('main.supabase_anon')
    def test_search_artisans_unauthenticated(self, mock_supabase_anon, client):
        """Test recherche d'artisans sans authentification"""
        # Mock réponse Supabase
        mock_response = Mock()
        mock_response.data = [{
            "id": 1,
            "nom": "Jean Dupont",
            "metier": "Plombier",
            "ville": "Paris",
            "note_moyenne": 4.5,
            "nombre_avis": 10,
            "telephone": "0123456789",
            "email": "jean@example.com"
        }]
        mock_supabase_anon.table.return_value.select.return_value.ilike.return_value.ilike.return_value.eq.return_value.limit.return_value.execute.return_value = mock_response

        with patch('main.get_current_user', return_value=None):
            response = client.post("/api/search", json={
                "metier": "Plombier",
                "ville": "Paris"
            })

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["nom"] == "Jean Dupont"
        assert data[0]["telephone"] == "***-***-****"
    
    def test_search_artisans_invalid_data(self, client):
        """Test recherche avec type invalide"""
        response = client.post("/api/search", json={"note_min": "invalide"})
        assert response.status_code == 422
    
    @patch('main.supabase_anon')
    def test_get_artisan_details_found(self, mock_supabase_anon, client, mock_user):
        """Test récupération détails artisan - trouvé"""
        # Mock réponse Supabase
        mock_response = Mock()
        mock_response.data = [{
            "id": 1,
            "nom": "Jean Dupont",
            "ville": "Paris",
            "telephone": "0123456789"
        }]
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        with patch('main.get_current_user', return_value=mock_user):
            response = client.get("/api/artisan/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["nom"] == "Jean Dupont"
    
    @patch('main.supabase_anon')
    def test_get_artisan_details_not_found(self, mock_supabase_anon, client):
        """Test récupération détails artisan - non trouvé"""
        # Mock réponse vide
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.get("/api/artisan/999")
        assert response.status_code == 404
        assert "Artisan non trouvé" in response.json()["detail"]
    
    @patch('main.supabase_anon')
    def test_get_artisan_avis(self, mock_supabase_anon, client):
        """Test récupération avis artisan"""
        # Mock réponse avis
        mock_response = Mock()
        mock_response.data = [
            {"id": 1, "note": 5, "commentaire": "Excellent travail"},
            {"id": 2, "note": 4, "commentaire": "Très bien"}
        ]
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        
        response = client.get("/api/artisan/1/avis")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["note"] == 5
    
    @patch('main.supabase_anon')
    @patch('main.supabase_service')
    @patch('main._update_artisan_rating')
    def test_create_avis_success(self, mock_update_rating, mock_supabase_service, mock_supabase_anon, auth_client):
        """Test création avis - succès"""
        mock_artisan_response = Mock()
        mock_artisan_response.data = [{"id": 1}]
        mock_existing_avis = Mock()
        mock_existing_avis.data = []
        mock_create_response = Mock()
        mock_create_response.data = [{"id": 1, "note": 5, "commentaire": "Excellent"}]
        # Artisan existe : table("artisans").select.eq.execute
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_artisan_response
        # Pas de doublon : table("avis").select.eq.eq.execute → []
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing_avis
        mock_supabase_service.table.return_value.insert.return_value.execute.return_value = mock_create_response

        response = auth_client.post("/api/artisan/1/avis", json={
            "artisan_id": 1,
            "note": 5,
            "commentaire": "Excellent travail, très professionnel"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["note"] == 5
        mock_update_rating.assert_called_once_with(1)
    
    @patch('main.supabase_anon')
    def test_create_avis_artisan_not_found(self, mock_supabase_anon, auth_client):
        """Test création avis - artisan non trouvé"""
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        response = auth_client.post("/api/artisan/999/avis", json={
            "artisan_id": 999,
            "note": 5,
            "commentaire": "Test commentaire valide"
        })

        assert response.status_code == 404
        assert "Artisan non trouvé" in response.json()["detail"]
    
    @patch('main.supabase_anon')
    def test_create_avis_already_exists(self, mock_supabase_anon, auth_client):
        """Test création avis - avis déjà existant"""
        mock_artisan_response = Mock()
        mock_artisan_response.data = [{"id": 1}]
        mock_existing_avis = Mock()
        mock_existing_avis.data = [{"id": 1}]
        mock_supabase_anon.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            mock_artisan_response,
            mock_existing_avis
        ]

        response = auth_client.post("/api/artisan/1/avis", json={
            "artisan_id": 1,
            "note": 5,
            "commentaire": "Test commentaire valide"
        })

        assert response.status_code == 400
        assert "déjà donné un avis" in response.json()["detail"]
    
    def test_create_avis_unauthenticated(self, client):
        """Test création avis sans authentification"""
        with patch('main.require_auth', side_effect=HTTPException(status_code=401, detail="Non authentifié")):
            response = client.post("/api/artisan/1/avis", json={
                "note": 5,
                "commentaire": "Test"
            })
        
        assert response.status_code == 401
    
    def test_get_profile_authenticated(self, auth_client, mock_user):
        """Test récupération profil utilisateur authentifié"""
        response = auth_client.get("/api/profile")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == mock_user["id"]
        assert data["email"] == mock_user["email"]
    
    def test_get_profile_unauthenticated(self, client):
        """Test récupération profil sans authentification"""
        with patch('main.require_auth', side_effect=HTTPException(status_code=401, detail="Non authentifié")):
            response = client.get("/api/profile")
        
        assert response.status_code == 401
    
    @patch('main.supabase_service')
    def test_update_profile_success(self, mock_supabase_service, auth_client):
        """Test mise à jour profil - succès"""
        response = auth_client.put("/api/profile", json={"nom": "Nouveau Nom"})

        assert response.status_code == 200
        assert "mis à jour avec succès" in response.json()["message"]
        mock_supabase_service.auth.admin.update_user_by_id.assert_called_once()
    
    @patch('main.chat_rate_limiter')
    @patch('main.anthropic_client')
    def test_chat_with_ai_success(self, mock_anthropic, mock_rate_limiter, auth_client):
        """Test chat IA - succès"""
        mock_rate_limiter.is_allowed.return_value = True
        mock_response = Mock()
        mock_response.content = [Mock(text="Voici ma réponse")]
        mock_anthropic.messages.create.return_value = mock_response

        response = auth_client.post("/api/chat/send", json={
            "message": "Comment choisir un plombier ?"
        })

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["response"] == "Voici ma réponse"
    
    @patch('main.chat_rate_limiter')
    def test_chat_with_ai_rate_limited(self, mock_rate_limiter, auth_client):
        """Test chat IA - rate limité"""
        mock_rate_limiter.is_allowed.return_value = False

        response = auth_client.post("/api/chat/send", json={"message": "Test message"})

        assert response.status_code == 429
        assert "Trop de requêtes" in response.json()["detail"]
    
    def test_chat_with_ai_empty_message(self, auth_client):
        """Test chat IA - message vide"""
        response = auth_client.post("/api/chat/send", json={"message": ""})

        assert response.status_code == 400
        assert "Message requis" in response.json()["detail"]

    def test_chat_with_ai_message_too_long(self, auth_client):
        """Test chat IA - message trop long"""
        response = auth_client.post("/api/chat/send", json={"message": "x" * 501})

        assert response.status_code == 400
        assert "Message trop long" in response.json()["detail"]
    
    def test_chat_with_ai_unauthenticated(self, client):
        """Test chat IA sans authentification"""
        with patch('main.require_auth', side_effect=HTTPException(status_code=401, detail="Non authentifié")):
            response = client.post("/api/chat/send", json={
                "message": "Test"
            })
        
        assert response.status_code == 401


class TestErrorHandling:
    """Tests de gestion d'erreurs globales"""
    
    @patch('main.supabase_anon')
    def test_search_artisans_database_error(self, mock_supabase_anon, client):
        """Test erreur base de données lors de la recherche"""
        # Mock exception Supabase
        mock_supabase_anon.table.side_effect = Exception("Database error")
        
        response = client.post("/api/search", json={
            "metier": "Plombier",
            "ville": "Paris"
        })
        
        assert response.status_code == 500
        assert "Erreur lors de la recherche" in response.json()["detail"]
    
    @patch('main.supabase_anon')
    def test_get_artisan_details_database_error(self, mock_supabase_anon, client):
        """Test erreur base de données lors de la récupération d'artisan"""
        # Mock exception Supabase
        mock_supabase_anon.table.side_effect = Exception("Database error")
        
        response = client.get("/api/artisan/1")
        
        assert response.status_code == 500
        assert "Erreur lors de la récupération" in response.json()["detail"]
    
    @patch('main.supabase_anon')
    def test_get_artisan_avis_database_error(self, mock_supabase_anon, client):
        """Test erreur base de données lors de la récupération d'avis"""
        # Mock exception Supabase
        mock_supabase_anon.table.side_effect = Exception("Database error")
        
        response = client.get("/api/artisan/1/avis")
        
        assert response.status_code == 500
        assert "Erreur lors de la récupération des avis" in response.json()["detail"]


class TestInputValidation:
    """Tests de validation des entrées"""
    
    def test_search_artisans_invalid_field_type(self, client):
        """Test recherche avec type invalide pour note_min"""
        response = client.post("/api/search", json={"note_min": "invalide"})
        assert response.status_code == 422
    
    def test_create_avis_invalid_note(self, auth_client):
        """Test création avis avec note invalide"""
        response = auth_client.post("/api/artisan/1/avis", json={
            "note": 6,
            "commentaire": "Test"
        })
        assert response.status_code == 422

    def test_create_avis_missing_fields(self, auth_client):
        """Test création avis avec champs manquants"""
        response = auth_client.post("/api/artisan/1/avis", json={"note": 5})
        assert response.status_code == 422