"""
Module d'authentification pour l'API FindUP
Gestion des tokens JWT et vérification des utilisateurs
"""

import os
import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

# Configuration Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    raise ValueError("Variables d'environnement Supabase manquantes pour l'authentification")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    Récupère l'utilisateur actuel depuis le token JWT (optionnel)
    Retourne None si pas de token ou token invalide
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        
        # Vérification du token avec Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return None
        
        # Récupération des informations utilisateur depuis la base
        user_data = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not user_data.data:
            return None
        
        return user_data.data[0]
        
    except Exception:
        # En cas d'erreur, on retourne None (pas d'exception levée)
        return None

async def require_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """
    Vérifie l'authentification obligatoire
    Lève une exception si l'utilisateur n'est pas authentifié
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification requis",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        token = credentials.credentials
        
        # Vérification du token avec Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Récupération des informations utilisateur depuis la base
        user_data = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not user_data.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur non trouvé",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_data.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur lors de la vérification du token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_admin_role(user: Dict[str, Any]) -> bool:
    """
    Vérifie si l'utilisateur a le rôle administrateur
    """
    return user.get("role") == "admin"

async def require_admin(current_user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    """
    Vérifie l'authentification et le rôle administrateur
    """
    if not verify_admin_role(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès administrateur requis"
        )
    
    return current_user