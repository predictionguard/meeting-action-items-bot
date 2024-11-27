//todo: remove the key
const config = require("./config");
const OpenAI = require("openai");
const axios = require("axios");
console.log("Using OpenAI API Key:", config.predictionguardApiKey);

// const openai = new OpenAI({
//   apiKey: config.PREDICTIONGUARD_API_KEY,
// });

const extractActionItems = async (meetingTranscript) => {
  console.log("the meeting transcript:", meetingTranscript);
  try {
    const response = await axios.post(
      "https://api.predictionguard.com/chat/completions", // OpenAI API endpoint
      {
        model: "Hermes-3-Llama-3.1-8B",
        messages: [
          {
            role: "system",
            content: `
                You will be provided with a meeting transcript. For each participant in the meeting, you must extract         
                at least one action item. Action items are short, concise statements that describe a task that needs to be completed.
                Format the output as a JSON array where each object represents a participant and their action items.
                Transcript:
                ${meetingTranscript}
                
                Output format:
                {
                  meeting_data: [
                      {
                          "user": "participant name",
                          "action_items": ["action item 1", "action item 2", ...]
                      },
                      {
                          "user": "participant name",
                          "action_items": ["action item 1", "action item 2", ...]
                      },
                      ...
                  ]
                }
            `,
          },
        ],
        max_tokens: 1000, 
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.predictionguardApiKey}`, 
        },
      }
    );
    console.log("Raw API Response:", response.data);
    console.log("Choices Object:", response.data.choices);
    const data = JSON.parse(response.data.choices[0].message.content).meeting_data;
    return data;
  } catch (error) {
    console.error("Error fetching data from OpenAI API:", error.response?.data || error.message);
    throw new Error("Failed to extract action items");
  }
};

module.exports = { extractActionItems };