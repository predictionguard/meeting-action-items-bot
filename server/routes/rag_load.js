const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const config = require("./config");
const {
  preprocessGoogleMeetTranscript,
  cleanUpTranscript
} = require("../utils");
const { sendEvent } = require("../events");

/**
 * Processes all text files in the transcript directory.
 * Each file is processed by preprocessing, cleaning, extracting action items,
 * and running further steps such as sending events and executing a Python script.
 */
async function processAllTranscripts() {
  try {
    const transcriptDir = "./transcripts";

    // Ensure the directory exists
    const files = await fs.readdir(transcriptDir);

    // Loop through each file in the directory
    for (const file of files) {
      const filePath = path.join(transcriptDir, file);

      // Skip non-text files
      if (path.extname(file) !== ".txt") {
        console.log(`Skipping non-text file: ${file}`);
        continue;
      }

      // Read and parse the transcript file
      console.log(`Processing transcript file: ${file}`);
      const rawTranscript = await fs.readFile(filePath, "utf-8");
      const transcript = JSON.parse(rawTranscript);

      // Extract bot ID from the file name (assuming it's part of the name)
      const botId = path.basename(file, path.extname(file));

      // Step 1: Preprocess the transcript
      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);

      // Step 2: Clean the transcript
      const cleanTranscript = await cleanUpTranscript(preprocessedTranscript);


      // Step 5: Execute the Python script for further processing
      const pythonScript = "RAG_pipeline.py";
      const pythonProcess = spawn("python3", [pythonScript]);

      // Send the cleaned transcript to the Python script
      pythonProcess.stdin.write(cleanTranscript);
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
        sendEvent({ status: "indexing_complete", bot_id: botId });
      });
    }

    console.log("All transcripts processed successfully.");
  } catch (error) {
    console.error("Error processing transcripts:", error.message || error);
  }
}

module.exports = { processAllTranscripts };