import React, { useState, useEffect } from 'react';
import './YieldPredictionResult.css';

const YieldPredictionResult = ({ predictionData }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (predictionData) {
      fetchYieldPrediction(predictionData);
    }
  }, [predictionData]);

  const fetchYieldPrediction = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        crop: data.crop,
        state: data.state,
        rainfall: data.rainfall,
        temperature: data.temperature,
        area: data.area || 1.0,
        pesticides: data.pesticides || 0.0,
        year: data.year || new Date().getFullYear()
      });

      const response = await fetch(`http://localhost:8000/api/predict/simple-yield?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err.message);
      console.error('Yield prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!predictionData) {
    return (
      <div className="yield-prediction-result">
        <div className="no-data">
          <h3>🌾 Yield Prediction</h3>
          <p>Enter crop data to see yield predictions</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="yield-prediction-result">
        <div className="loading">
          <div className="spinner"></div>
          <h3>🤖 AI is analyzing your data...</h3>
          <p>Calculating yield prediction using machine learning</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="yield-prediction-result">
        <div className="error">
          <h3>❌ Prediction Error</h3>
          <p>Failed to get yield prediction: {error}</p>
          <button onClick={() => fetchYieldPrediction(predictionData)}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <div className="yield-prediction-result">
      <div className="prediction-header">
        <h2>🌾 Yield Prediction Results</h2>
        <span className="model-badge">{prediction.model_type}</span>
      </div>

      <div className="prediction-cards">
        <div className="prediction-card primary">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Predicted Yield</h3>
            <div className="yield-value">
              {prediction.predicted_yield}
              <span className="unit">quintals/hectare</span>
            </div>
          </div>
        </div>

        <div className="prediction-card secondary">
          <div className="card-icon">🚜</div>
          <div className="card-content">
            <h3>Total Production</h3>
            <div className="yield-value">
              {prediction.total_production}
              <span className="unit">quintals</span>
            </div>
            <div className="area-info">
              for {predictionData.area || 1} hectare{(predictionData.area || 1) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="input-data-summary">
        <h4>📋 Prediction Based On:</h4>
        <div className="data-grid">
          <div className="data-item">
            <span className="data-label">🌾 Crop:</span>
            <span className="data-value">{prediction.input_data.crop}</span>
          </div>
          <div className="data-item">
            <span className="data-label">📍 State:</span>
            <span className="data-value">{prediction.input_data.state}</span>
          </div>
          <div className="data-item">
            <span className="data-label">🌧️ Rainfall:</span>
            <span className="data-value">{prediction.input_data.rainfall_mm} mm</span>
          </div>
          <div className="data-item">
            <span className="data-label">🌡️ Temperature:</span>
            <span className="data-value">{prediction.input_data.temperature_celsius}°C</span>
          </div>
          <div className="data-item">
            <span className="data-label">🏞️ Area:</span>
            <span className="data-value">{prediction.input_data.area_hectares} hectares</span>
          </div>
          <div className="data-item">
            <span className="data-label">🧪 Pesticides:</span>
            <span className="data-value">{prediction.input_data.pesticides_tonnes} tonnes</span>
          </div>
          <div className="data-item">
            <span className="data-label">📅 Year:</span>
            <span className="data-value">{prediction.input_data.year}</span>
          </div>
        </div>
      </div>

      <div className="prediction-footer">
        <div className="timestamp">
          <small>
            🕒 Predicted on {new Date(prediction.prediction_timestamp).toLocaleString()}
          </small>
        </div>
        <div className="model-info">
          <small>
            Powered by {prediction.model_type} • 🎯 AI-driven agriculture
          </small>
        </div>
      </div>
    </div>
  );
};

export default YieldPredictionResult;