'use client';

import { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis, ResponsiveContainer, Cell } from 'recharts';

// Define types for API responses
interface EmbeddingResult {
  embeddings: Record<string, number[]>;
}

interface TfidfResult {
  feature_names: string[];
  tfidf_vectors: number[][];
}

interface VisualizationResult {
  visualization_id: string;
  method: string;
  words: string[];
  coordinates: Record<string, number[]>;
  colors: Record<string, string>; // Word -> color mapping
}

// Helper function to truncate vectors for display
const truncateVector = (vector: number[]): number[] => {
  return vector.slice(0, 5); // Show first 5 dimensions
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('embeddings');
  const [words, setWords] = useState('');
  const [documents, setDocuments] = useState('');
  const [embeddingResults, setEmbeddingResults] = useState<EmbeddingResult | null>(null);
  const [tfidfResults, setTfidfResults] = useState<TfidfResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [expandedVectors, setExpandedVectors] = useState<Record<string, boolean>>({});
  
  // Visualization states
  const [visualizationMethod, setVisualizationMethod] = useState('tsne');
  const [visualizationResults, setVisualizationResults] = useState<VisualizationResult | null>(null);
  const [perplexity, setPerplexity] = useState(30);
  const [dimensions, setDimensions] = useState(2);
  const [visualizationLoading, setVisualizationLoading] = useState(false);

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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualization = async () => {
    setVisualizationLoading(true);
    setError('');
    
    try {
      const wordList = words.split(',').map(word => word.trim()).filter(word => word);
      
      if (wordList.length < 2) {
        throw new Error('Please enter at least 2 words for visualization');
      }
      
      const response = await fetch('http://127.0.0.1:8000/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          words: wordList,
          method: visualizationMethod,
          perplexity: perplexity,
          n_components: dimensions
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create visualization');
      }
      
      const data = await response.json();
      setVisualizationResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setVisualizationLoading(false);
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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDataForScatterChart = () => {
    if (!visualizationResults || !visualizationResults.coordinates) return [];
    
    return Object.entries(visualizationResults.coordinates).map(([word, coords]) => ({
      name: word,
      x: coords[0],
      y: coords[1],
      // If we have 3D coordinates, use the third dimension for Z
      ...(coords.length > 2 && { z: coords[2] }),
      // Use the color for this word, or a default if not available
      color: visualizationResults.colors?.[word] || (isDarkMode ? "#00C49F" : "#555555")
    }));
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
      : "bg-white text-gray-800"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold mb-0">NLP Tools</h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode 
                ? "bg-white text-black hover:bg-gray-200" 
                : "bg-gray-800 text-white hover:bg-gray-700"
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
                  : "bg-white text-gray-800 shadow-lg"
                : isDarkMode 
                  ? "text-gray-400 hover:bg-gray-800" 
                  : "text-gray-600 hover:bg-gray-300"
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
                  : "bg-white text-gray-800 shadow-lg"
                : isDarkMode 
                  ? "text-gray-400 hover:bg-gray-800" 
                  : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            TF-IDF Analysis
          </button>
          <button
            onClick={() => setActiveTab('visualize')}
            className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all ${
              activeTab === 'visualize'
                ? isDarkMode 
                  ? "bg-gray-800 text-white shadow-lg" 
                  : "bg-white text-gray-800 shadow-lg"
                : isDarkMode 
                  ? "text-gray-400 hover:bg-gray-800" 
                  : "text-gray-600 hover:bg-gray-300"
            }`}
          >
            Visualize
          </button>
        </div>
        
        {/* Main Content Panel */}
        <div className={`rounded-2xl p-8 shadow-xl ${
          isDarkMode 
            ? "bg-gray-900 border border-gray-800" 
            : "bg-white border border-gray-300"
        }`}>
          {activeTab === 'embeddings' ? (
            <div className="space-y-6">
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>GloVe Word Embeddings</h2>
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
                        : "bg-gray-100 border border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    }`}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleEmbeddingSubmit}
                    disabled={isLoading}
                    className={`px-6 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 ${
                      isDarkMode 
                        ? "bg-white text-black hover:bg-gray-200" 
                        : "bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    }`}
                  >
                    {isLoading ? 'Processing...' : 'Get Embeddings'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('visualize');
                      // If there are already words, trigger visualization
                      if (words.trim()) {
                        handleVisualization();
                      }
                    }}
                    className={`px-6 py-3 rounded-lg font-medium shadow-lg ${
                      isDarkMode 
                        ? "bg-gray-700 text-white hover:bg-gray-600" 
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                    }`}
                  >
                    Visualize Words
                  </button>
                </div>
              </div>
              
              {error && (
                <div className={`p-4 rounded-lg text-white ${isDarkMode ? "bg-red-900/50 border border-red-800" : "bg-red-100 border border-red-200 text-red-800"}`}>
                  {error}
                </div>
              )}
              
              {embeddingResults && (
                <div className="mt-8 space-y-6">
                  <h3 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Results</h3>
                  <div className={`rounded-lg p-4 overflow-auto max-h-96 ${
                    isDarkMode 
                      ? "bg-gray-800" 
                      : "bg-gray-100"
                  }`}>
                    {Object.entries(embeddingResults.embeddings).map(([word, vector]) => (
                      <div key={word} className={`mb-4 pb-4 ${
                        isDarkMode 
                          ? "border-b border-gray-700" 
                          : "border-b border-gray-300"
                      }`}>
                        <p className={`text-lg font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-gray-800"
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
                                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
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
          ) : activeTab === 'tfidf' ? (
            <div className="space-y-6">
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>TF-IDF Analysis</h2>
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
                        : "bg-gray-100 border border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    }`}
                  />
                </div>
                <button
                  onClick={handleTfidfSubmit}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 ${
                    isDarkMode 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Compute TF-IDF'}
                </button>
              </div>
              
              {error && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-red-900/50 border border-red-800 text-white" : "bg-red-100 border border-red-200 text-red-800"}`}>
                  {error}
                </div>
              )}
              
              {tfidfResults && (
                <div className="mt-8 space-y-6">
                  <h3 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Results</h3>
                  
                  <div className={`rounded-lg p-4 overflow-auto max-h-96 ${
                    isDarkMode 
                      ? "bg-gray-800" 
                      : "bg-gray-100"
                  }`}>
                    <div className="mb-4">
                      <p className={`text-lg font-medium mb-2 ${
                        isDarkMode ? "text-white" : "text-gray-800"
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
                          isDarkMode ? "text-white" : "text-gray-800"
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
                                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
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
          ) : (
            <div className="space-y-6">
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Visualize Word Embeddings</h2>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Enter words separated by commas to visualize their relationships in vector space.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="viz-words" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Words
                  </label>
                  <input
                    id="viz-words"
                    type="text"
                    value={words}
                    onChange={(e) => setWords(e.target.value)}
                    placeholder="king, queen, man, woman, child, computer, technology"
                    className={`w-full p-3 rounded-lg outline-none ${
                      isDarkMode 
                        ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-white" 
                        : "bg-gray-100 border border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="method" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Method
                    </label>
                    <select
                      id="method"
                      value={visualizationMethod}
                      onChange={(e) => setVisualizationMethod(e.target.value)}
                      className={`w-full p-3 rounded-lg outline-none ${
                        isDarkMode 
                          ? "bg-gray-800 border border-gray-700 text-white focus:border-white" 
                          : "bg-gray-100 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      }`}
                    >
                      <option value="tsne">t-SNE</option>
                      <option value="pca">PCA</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="perplexity" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Perplexity (t-SNE)
                    </label>
                    <input
                      id="perplexity"
                      type="number"
                      value={perplexity}
                      onChange={(e) => setPerplexity(parseInt(e.target.value))}
                      min="5"
                      max="50"
                      className={`w-full p-3 rounded-lg outline-none ${
                        isDarkMode 
                          ? "bg-gray-800 border border-gray-700 text-white focus:border-white" 
                          : "bg-gray-100 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dimensions" className={`block mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Dimensions
                    </label>
                    <select
                      id="dimensions"
                      value={dimensions}
                      onChange={(e) => setDimensions(parseInt(e.target.value))}
                      className={`w-full p-3 rounded-lg outline-none ${
                        isDarkMode 
                          ? "bg-gray-800 border border-gray-700 text-white focus:border-white" 
                          : "bg-gray-100 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      }`}
                    >
                      <option value="2">2D</option>
                      <option value="3">3D</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleVisualization}
                  disabled={visualizationLoading}
                  className={`px-6 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 ${
                    isDarkMode 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  }`}
                >
                  {visualizationLoading ? 'Processing...' : 'Visualize'}
                </button>
              </div>
              
              {error && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-red-900/50 border border-red-800 text-white" : "bg-red-100 border border-red-200 text-red-800"}`}>
                  {error}
                </div>
              )}
              
              {visualizationResults && (
                <div className="mt-8 space-y-4">
                  <h3 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Visualization Results</h3>
                  
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ccc"} />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name="X" 
                          tick={{ fill: isDarkMode ? "#fff" : "#333" }}
                          stroke={isDarkMode ? "#666" : "#999"}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name="Y" 
                          tick={{ fill: isDarkMode ? "#fff" : "#333" }}
                          stroke={isDarkMode ? "#666" : "#999"}
                        />
                        {dimensions === 3 && (
                          <ZAxis 
                            type="number" 
                            dataKey="z" 
                            range={[60, 400]} 
                            name="Z" 
                          />
                        )}
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }} 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                            border: 'none',
                            borderRadius: '8px',
                            color: isDarkMode ? 'white' : '#333'
                          }}
                        />
                        <Scatter 
                          name="Words" 
                          data={formatDataForScatterChart()} 
                          fill={isDarkMode ? "#00C49F" : "#555555"}
                          isAnimationActive={true}
                        >
                          {
                            formatDataForScatterChart().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                              />
                            ))
                          }
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className={`rounded-lg p-4 overflow-auto mt-4 ${
                    isDarkMode 
                      ? "bg-gray-800" 
                      : "bg-gray-100"
                  }`}>
                    <h4 className={`text-lg font-medium mb-3 ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}>Words & Colors</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visualizationResults.coordinates && Object.entries(visualizationResults.coordinates).map(([word, coords]) => (
                        <div key={word} className={`p-3 rounded-lg flex items-center ${
                          isDarkMode 
                            ? "bg-gray-700" 
                            : "bg-gray-200"
                        }`}>
                          <div 
                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                            style={{ backgroundColor: visualizationResults.colors?.[word] || (isDarkMode ? "#00C49F" : "#555555") }}
                          ></div>
                          <div>
                            <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>{word}</p>
                            <p className={`font-mono text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {coords.map((c, i) => (
                                <span key={i}>
                                  {i === 0 ? 'x' : i === 1 ? 'y' : 'z'}: {c.toFixed(3)}
                                  {i < coords.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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