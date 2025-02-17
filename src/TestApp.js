import React, { useState } from "react";
import "./TestApp.css";

function TestApp() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(""); // State to hold user input for the /ask endpoint
  const [answer, setAnswer] = useState(null); // State to hold the response from /ask

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
      const response = await fetch("https://eco-textile-app-backend.onrender.com/predict", {
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

      setPrediction(data.prediction);
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("An error occurred while fetching the prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://eco-textile-app-backend.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question }), // Send the question in JSON format
      });

      if (!response.ok) {
        throw new Error("Failed to fetch answer.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnswer(data.response); // Assuming the backend responds with { "response": "answer" }
    } catch (error) {
      console.error("Error during fetching answer:", error);
      alert("An error occurred while fetching the answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Textile Recognition Test</h1>

        {/* File Upload Section */}
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleFileUpload}
        />
        {loading && <p>Loading...</p>}
        {prediction !== null && !loading && <p>Prediction: {prediction}</p>}

        {/* Question Input and Button */}
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Ask a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)} // Update the question state
            style={{ padding: "10px", fontSize: "16px", width: "300px" }}
          />
          <button
            onClick={handleAskQuestion}
            style={{
              marginLeft: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Ask
          </button>
        </div>
        {answer && <p>Answer: {answer}</p>} {/* Display the answer */}
      </header>
    </div>
  );
}

export default TestApp;
