"""Tests pour les endpoints d'authentification."""

import pytest
import uuid
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient


class TestRegister:
    """Tests pour POST /api/auth/register"""

    def test_register_success(self, client, test_user_data):
        """Test inscription réussie."""
        with patch('server.supabase_anon.auth.sign_up') as mock_signup:
            mock_response = Mock()
            mock_response.user = Mock(id=f"user_{uuid.uuid4().hex[:12]}")
            mock_response.session = Mock(access_token="test_token_123")
            mock_signup.return_value = mock_response
            
            with patch('server.supabase.table') as mock_table:
                mock_insert = Mock()
                mock_insert.insert.return_value.execute.return_value = Mock(data=[test_user_data])
                mock_table.return_value = mock_insert
                
                response = client.post("/api/auth/register", json=test_user_data)
                
                assert response.status_code == 200
                data = response.json()
                assert "token" in data or "access_token" in data
                assert "user" in data

    def test_register_duplicate_email(self, client, test_user_data):
        """Test inscription avec email déjà utilisé."""
        with patch('server.supabase_anon.auth.sign_up') as mock_signup:
            mock_signup.side_effect = Exception("User already exists")
            
            response = client.post("/api/auth/register", json=test_user_data)
            
            assert response.status_code in [400, 409]

    def test_register_invalid_email(self, client):
        """Test inscription avec email invalide."""
        invalid_data = {
            "email": "invalid-email",
            "password": "TestPassword123!",
            "name": "Test User"
        }
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422

    def test_register_weak_password(self, client):
        """Test inscription avec mot de passe faible."""
        weak_password_data = {
            "email": "test@example.com",
            "password": "123",
            "name": "Test User"
        }
        
        response = client.post("/api/auth/register", json=weak_password_data)
        
        assert response.status_code == 422

    def test_register_missing_field(self, client):
        """Test inscription avec champ manquant."""
        incomplete_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = client.post("/api/auth/register", json=incomplete_data)
        
        assert response.status_code == 422


