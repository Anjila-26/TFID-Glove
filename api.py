from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import uvicorn
import asyncio

app = FastAPI()

#Cors Middleware for cross-origin requests
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

# --- Run the app or local test ---
if __name__ == "__main__":
    asyncio.run(run_local())
    # To run API server:
    # uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
