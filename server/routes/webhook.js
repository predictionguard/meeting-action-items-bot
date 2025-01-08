const express = require("express");
const axios = require("axios");
const config = require("../config");
const {
    preprocessGoogleMeetTranscript,
    cleanUpTranscript,
    extractActionItems,
  } = require("../utils");
const { sendEvent } = require("../events");
const fs = require("fs").promises; 
const router = express.Router();

router.post("/status_change", async (req, res) => {
  const { data } = req.body;

  res.status(200).send("OK");

  // extract action items when meeting is over
  if (data.status.code === "done") {
    try {
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
      //const transcript = transcriptResponse.data;   Uncomment
      const transcriptFilePath = `transcripts/08690d69-2f23-4592-bc77-bc5481756f88_transcript.txt`;
      const transcriptContent = await fs.readFile(transcriptFilePath, "utf-8");
      let transcript;
      try {
        transcript = JSON.parse(transcriptContent);
        // Ensure the parsed content is an array
        if (!Array.isArray(transcript)) {
          throw new Error("Parsed transcript is not an array");
        }
      } catch (error) {
        console.error("Error parsing transcript file:", error.message);
        throw new Error("Invalid transcript format");
      }
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