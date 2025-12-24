#!/usr/bin/env python3
"""Test script for embeddings provider"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from app.services.embeddings.provider import MockEmbeddingsProvider

def test_mock_provider():
    """Test the mock embeddings provider"""
    provider = MockEmbeddingsProvider(dimension=1536)

    # Test single embedding
    text = "Hello world"
    embedding = provider.embed_query(text)

    assert len(embedding) == 1536, f"Expected 1536 dimensions, got {len(embedding)}"
    assert all(-1 <= x <= 1 for x in embedding), "Values should be in [-1, 1] range"

    # Test batch embedding
    texts = ["Hello world", "Goodbye world", "Hello again"]
    embeddings = provider.embed_texts(texts)

    assert len(embeddings) == 3, f"Expected 3 embeddings, got {len(embeddings)}"
    assert all(len(emb) == 1536 for emb in embeddings), "All embeddings should have 1536 dimensions"

    # Test determinism - same text should produce same embedding
    embedding1 = provider.embed_query(text)
    embedding2 = provider.embed_query(text)

    assert embedding1 == embedding2, "Embeddings should be deterministic"

    print("✅ All mock provider tests passed!")

if __name__ == "__main__":
    test_mock_provider()
