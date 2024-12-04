const express = require("express");
const axios = require("axios");
const fs = require("fs");
const config = require("../config");
const { preprocessGoogleMeetTranscript, extractActionItems } = require("../utils");
const { sendEvent } = require("../events");

const router = express.Router();

router.post("/status_change", async (req, res) => {
  const { data } = req.body;
  res.status(200).send("OK");

  if (data.status.code === "done") {
    try {
      console.log("Initiating audio transcription...");
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
      const transcriptDir = "./transcripts";
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }
      const transcriptFilePath = `${transcriptDir}/${data.bot_id}_transcript.txt`;
      fs.writeFileSync(transcriptFilePath, JSON.stringify(transcript, null, 2));
      console.log(`Transcript saved to ${transcriptFilePath}`);

      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);
      const actionItems = await extractActionItems(preprocessedTranscript);
      sendEvent(actionItems);
    } catch (error) {
      console.error("Error processing transcription:", error.message || error);
      sendEvent({ error: "Error processing transcription" });
    }
  }
});

module.exports = router;