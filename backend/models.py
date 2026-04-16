"""
Modèles Pydantic pour l'API FindUP
Validation et sérialisation des données
"""

from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, validator

class SearchRequest(BaseModel):
    """Modèle pour les requêtes de recherche d'artisans"""
    metier: Optional[str] = Field(None, max_length=100, description="Métier recherché")
    ville: Optional[str] = Field(None, max_length=100, description="Ville de recherche")
    tags: Optional[List[str]] = Field(None, description="Tags de recherche")
    note_min: Optional[float] = Field(None, ge=0, le=5, description="Note minimum")
    certifie_seulement: Optional[bool] = Field(False, description="Artisans certifiés uniquement")
    disponible_seulement: Optional[bool] = Field(True, description="Artisans disponibles uniquement")
    limit: Optional[int] = Field(20, ge=1, le=100, description="Nombre maximum de résultats")

    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError("Maximum 10 tags autorisés")
            for tag in v:
                if len(tag.strip()) == 0:
                    raise ValueError("Les tags ne peuvent pas être vides")
                if len(tag) > 50:
                    raise ValueError("Chaque tag doit faire moins de 50 caractères")
        return v

class ArtisanResponse(BaseModel):
    """Modèle de réponse pour un artisan"""
    id: int
    nom: str
    description: Optional[str] = None
    ville: str
    telephone: Optional[str] = None
    email: Optional[str] = None
    adresse_complete: Optional[str] = None
    note_moyenne: float = Field(ge=0, le=5)
    nombre_avis: int = Field(ge=0)
    photo_profil: Optional[str] = None
    certifie: bool = False
    disponible: bool = True
    tags: List[str] = []
    metiers: List[str] = []

class AvisCreate(BaseModel):
    """Modèle pour la création d'un avis"""
    artisan_id: int = Field(..., gt=0, description="ID de l'artisan")
    note: int = Field(..., ge=1, le=5, description="Note de 1 à 5")
    commentaire: str = Field(..., min_length=10, max_length=1000, description="Commentaire de l'avis")

    @validator('commentaire')
    def validate_commentaire(cls, v):
        if not v.strip():
            raise ValueError("Le commentaire ne peut pas être vide")
        return v.strip()

class ProfileUpdate(BaseModel):
    """Modèle pour la mise à jour du profil utilisateur"""
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, regex=r'^(\+33|0)[1-9](\d{8})$')
    ville: Optional[str] = Field(None, min_length=2, max_length=100)

    @validator('nom')
    def validate_nom(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Le nom ne peut pas être vide")
        return v.strip() if v else v

    @validator('ville')
    def validate_ville(cls, v):
        if v is not None and not v.strip():
            raise ValueError("La ville ne peut pas être vide")
        return v.strip() if v else v