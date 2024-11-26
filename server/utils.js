import * as pg from '../dist/index.js';
const config = require("./config");
//const OpenAI = require("openai");
const client = new pg.Client(
  'https://api.predictionguard.com', 
  process.env.PREDICTIONGUARD_API_KEY
);
// const openai = new OpenAI({
//   apiKey: config.openaiApiKey,
// });

const extractActionItems = async (meetingTranscript) => {
  const input = {
    model: 'Neural-Chat-7B', 
    messages: [
      {
        role: 'system',
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
    maxTokens: 1000, 
    temperature: 0.1, 
    topP: 0.1, 
    topK: 50, 
  };

  // Call Prediction Guard Chat API
  var [result, err] = await client.Chat(input);

  // Handle errors
  if (err != null) {
    console.error('ERROR:', err.error);
    throw new Error('Failed to extract action items: ' + err.error);
  }

  // Parse the response and extract meeting data
  const responseContent = result.choices[0].message.content;
  const data = JSON.parse(responseContent).meeting_data;

  return data;
};

export { extractActionItems };