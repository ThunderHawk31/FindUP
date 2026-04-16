"""
Module de rate limiting pour l'API FindUP
Implémentation d'un limiteur de taux en mémoire avec fenêtre glissante
"""

import time
from typing import Dict, List
from collections import defaultdict, deque
import threading

class RateLimiter:
    """
    Rate limiter avec fenêtre glissante
    Stockage en mémoire (non persistant)
    """
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        """
        Initialise le rate limiter
        
        Args:
            max_requests: Nombre maximum de requêtes autorisées
            window_seconds: Durée de la fenêtre en secondes
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Vérifie si une requête est autorisée pour un identifiant donné
        
        Args:
            identifier: Identifiant unique (généralement l'IP)
            
        Returns:
            True si la requête est autorisée, False sinon
        """
        current_time = time.time()
        
        with self.lock:
            # Récupération de la queue des requêtes pour cet identifiant
            request_times = self.requests[identifier]
            
            # Suppression des requêtes trop anciennes
            while request_times and request_times[0] <= current_time - self.window_seconds:
                request_times.popleft()
            
            # Vérification si on peut ajouter une nouvelle requête
            if len(request_times) < self.max_requests:
                request_times.append(current_time)
                return True
            
            return False
    
    def get_remaining_requests(self, identifier: str) -> int:
        """
        Retourne le nombre de requêtes restantes pour un identifiant
        
        Args:
            identifier: Identifiant unique
            
        Returns:
            Nombre de requêtes restantes
        """
        current_time = time.time()
        
        with self.lock:
            request_times = self.requests[identifier]
            
            # Nettoyage des requêtes expirées
            while request_times and request_times[0] <= current_time - self.window_seconds:
                request_times.popleft()
            
            return max(0, self.max_requests - len(request_times))
    
    def get_reset_time(self, identifier: str) -> float:
        """
        Retourne le timestamp de réinitialisation pour un identifiant
        
        Args:
            identifier: Identifiant unique
            
        Returns:
            Timestamp de la prochaine réinitialisation
        """
        with self.lock:
            request_times = self.requests[identifier]
            
            if not request_times:
                return time.time()
            
            return request_times[0] + self.window_seconds
    
    def clear_expired(self):
        """
        Nettoie toutes les entrées expirées (maintenance)
        """
        current_time = time.time()
        
        with self.lock:
            expired_keys = []
            
            for identifier, request_times in self.requests.items():
                # Suppression des requêtes expirées
                while request_times and request_times[0] <= current_time - self.window_seconds:
                    request_times.popleft()
                
                # Si plus de requêtes, on peut supprimer l'entrée
                if not request_times:
                    expired_keys.append(identifier)
            
            # Suppression des clés expirées
            for key in expired_keys:
                del self.requests[key]
    
    def reset_identifier(self, identifier: str):
        """
        Remet à zéro le compteur pour un identifiant
        
        Args:
            identifier: Identifiant à remettre à zéro
        """
        with self.lock:
            if identifier in self.requests:
                del self.requests[identifier]