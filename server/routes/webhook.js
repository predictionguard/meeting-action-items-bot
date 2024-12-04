const express = require("express");
const axios = require("axios");
const fs = require("fs");
const config = require("../config");
//const { preprocessGoogleMeetTranscript } = require("../utils");
const { storeTranscriptInLanceDB, generateWithRAG } = require("../RAG_utils");
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

      console.log("Storing transcript in LanceDB...");
      await storeTranscriptInLanceDB(transcriptFilePath, data.bot_id);

      console.log("Generating summary using RAG pipeline...");
      const summaryQuery = "Summarize the meeting.";
      const meetingSummary = await generateWithRAG(summaryQuery);

      console.log("Meeting Summary Generated:", meetingSummary);

      sendEvent({ meeting_summary: meetingSummary });
    } catch (error) {
      console.error("Error processing transcription and RAG pipeline:", error.message || error);
      sendEvent({ error: "Error processing transcription and RAG pipeline" });
    }
  }
});

module.exports = router;
