// lancedb does not support javascript
import * as lancedb from "@lancedb/lancedb";
const path = require("path");
const config = require("./config");
const axios = require("axios");
const { preprocessGoogleMeetTranscript, cleanUpTranscript } = require("./utils");


const uri = "data/meeting_transcripts";
const db = await lancedb.connect(uri);
const tableName = 'scratch';
table = await db.createTable(tableName);
//module.exports = { db, collectionName };

const readPreprocessAndCleanTranscript = async (filePath) => {
  try {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const parsedContent = JSON.parse(rawContent);
    const preprocessedTranscript = preprocessGoogleMeetTranscript(parsedContent);
    const cleanedTranscript = await cleanUpTranscript(preprocessedTranscript);

    return cleanedTranscript;
  } catch (error) {
    console.error("Error reading, preprocessing, or cleaning transcript:", error.message);
    throw error;
  }
};
  
  const storeTranscriptInLanceDB = async (filePath, botId) => {
    try {
      const uri = "data/meeting_transcripts";
      const db = await lancedb.connect(uri);
      const tableName = 'your_table_name2';
      table = await db.createTable(tableName);

      // Read, preprocess, and clean the transcript
      const preprocessedTranscript = readPreprocessAndCleanTranscript(filePath);

      // Obtain the embedding for the preprocessed transcript
      const embeddingResponse = await axios.post(
        'https://api.predictionguard.com/embedding',
        { text: preprocessedTranscript },
        {
          headers: {
            Authorization: `Bearer ${config.predictionguardApiKey}`,
          },
        }
      );
      const embedding = embeddingResponse.data.embedding;

      // Insert the processed data into the table
      await table.add([
        {
          id: `transcript-${botId}-${Date.now()}`,
          text: preprocessedTranscript,
          embedding,
        },
      ]);

      console.log('Transcript indexed successfully in LanceDB.');
    } catch (error) {
      console.error('Error storing transcript in LanceDB:', error.message);
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