# Text Embedding Visualization

This project provides tools for text embedding generation and visualization using TF-IDF and GloVe word embeddings. It consists of a FastAPI backend for generating embeddings and a Next.js frontend for visualizing them with color-coded data points.

## Project Structure

```
visualization/
├── api.py                 # FastAPI backend for embeddings
├── glove.6B.100d.txt      # GloVe word embeddings
├── tf-idf.ipynb           # Jupyter notebook with TF-IDF examples
└── embedding/             # Next.js frontend
    ├── public/            # Static files
    └── src/               # React components and pages
```

## Backend Setup

The backend uses FastAPI to serve word embeddings, TF-IDF vectors, and visualization coordinates.

### Prerequisites

- Python 3.8+
- FastAPI
- scikit-learn
- numpy
- uvicorn

### Installation

1. Install required packages:

```bash
pip install fastapi uvicorn scikit-learn numpy pydantic
```

2. Make sure you have the GloVe embeddings file (`glove.6B.100d.txt`) in the project root.
   - You can download it from [Stanford NLP](https://nlp.stanford.edu/projects/glove/)

### Running the Backend

Start the API server with:

```bash
uvicorn api:app --reload
```

The API will be available at `http://localhost:8000` with the following endpoints:
- POST `/embeddings` - Get GloVe embeddings for a list of words
- POST `/tfidf` - Compute TF-IDF vectors for a list of documents
- POST `/visualize` - Generate 2D or 3D coordinates for words using t-SNE or PCA
- GET `/visualizations/{viz_id}` - Retrieve a previously created visualization

## Frontend Setup

The frontend is built with Next.js, React, and Recharts for visualization.

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

1. Navigate to the embedding directory:

```bash
cd embedding
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the Frontend

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`.

## Features

The application includes the following features:

- **Word Embeddings**: Retrieve GloVe embeddings for any words
- **TF-IDF Analysis**: Compute TF-IDF vectors for text documents
- **Visualization**: Project high-dimensional embeddings into 2D or 3D space using t-SNE or PCA
- **Color-Coded Points**: Each word in the visualization has a unique color for easy identification
- **Light/Dark Themes**: Toggle between light and dark interface themes
- **Interactive Charts**: Hover over points to see word details

## Jupyter Notebook

The `tf-idf.ipynb` notebook contains examples of using TF-IDF and GloVe embeddings for text analysis and visualization. It demonstrates:

- Creating TF-IDF vectors from a corpus
- Loading GloVe embeddings
- Visualizing document embeddings using PCA and t-SNE