class TestLogin:
    """Tests pour POST /api/auth/login"""

    def test_login_success(self, client, test_user_data):
        """Test connexion réussie."""
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        with patch('server.supabase_anon.auth.sign_in_with_password') as mock_signin:
            mock_response = Mock()
            mock_response.user = Mock(id=f"user_{uuid.uuid4().hex[:12]}", email=test_user_data["email"])
            mock_response.session = Mock(access_token="test_token_123")
            mock_signin.return_value = mock_response
            
            response = client.post("/api/auth/login", json=login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "token" in data or "access_token" in data
            assert "user" in data

    def test_login_invalid_credentials(self, client):
        """Test connexion avec mauvais identifiants."""
        login_data = {
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }
        
        with patch('server.supabase_anon.auth.sign_in_with_password') as mock_signin:
            mock_signin.side_effect = Exception("Invalid credentials")
            
            response = client.post("/api/auth/login", json=login_data)
            
            assert response.status_code == 401

    def test_login_user_not_found(self, client):
        """Test connexion utilisateur inexistant."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPassword123!"
        }
        
        with patch('server.supabase_anon.auth.sign_in_with_password') as mock_signin:
            mock_signin.side_effect = Exception("User not found")
            
            response = client.post("/api/auth/login", json=login_data)
            
            assert response.status_code == 401

    def test_login_missing_email(self, client):
        """Test connexion sans email."""
        incomplete_data = {
            "password": "TestPassword123!"
        }
        
        response = client.post("/api/auth/login", json=incomplete_data)
        
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        """Test connexion sans mot de passe."""
        incomplete_data = {
            "email": "test@example.com"
        }
        
        response = client.post("/api/auth/login", json=incomplete_data)
        
        assert response.status_code == 422


class TestGetMe:
    """Tests pour GET /api/auth/me"""

    def test_get_me_authenticated(self, client, auth_headers, mock_current_user):
        """Test récupération profil utilisateur authentifié."""
        with patch('server.require_auth') as mock_require_auth:
            mock_require_auth.return_value = mock_current_user
            
            response = client.get("/api/auth/me", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == mock_current_user["user_id"]
            assert data["email"] == mock_current_user["email"]

    def test_get_me_unauthenticated(self, client):
        """Test récupération profil sans authentification."""
        with patch('server.require_auth') as mock_require_auth:
            mock_require_auth.side_effect = Exception("401")
            
            response = client.get("/api/auth/me")
            
            assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        """Test récupération profil avec token invalide."""
        invalid_headers = {
            "Authorization": "Bearer invalid_token_xyz"
        }
        
        with patch('server.require_auth') as mock_require_auth:
            mock_require_auth.side_effect = Exception("Invalid token")
            
            response = client.get("/api/auth/me", headers=invalid_headers)
            
            assert response.status_code == 401

    def test_get_me_expired_token(self, client):
        """Test récupération profil avec token expiré."""
        expired_headers = {
            "Authorization": "Bearer expired_token_123"
        }
        
        with patch('server.require_auth') as mock_require_auth:
            mock_require_auth.side_effect = Exception("Token expired")
            
            response = client.get("/api/auth/me", headers=expired_headers)
            
            assert response.status_code == 401


class TestLogout:
    """Tests pour POST /api/auth/logout"""

    def test_logout_success(self, client, auth_headers):
        """Test déconnexion réussie."""
        with patch('server.supabase_anon.auth.sign_out') as mock_signout:
            mock_signout.return_value = None
            
            response = client.post("/api/auth/logout", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data or "success" in data

    def test_logout_without_auth(self, client):
        """Test déconnexion sans authentification."""
        response = client.post("/api/auth/logout")
        
        # Logout peut être idempotent (200) ou nécessiter auth (401)
        assert response.status_code in [200, 401]

    def test_logout_clears_session(self, client, auth_headers):
        """Test que logout efface la session."""
        with patch('server.supabase_anon.auth.sign_out') as mock_signout:
            mock_signout.return_value = None
            
            response = client.post("/api/auth/logout", headers=auth_headers)
            
            assert response.status_code == 200
            # Vérifier que le cookie de session est supprimé
            assert "session_token" not in response.cookies or response.cookies.get("session_token") == ""


class TestDeleteAccount:
    """Tests pour DELETE /api/auth/account"""

    def test_delete_account_authenticated(self, client, auth_headers, mock_current_user):
        """Test suppression compte utilisateur authentifié."""
        with patch('server.require_auth') as mock_require_auth:
            with patch('server.supabase.table') as mock_table:
                mock_require_auth.return_value = mock_current_user
                
                mock_delete = Mock()
                mock_delete.delete.return_value.eq.return_value.execute.return_value = Mock(data=[])
                mock_table.return_value = mock_delete
                
                with patch('server.supabase_anon.auth.admin_delete_user') as mock_delete_user:
                    mock_delete_user.return_value = None
                    
                    response = client.delete("/api/auth/account", headers=auth_headers)
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "message" in data or "success" in data

    def test_delete_account_unauthenticated(self, client):
        """Test suppression compte sans authentification."""
        with patch('server.require_auth') as mock_require_auth:
            mock_require_auth.side_effect = Exception("401")
            
            response = client.delete("/api/auth/account")
            
            assert response.status_code == 401

    def test_delete_account_not_found(self, client, auth_headers):
        """Test suppression compte inexistant."""
        with patch('server.require_auth') as mock_require_auth:
            with patch('server.supabase.table') as mock_table:
                mock_require_auth.return_value = {
                    "user_id": "nonexistent_user",
                    "email": "nonexistent@example.com"
                }
                
                mock_delete = Mock()
                mock_delete.delete.return_value.eq.return_value.execute.return_value = Mock(data=[])
                mock_table.return_value = mock_delete
                
                response = client.delete("/api/auth/account", headers=auth_headers)
                
                assert response.status_code in [200, 404]

    def test_delete_account_confirmation(self, client, auth_headers):
        """Test suppression compte avec confirmation."""
        confirmation_data = {
            "confirm": True,
            "password": "TestPassword123!"
        }
        
        with patch('server.require_auth') as mock_require_auth:
            with patch('server.supabase_anon.auth.sign_in_with_password') as mock_verify:
                mock_require_auth.return_value = {
                    "user_id": f"user_{uuid.uuid4().hex[:12]}",
                    "email": "test@example.com"
                }
                mock_verify.return_value = Mock(user=Mock(id="test_user"))
                
                response = client.delete("/api/auth/account", json=confirmation_data, headers=auth_headers)
                
                assert response.status_code in [200, 401]
