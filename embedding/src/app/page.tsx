'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('embeddings');
  const [words, setWords] = useState('');
  const [documents, setDocuments] = useState('');
  const [embeddingResults, setEmbeddingResults] = useState<{ embeddings: Record<string, number[]> } | null>(null);
  const [tfidfResults, setTfidfResults] = useState<{
    feature_names: string[];
    tfidf_vectors: number[][];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [expandedVectors, setExpandedVectors] = useState<Record<string, boolean>>({});

  const handleEmbeddingSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const wordList = words.split(',').map(word => word.trim()).filter(word => word);
      
      const response = await fetch('http://127.0.0.1:8000/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: wordList }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch embeddings');
      }
      
      const data = await response.json();
      setEmbeddingResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTfidfSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const documentList = documents.split('\n').filter(doc => doc.trim());
      
      const response = await fetch('http://127.0.0.1:8000/tfidf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: documentList }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to compute TF-IDF');
      }
      
      const data = await response.json();
      setTfidfResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const truncateVector = (vector: number[]) => {
    if (!vector) return [];
    return vector.slice(0, 5);
  };
  
  const toggleVectorExpansion = (key: string) => {
    setExpandedVectors(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={`min-h-screen p-8 ${isDarkMode 
      ? "bg-black text-white" 
      : "bg-white text-black"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold mb-0">NLP Tools</h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode 
                ? "bg-white text-black hover:bg-gray-200" 
                : "bg-black text-white hover:bg-gray-900"
            }`}
          >
            {isDarkMode ? "Light Theme" : "Dark Theme"}
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className={`flex mb-6 rounded-lg p-1 ${
          isDarkMode 
            ? "bg-gray-900" 
            : "bg-gray-200"
        }`}>
          <button
            onClick={() => setActiveTab('embeddings')}
            className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all ${
              activeTab === 'embeddings'
                ? isDarkMode 
                  ? "bg-gray-800 text-white shadow-lg" 
                  : "bg-white text-black shadow-lg"
                : isDarkMode 
                  ? "text-gray-400 hover:bg-gray-800" 
                  : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Word Embeddings
          </button>
          <button
            onClick={() => setActiveTab('tfidf')}
            className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all ${
              activeTab === 'tfidf'
                ? isDarkMode 
                  ? "bg-gray-800 text-white shadow-lg" 
                  : "bg-white text-black shadow-lg"
                : isDarkMode 
                  ? "text-gray-400 hover:bg-gray-800" 
                  : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            TF-IDF Analysis
          </button>
        </div>
        
        {/* Main Content Panel */}
        <div className={`rounded-2xl p-8 shadow-xl ${
          isDarkMode 
            ? "bg-gray-900 border border-gray-800" 
            : "bg-gray-100 border border-gray-300"
        }`}>
          {activeTab === 'embeddings' ? (
            <div className="space-y-6">
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>GloVe Word Embeddings</h2>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Enter words separated by commas to retrieve their vector embeddings.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="words" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Words
                  </label>
                  <input
                    id="words"
                    type="text"
                    value={words}
                    onChange={(e) => setWords(e.target.value)}
                    placeholder="cat, dog, quantum, unicorn"
                    className={`w-full p-3 rounded-lg outline-none ${
                      isDarkMode 
                        ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-white" 
                        : "bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    }`}
                  />
                </div>
                <button
                  onClick={handleEmbeddingSubmit}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 ${
                    isDarkMode 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-black hover:bg-gray-800 text-white transition-colors"
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Get Embeddings'}
                </button>
              </div>
              
              {error && (
                <div className={`p-4 rounded-lg text-white ${isDarkMode ? "bg-red-900/50 border border-red-800" : "bg-red-500/20 border border-red-500/40"}`}>
                  {error}
                </div>
              )}
              
              {embeddingResults && (
                <div className="mt-8 space-y-6">
                  <h3 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-black"}`}>Results</h3>
                  <div className={`rounded-lg p-4 overflow-auto max-h-96 ${
                    isDarkMode 
                      ? "bg-gray-800" 
                      : "bg-white"
                  }`}>
                    {Object.entries(embeddingResults.embeddings).map(([word, vector]) => (
                      <div key={word} className={`mb-4 pb-4 ${
                        isDarkMode 
                          ? "border-b border-gray-700" 
                          : "border-b border-gray-300"
                      }`}>
                        <p className={`text-lg font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}>{word}</p>
                        
                        <div className="flex items-center mb-2">
                          <p className={`font-mono text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            {expandedVectors[word] 
                              ? `[${vector.join(', ')}]` 
                              : `[${truncateVector(vector).join(', ')}, ...]`}
                            <span className={`ml-2 ${
                              isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}>
                              ({vector.length} dimensions)
                            </span>
                          </p>
                          <button 
                            onClick={() => toggleVectorExpansion(word)}
                            className={`ml-4 px-3 py-1 text-xs rounded ${
                              isDarkMode 
                                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                                : "bg-gray-200 hover:bg-gray-300 text-black"
                            }`}
                          >
                            {expandedVectors[word] ? "Collapse" : "Show Full"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>TF-IDF Analysis</h2>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Enter documents (one per line) to compute TF-IDF vectors.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="documents" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Documents
                  </label>
                  <textarea
                    id="documents"
                    value={documents}
                    onChange={(e) => setDocuments(e.target.value)}
                    placeholder="This is the first document.
This document is the second document.
And this is the third one.
Is this the first document?"
                    rows={6}
                    className={`w-full p-3 rounded-lg outline-none ${
                      isDarkMode 
                        ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-white" 
                        : "bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    }`}
                  />
                </div>
                <button
                  onClick={handleTfidfSubmit}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 ${
                    isDarkMode 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-black hover:bg-gray-800 text-white transition-colors"
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Compute TF-IDF'}
                </button>
              </div>
              
              {error && (
                <div className={`p-4 rounded-lg text-white ${isDarkMode ? "bg-red-900/50 border border-red-800" : "bg-red-500/20 border border-red-500/40"}`}>
                  {error}
                </div>
              )}
              
              {tfidfResults && (
                <div className="mt-8 space-y-6">
                  <h3 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-black"}`}>Results</h3>
                  
                  <div className={`rounded-lg p-4 overflow-auto max-h-96 ${
                    isDarkMode 
                      ? "bg-gray-800" 
                      : "bg-white"
                  }`}>
                    <div className="mb-4">
                      <p className={`text-lg font-medium mb-2 ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}>Features</p>
                      <p className={`font-mono text-sm break-words ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {tfidfResults.feature_names.join(', ')}
                      </p>
                    </div>
                    
                    {tfidfResults.tfidf_vectors.map((vector, idx) => (
                      <div key={idx} className={`mb-4 pb-4 ${
                        isDarkMode 
                          ? "border-b border-gray-700" 
                          : "border-b border-gray-300"
                      }`}>
                        <p className={`text-lg font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}>
                          Document {idx + 1}
                        </p>
                        <div className="flex items-center mb-2">
                          <p className={`font-mono text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            {expandedVectors[`doc-${idx}`] 
                              ? `[${vector.join(', ')}]` 
                              : `[${truncateVector(vector).join(', ')}, ...]`}
                            <span className={`ml-2 ${
                              isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}>
                              ({vector.length} dimensions)
                            </span>
                          </p>
                          <button 
                            onClick={() => toggleVectorExpansion(`doc-${idx}`)}
                            className={`ml-4 px-3 py-1 text-xs rounded ${
                              isDarkMode 
                                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                                : "bg-gray-200 hover:bg-gray-300 text-black"
                            }`}
                          >
                            {expandedVectors[`doc-${idx}`] ? "Collapse" : "Show Full"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}