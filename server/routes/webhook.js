const express = require("express");
const { executePythonScript } = require("./rag_load");
const axios = require("axios");
const config = require("../config");
const {
    preprocessGoogleMeetTranscript,
    cleanUpTranscript,
    extractActionItems,
  } = require("../utils");
const { sendEvent } = require("../events");
const router = express.Router();
const fs = require('fs').promises;
router.post("/status_change", async (req, res) => {
  const { data } = req.body;
  console.log("Here is the meeting date", data.status.created_at);
  res.status(200).send("OK");

  if (data.status.code === "done") {
    try {

      const meetingDateTime = data.status.created_at;
      const formattedDateTime = new Date(meetingDateTime).toLocaleString(); 
      // const transcriptFilePath = `transcripts/32faabb5-bcc0-4fde-ac36-aba309355ca4_transcript.txt`;
      // const transcriptContent = await fs.readFile(transcriptFilePath, "utf-8");
      // let transcript;
      // try {
      //   transcript = JSON.parse(transcriptContent);
      //   if (!Array.isArray(transcript)) {
      //     throw new Error("Parsed transcript is not an array");
      //   }
      // } catch (error) {
      //   console.error("Error parsing transcript file:", error.message);
      //   throw new Error("Invalid transcript format");
      // }
      // if (transcript.length === 0) {
      //   sendEvent({ error: "No transcript found" });
      //   return;
      // }
      // console.log("transcript processed");

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
      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);
      console.log("transcript precleaned");
      const cleanTranscript = await cleanUpTranscript(preprocessedTranscript);
      console.log("transcript cleaned");
      const actionItems = await extractActionItems(cleanTranscript);
      console.log("transcript action items", actionItems);
      sendEvent(actionItems);
      const inputData = {
        meeting_id: data.bot_id, 
        transcript: cleanTranscript,
        meetingDateTime: formattedDateTime,
      };

      await executePythonScript(inputData);
    } catch (error) {
      console.error(error);
      sendEvent({ error: "Error extracting action items" });
    }
  }
});

module.exports = router;