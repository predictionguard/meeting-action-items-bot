const express = require("express");
const axios = require("axios");
const config = require("../config");
const {
    preprocessGoogleMeetTranscript,
    cleanUpTranscript,
    extractActionItems,
  } = require("../utils");
const { sendEvent } = require("../events");
const router = express.Router();

router.post("/status_change", async (req, res) => {
  const { data } = req.body;

  res.status(200).send("OK");

  if (data.status.code === "done") {
    try {
      const transcribeResponse = await axios.post(
        `https://${config.recallRegion}.recall.ai/api/v1/bot/${data.bot_id}/transcribe/`,
        {
          headers: {
            Authorization: `Token ${config.recallApiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
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
      // error handling for empty transcript
      if (transcript.length === 0) {
        sendEvent({ error: "No transcript found" });
        return;
      }
      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);
      console.log("transcript precleaned");
      const cleanTranscript = await cleanUpTranscript(preprocessedTranscript);
      console.log("transcript cleaned");
      const actionItems = await extractActionItems(cleanTranscript);
      console.log("transcript action items", actionItems);
      sendEvent(actionItems);
      const inputData = JSON.stringify({
        meeting_id: data.bot_id, 
        transcript: actionItems,
      });

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
      });
    } catch (error) {
      console.error(error);
      sendEvent({ error: "Error extracting action items" });
    }
  }
});

module.exports = router;