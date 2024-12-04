const lancedb = require("@lancedb/lancedb");
const path = require("path");
const config = require("./config");
const axios = require("axios");
const { preprocessGoogleMeetTranscript } = require("./utils");


const uri = "data/meeting_transcripts";
const db = lancedb.connect(uri);

//module.exports = { db, collectionName };

const readAndPreprocessTranscript = (filePath) => {
    try {
      const rawContent = fs.readFileSync(filePath, "utf-8");
      const parsedContent = JSON.parse(rawContent);
      return preprocessGoogleMeetTranscript(parsedContent);
    } catch (error) {
      console.error("Error reading or preprocessing transcript:", error.message);
      throw error;
    }
  };
  
  const storeTranscriptInLanceDB = async (filePath, botId) => {
    try {
      const collection = await db.createOrOpenCollection(db);
      const preprocessedTranscript = readAndPreprocessTranscript(filePath);
  
      const embeddingResponse = await axios.post(
        "https://api.predictionguard.com/embedding",
        { text: preprocessedTranscript },
        {
          headers: {
            Authorization: `Bearer ${config.predictionguardApiKey}`,
          },
        }
      );
  
      const embedding = embeddingResponse.data.embedding;
  
      await collection.insert([
        {
          id: `transcript-${botId}-${Date.now()}`,
          text: preprocessedTranscript,
          embedding,
        },
      ]);
  
      console.log("Transcript indexed successfully in LanceDB.");
    } catch (error) {
      console.error("Error storing transcript in LanceDB:", error.message);
      throw error;
    }
  };
  
  const queryLanceDB = async (query) => {
    try {
      const collection = await db.openCollection(collectionName);
      const queryEmbeddingResponse = await axios.post(
        "https://api.predictionguard.com/embedding",
        { text: query },
        {
          headers: {
            Authorization: `Bearer ${config.predictionguardApiKey}`,
          },
        }
      );
  
      const queryEmbedding = queryEmbeddingResponse.data.embedding;
      const results = await collection.query({ vector: queryEmbedding, topK: 5 });
  
      return results.map((result) => result.text);
    } catch (error) {
      console.error("Error querying LanceDB:", error.message);
      throw error;
    }
  };
  
  const generateWithRAG = async (query) => {
    try {
      const retrievedDocs = await queryLanceDB(query);
      const context = retrievedDocs.join("\n");
  
      const response = await axios.post(
        "https://api.predictionguard.com/chat/completions",
        {
          model: "Hermes-3-Llama-3.1-8B",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
              role: "user",
              content: `Using the following context, answer the question:\n\nContext:\n${context}\n\nQuestion: ${query}`,
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${config.predictionguardApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating response with RAG:", error.message);
      throw error;
    }
  };
  
  module.exports = {
    db,
    storeTranscriptInLanceDB,
    queryLanceDB,
    generateWithRAG,
  };