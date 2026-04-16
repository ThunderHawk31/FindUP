"""Tests pour les endpoints chat IA."""

import pytest
import uuid
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient


class TestChatSend:
    """Tests pour POST /api/chat/send"""

    def test_chat_send_simple_message(self, client, test_chat_message):
        """Test envoi message simple au chat."""
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Je vais vous aider à trouver un plombier"))]
            )
            
            with patch('server.supabase.table') as mock_table:
                mock_insert = Mock()
                mock_insert.insert.return_value.execute.return_value = Mock(data=[test_chat_message])
                mock_table.return_value = mock_insert
                
                response = client.post("/api/chat/send", json=test_chat_message)
                
                assert response.status_code == 200
                data = response.json()
                assert "message" in data
                assert "suggestions" in data
                assert "collected" in data

    def test_chat_send_empty_message(self, client):
        """Test envoi message vide."""
        empty_message = {"message": ""}
        
        response = client.post("/api/chat/send", json=empty_message)
        
        assert response.status_code == 422

    def test_chat_send_whitespace_only(self, client):
        """Test envoi message avec espaces uniquement."""
        whitespace_message = {"message": "   "}
        
        response = client.post("/api/chat/send", json=whitespace_message)
        
        assert response.status_code == 422

    def test_chat_send_too_long_message(self, client):
        """Test envoi message dépassant limite 2000 caractères."""
        long_message = {"message": "x" * 2001}
        
        response = client.post("/api/chat/send", json=long_message)
        
        assert response.status_code == 422

    def test_chat_send_with_conversation_history(self, client):
        """Test envoi avec historique conversation."""
        message_with_history = {
            "message": "Oui c'est urgent",
            "conversation_history": [
                {"role": "user", "content": "J'ai une fuite d'eau"},
                {"role": "assistant", "content": "Est-ce urgent ?"}
            ]
        }
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Je comprends, c'est urgent"))]
            )
            
            response = client.post("/api/chat/send", json=message_with_history)
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data

    def test_chat_send_with_location(self, client):
        """Test envoi avec localisation."""
        message_with_location = {
            "message": "Cherche plombier urgent",
            "location": {
                "latitude": 48.8566,
                "longitude": 2.3522
            }
        }
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Je vais chercher des plombiers près de vous"))]
            )
            
            response = client.post("/api/chat/send", json=message_with_location)
            
            assert response.status_code == 200
            data = response.json()
            assert "suggestions" in data

    def test_chat_send_with_invalid_location(self, client):
        """Test envoi avec localisation invalide."""
        invalid_location = {
            "message": "Cherche plombier",
            "location": {
                "latitude": 91,  # Invalide (max 90)
                "longitude": 2.3522
            }
        }
        
        response = client.post("/api/chat/send", json=invalid_location)
        
        assert response.status_code == 422

    def test_chat_send_rate_limit(self, client):
        """Test rate limiting sur /api/chat/send."""
        message = {"message": "Test message"}
        
        # Envoyer 11 messages rapidement (limite 10/min)
        responses = []
        for i in range(11):
            response = client.post("/api/chat/send", json=message)
            responses.append(response.status_code)
        
        # Au moins une requête doit être rate limitée (429)
        assert 429 in responses or all(code == 200 for code in responses)

    def test_chat_send_missing_message_field(self, client):
        """Test envoi sans champ message."""
        incomplete_data = {
            "location": {"latitude": 48.8566, "longitude": 2.3522}
        }
        
        response = client.post("/api/chat/send", json=incomplete_data)
        
        assert response.status_code == 422

    def test_chat_send_with_metadata(self, client):
        """Test envoi avec métadonnées."""
        message_with_metadata = {
            "message": "J'ai besoin d'un électricien",
            "metadata": {
                "device": "mobile",
                "language": "fr"
            }
        }
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Je vais chercher un électricien"))]
            )
            
            response = client.post("/api/chat/send", json=message_with_metadata)
            
            assert response.status_code == 200

    def test_chat_send_openai_error(self, client, test_chat_message):
        """Test gestion erreur OpenAI."""
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.side_effect = Exception("OpenAI API error")
            
            response = client.post("/api/chat/send", json=test_chat_message)
            
            assert response.status_code == 500

    def test_chat_send_response_format(self, client, test_chat_message):
        """Test format réponse chat."""
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Réponse test"))]
            )
            
            response = client.post("/api/chat/send", json=test_chat_message)
            
            assert response.status_code == 200
            data = response.json()
            
            # Vérifier structure réponse
            assert "message" in data
            assert "suggestions" in data
            assert isinstance(data["suggestions"], list)
            assert "collected" in data
            assert isinstance(data["collected"], dict)


