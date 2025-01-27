import React, { useState } from "react";
import "./App.css";

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Send the image to the backend for prediction
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the prediction state
      setPrediction(data.prediction);
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("An error occurred while fetching the prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Textile Recognition Test</h1>
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleFileUpload}
        />
        {loading && <p>Loading...</p>}
        {prediction !== null && !loading && (
          <p>Prediction: {prediction}</p>
        )}
      </header>
    </div>
  );
}

export default App;
