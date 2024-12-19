const express = require("express");
const axios = require("axios");
const fs = require("fs").promises; 
const config = require("../config");
const {
  preprocessGoogleMeetTranscript,
  cleanUpTranscript,
  extractActionItems,
} = require("../utils");
const { sendEvent } = require("../events");
const { spawn } = require("child_process");

const router = express.Router();

router.post("/status_change", async (req, res) => {
  const { data } = req.body;
  res.status(200).send("OK");

  if (data.status.code === "done") {
    try {
      console.log("Initiating audio transcription...");

      // Initiate transcription
      const transcribeResponse = await axios.post(
        `https://${config.recallRegion}.recall.ai/api/v1/bot/${data.bot_id}/transcribe/`,
        {},
        {
          headers: {
            Authorization: `Token ${config.recallApiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Transcription initiated:", transcribeResponse.data);

      // Retrieve the transcript
      const transcriptResponse = await axios.get(
        `https://${config.recallRegion}.recall.ai/api/v1/bot/${data.bot_id}/transcript`,
        {
          headers: {
            Authorization: `Token ${config.recallApiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const transcript = transcriptResponse.data;
      if (!transcript || transcript.length === 0) {
        sendEvent({ error: "No transcript found" });
        return;
      }

      // Save transcript to file
      const transcriptDir = "./transcripts";
      const transcriptFilePath = `${transcriptDir}/${data.bot_id}_transcript.txt`;
      await fs.mkdir(transcriptDir, { recursive: true });
      await fs.writeFile(transcriptFilePath, JSON.stringify(transcript, null, 2));
      console.log(`Transcript saved to ${transcriptFilePath}`);

      // Process transcript
      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);
      const cleanTranscript = await cleanUpTranscript(preprocessedTranscript);
      const actionItems = await extractActionItems(cleanTranscript);
      const inputData = JSON.stringify({
        meeting_id:  data.bot_id, 
        transcript: cleanTranscript
      });
      // Send action items as event
      console.log("Sending action items:", actionItems);

      sendEvent({ action_items: actionItems });

      // Execute Python script
      const pythonScript = "RAG_pipeline.py";
      const pythonProcess = spawn("python3", [pythonScript]);

      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();

      // Handle Python script output
      pythonProcess.stdout.on("data", (data) => {
        console.log(`Python (stdout): ${data}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Python (stderr): ${data}`);
      });

      pythonProcess.on("close", (code) => {
        console.log(`Python process exited with code ${code}`);
        sendEvent({ status: "indexing_complete", bot_id: data.bot_id });
      });
    } catch (error) {
      console.error("Error processing transcription:", error.message || error);
      sendEvent({ error: "Error processing transcription" });
    }
  }
});

module.exports = router;