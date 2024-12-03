const config = require("./config");
const axios = require("axios");

console.log("Using Prediction Guard API Key:", config.predictionguardApiKey);

const preprocessGoogleMeetTranscript = (ccTranscript) => {
  const grouped = ccTranscript.reduce((acc, segment) => {
    const speaker = segment.speaker || `Speaker ${segment.speaker_id}`;
    const text = segment.words.map((word) => word.text).join(" ");

    if (acc[speaker]) {
      acc[speaker].push(text);
    } else {
      acc[speaker] = [text];
    }
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([speaker, texts]) => `${speaker}: ${texts.join(" ")}`)
    .join("\n");
};

const extractActionItems = async (meetingTranscript) => {
  console.log("The meeting transcript:\n", meetingTranscript);
  try {
    const response = await axios.post(
      "https://api.predictionguard.com/chat/completions",
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
    console.log("Choices Object:", JSON.stringify(response.data.choices, null, 2));
    const rawContent = response.data.choices[0].message.content;
    const jsonContent = rawContent.substring(rawContent.indexOf('{')); 
    const data = JSON.parse(jsonContent).meeting_data;
    //const data = JSON.parse(response.data.choices[0].message.content).meeting_data;
    return data;
  } catch (error) {
    console.error("Error fetching data from Prediction Guard API:", error.response?.data || error.message);
    throw new Error("Failed to extract action items");
  }
};

module.exports = { preprocessGoogleMeetTranscript, extractActionItems };