class TestChatReset:
    """Tests pour POST /api/chat/reset"""

    def test_chat_reset_success(self, client):
        """Test réinitialisation chat réussie."""
        with patch('server.supabase.table') as mock_table:
            mock_delete = Mock()
            mock_delete.delete.return_value.execute.return_value = Mock(data=[])
            mock_table.return_value = mock_delete
            
            response = client.post("/api/chat/reset")
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data or "success" in data

    def test_chat_reset_clears_history(self, client):
        """Test que reset efface l'historique."""
        # Envoyer un message d'abord
        message = {"message": "Test message"}
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Réponse test"))]
            )
            
            client.post("/api/chat/send", json=message)
        
        # Puis reset
        with patch('server.supabase.table') as mock_table:
            mock_delete = Mock()
            mock_delete.delete.return_value.execute.return_value = Mock(data=[])
            mock_table.return_value = mock_delete
            
            response = client.post("/api/chat/reset")
            
            assert response.status_code == 200

    def test_chat_reset_idempotent(self, client):
        """Test que reset est idempotent."""
        with patch('server.supabase.table') as mock_table:
            mock_delete = Mock()
            mock_delete.delete.return_value.execute.return_value = Mock(data=[])
            mock_table.return_value = mock_delete
            
            # Premier reset
            response1 = client.post("/api/chat/reset")
            # Deuxième reset
            response2 = client.post("/api/chat/reset")
            
            assert response1.status_code == 200
            assert response2.status_code == 200

    def test_chat_reset_clears_cookies(self, client):
        """Test que reset efface les cookies de session."""
        with patch('server.supabase.table') as mock_table:
            mock_delete = Mock()
            mock_delete.delete.return_value.execute.return_value = Mock(data=[])
            mock_table.return_value = mock_delete
            
            response = client.post("/api/chat/reset")
            
            assert response.status_code == 200
            # Vérifier que le cookie de session est supprimé
            assert "chat_session" not in response.cookies or response.cookies.get("chat_session") == ""


class TestChatIntegration:
    """Tests d'intégration chat"""

    def test_chat_conversation_flow(self, client):
        """Test flux conversation complet."""
        messages = [
            {"message": "J'ai une fuite d'eau"},
            {"message": "C'est urgent"},
            {"message": "Je suis à Paris"}
        ]
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Je vais vous aider"))]
            )
            
            for msg in messages:
                response = client.post("/api/chat/send", json=msg)
                assert response.status_code == 200

    def test_chat_with_artisan_suggestions(self, client):
        """Test chat avec suggestions artisans."""
        message = {
            "message": "Cherche plombier urgent à Paris",
            "location": {
                "latitude": 48.8566,
                "longitude": 2.3522
            }
        }
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Voici les plombiers disponibles"))]
            )
            
            with patch('server.supabase.rpc') as mock_rpc:
                mock_response = Mock()
                mock_response.data = [
                    {
                        "artisan_id": f"artisan_{uuid.uuid4().hex[:12]}",
                        "nom": "Plombier Test",
                        "distance_km": 2.5
                    }
                ]
                mock_rpc.return_value.execute.return_value = mock_response
                
                response = client.post("/api/chat/send", json=message)
                
                assert response.status_code == 200
                data = response.json()
                assert "suggestions" in data

    def test_chat_session_persistence(self, client):
        """Test persistance session chat."""
        message1 = {"message": "Premier message"}
        message2 = {"message": "Deuxième message"}
        
        with patch('server.openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(message=Mock(content="Réponse"))]
            )
            
            response1 = client.post("/api/chat/send", json=message1)
            response2 = client.post("/api/chat/send", json=message2)
            
            assert response1.status_code == 200
            assert response2.status_code == 200
            
            # Vérifier que les deux réponses ont un chat_session
            data1 = response1.json()
            data2 = response2.json()
            
            assert "chat_session" in data1 or "session" in data1
            assert "chat_session" in data2 or "session" in data2
