import React, { useState } from "react";
import axios from "axios";
import "./QueryHandler.css";

const QueryHandler: React.FC<{ setQueryAnswer: (answer: string) => void; setQueryError: (error: string) => void }> = ({
  setQueryAnswer,
  setQueryError,
}) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQueryError("");
    setQueryAnswer("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/queryRoutes`,
        { question }
      );
      setQueryAnswer(response.data.answer);
    } catch (err) {
      const errorMessage = "Failed to retrieve the answer. Please try again.";
      setError(errorMessage);
      setQueryError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="QueryHandler">
      <h2>Ask a Question</h2>
      <form className="QueryHandler--form" onSubmit={handleQuerySubmit}>
        <input
          type="text"
          className="QueryHandler--input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
          required
        />
        <button
          type="submit"
          className={`QueryHandler--button ${
            question ? "QueryHandler--button--active" : ""
          }`}
          disabled={!question || loading}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
      {loading && <p className="QueryHandler--loading">Loading...</p>}
      {error && <div className="QueryHandler--error-box">{error}</div>}
    </div>
  );
};

export default QueryHandler;
