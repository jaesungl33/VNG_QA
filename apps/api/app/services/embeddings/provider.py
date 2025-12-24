import hashlib
import json
import math
import os
from abc import ABC, abstractmethod
from typing import List, Union

class EmbeddingsProvider(ABC):
    """Abstract base class for embeddings providers"""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the dimension of embeddings"""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the model name"""
        pass

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of texts and return list of vectors"""
        pass

    @abstractmethod
    def embed_query(self, query: str) -> List[float]:
        """Embed a single query text"""
        pass

class MockEmbeddingsProvider(EmbeddingsProvider):
    """Mock embeddings provider that generates deterministic vectors from text hash"""

    def __init__(self, dimension: int = 1536):
        self._dimension = dimension
        self._model_name = f"mock-{dimension}d"

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def _text_to_vector(self, text: str) -> List[float]:
        """Generate deterministic vector from text using SHA256"""
        # Create hash of the text
        hash_obj = hashlib.sha256(text.encode('utf-8'))
        hash_bytes = hash_obj.digest()

        # Convert hash to vector of floats in [-1, 1]
        vector = []
        for i in range(self._dimension):
            # Use different parts of the hash for each dimension
            byte_index = (i * 4) % len(hash_bytes)
            chunk = hash_bytes[byte_index:byte_index + 4]
            if len(chunk) < 4:
                chunk += b'\x00' * (4 - len(chunk))

            # Convert 4 bytes to float
            int_val = int.from_bytes(chunk, byteorder='big', signed=False)
            # Normalize to [-1, 1]
            normalized = (int_val / 0xFFFFFFFF) * 2 - 1
            vector.append(normalized)

        return vector

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts"""
        return [self._text_to_vector(text) for text in texts]

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query"""
        return self._text_to_vector(query)

def get_embeddings_provider() -> EmbeddingsProvider:
    """Factory function to get the configured embeddings provider"""
    provider_type = os.getenv("EMBEDDINGS_PROVIDER", "mock").lower()

    if provider_type == "mock":
        return MockEmbeddingsProvider()
    else:
        raise ValueError(f"Unknown embeddings provider: {provider_type}")

# Global provider instance
_provider = None

def get_provider() -> EmbeddingsProvider:
    """Get or create the global provider instance"""
    global _provider
    if _provider is None:
        _provider = get_embeddings_provider()
    return _provider
