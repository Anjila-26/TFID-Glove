from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import numpy as np
import uvicorn
import asyncio
import uuid
import os
import random
from typing import List, Dict, Any, Optional

app = FastAPI()

# --- Color utilities for visualization ---
def generate_color_palette(n):
    """Generate a list of distinct colors for visualization"""
    # Predefined colors for smaller sets
    predefined_colors = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
    ]
    
    if n <= len(predefined_colors):
        return predefined_colors[:n]
    
    # For larger sets, generate additional colors
    colors = predefined_colors.copy()
    while len(colors) < n:
        # Generate a random hex color
        r = random.randint(30, 220)  # Avoid very dark or very light colors
        g = random.randint(30, 220)
        b = random.randint(30, 220)
        color = f"#{r:02x}{g:02x}{b:02x}"
        
        if color not in colors:  # Avoid duplicates
            colors.append(color)
    
    return colors

# Cors Middleware for cross-origin requests
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Load GloVe embeddings ---
glove_path = "glove.6B.100d.txt"  # Ensure this file exists in your directory

def load_glove_embeddings(file_path):
    embeddings = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            word = parts[0]
            vec = np.array(parts[1:], dtype=float)
            embeddings[word] = vec
    return embeddings

glove = load_glove_embeddings(glove_path)
embedding_dim = 100

# In-memory storage for visualizations
visualization_store = {}

# --- Request & Response Models ---
class EmbeddingRequest(BaseModel):
    words: list[str]

class EmbeddingResponse(BaseModel):
    embeddings: dict[str, list[float]]

class TfidfRequest(BaseModel):
    documents: list[str]

class TfidfResponse(BaseModel):
    feature_names: list[str]
    tfidf_vectors: list[list[float]]

class VisualizationRequest(BaseModel):
    words: list[str]
    method: str  # "tsne" or "pca"
    perplexity: Optional[int] = 30  # For t-SNE only
    n_components: Optional[int] = 2  # Number of components for both PCA and t-SNE

class VisualizationResponse(BaseModel):
    visualization_id: str
    method: str
    words: list[str]
    coordinates: dict[str, list[float]]  # Word -> [x, y] or [x, y, z] coordinates
    colors: dict[str, str]  # Word -> color hex code

class VisualizationIDRequest(BaseModel):
    visualization_id: str

# --- GloVe Endpoint ---
@app.post("/embeddings", response_model=EmbeddingResponse)
async def get_word_embeddings(req: EmbeddingRequest):
    embeddings = {}
    for word in req.words:
        vec = glove.get(word.lower(), np.zeros(embedding_dim))
        embeddings[word] = vec.tolist()
    return EmbeddingResponse(embeddings=embeddings)

# --- TF-IDF Endpoint ---
@app.post("/tfidf", response_model=TfidfResponse)
async def compute_tfidf(req: TfidfRequest):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(req.documents)
    return TfidfResponse(
        feature_names=vectorizer.get_feature_names_out().tolist(),
        tfidf_vectors=tfidf_matrix.toarray().tolist()
    )

# --- Visualization Endpoints ---
@app.post("/visualize", response_model=VisualizationResponse)
async def visualize_embeddings(req: VisualizationRequest):
    # Get embeddings for the requested words
    word_vectors = []
    valid_words = []
    
    for word in req.words:
        word_lower = word.lower()
        if word_lower in glove:
            valid_words.append(word)
            word_vectors.append(glove[word_lower])
    
    if not valid_words:
        return {"error": "No valid words found in the vocabulary"}
    
    # Convert to numpy array
    embedding_matrix = np.array(word_vectors)
    
    # Apply dimensionality reduction
    if req.method.lower() == "tsne":
        # t-SNE
        perplexity = min(req.perplexity, len(valid_words) - 1) if len(valid_words) > 1 else 1
        tsne = TSNE(n_components=req.n_components, perplexity=perplexity, random_state=42)
        reduced_data = tsne.fit_transform(embedding_matrix)
    else:
        # PCA
        n_components = min(req.n_components, len(valid_words))
        pca = PCA(n_components=n_components)
        reduced_data = pca.fit_transform(embedding_matrix)
    
    # Create coordinates dictionary
    coordinates = {}
    for i, word in enumerate(valid_words):
        coordinates[word] = reduced_data[i].tolist()
    
    # Generate colors for each word
    colors = dict(zip(valid_words, generate_color_palette(len(valid_words))))
    
    # Generate a unique ID for this visualization
    viz_id = str(uuid.uuid4())
    
    # Store the visualization data
    visualization_store[viz_id] = {
        "method": req.method,
        "words": valid_words,
        "coordinates": coordinates,
        "colors": colors
    }
    
    return VisualizationResponse(
        visualization_id=viz_id,
        method=req.method,
        words=valid_words,
        coordinates=coordinates,
        colors=colors
    )

@app.get("/visualizations/{viz_id}", response_model=VisualizationResponse)
async def get_visualization(viz_id: str):
    if viz_id not in visualization_store:
        return {"error": "Visualization not found"}
    
    viz_data = visualization_store[viz_id]
    return VisualizationResponse(
        visualization_id=viz_id,
        method=viz_data["method"],
        words=viz_data["words"],
        coordinates=viz_data["coordinates"],
        colors=viz_data["colors"]
    )

@app.get("/visualizations", response_model=List[str])
async def list_visualizations():
    return list(visualization_store.keys())

# --- Clean up old visualizations (optional, can be triggered periodically) ---
@app.post("/cleanup_visualizations")
async def cleanup_visualizations(max_items: int = 20):
    # Keep only the most recent visualizations
    if len(visualization_store) > max_items:
        keys = list(visualization_store.keys())
        keys_to_remove = keys[:-max_items]
        for key in keys_to_remove:
            visualization_store.pop(key, None)
    return {"status": "success", "remaining_items": len(visualization_store)}

# --- Local test runner ---
async def run_local():
    print("\n--- GloVe Embeddings ---")
    test_words = ["cat", "dog", "quantum", "unicorn"]
    res_embed = await get_word_embeddings(EmbeddingRequest(words=test_words))
    for word, vec in res_embed.embeddings.items():
        print(f"{word}: {vec[:5]}...")  # Show first 5 dims

    print("\n--- TF-IDF ---")
    docs = [
        "This is the first document.",
        "This document is the second document.",
        "And this is the third one.",
        "Is this the first document?"
    ]
    res_tfidf = await compute_tfidf(TfidfRequest(documents=docs))
    print("Features:", res_tfidf.feature_names)
    for i, vec in enumerate(res_tfidf.tfidf_vectors):
        print(f"Doc {i + 1}: {vec[:5]}...")  # Show first 5 tf-idf values
        
    print("\n--- Visualization ---")
    words = ["king", "queen", "man", "woman", "child", "dog", "cat", "computer", "technology"]
    viz_result = await visualize_embeddings(VisualizationRequest(words=words, method="tsne"))
    print(f"Visualization ID: {viz_result.visualization_id}")
    print(f"First few coordinates: {list(viz_result.coordinates.items())[:2]}")
    print(f"Word colors: {viz_result.colors}")

# --- Run the app or local test ---
if __name__ == "__main__":
    # asyncio.run(run_local())
    # To run API server:
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)