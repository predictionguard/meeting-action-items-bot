const express = require("express");
const { exec } = require("child_process"); // Import exec from child_process
const { spawn } = require("child_process");
const router = express.Router();

// Endpoint to get meeting IDs
router.get("/get_meeting_dates", (req, res) => {
  exec("python3 fetch_meeting_ids.py", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching meeting IDs: ${stderr}`);
      res.status(500).json({ error: "Failed to fetch meeting IDs" });
      return;
    }

    try {
      const meeting_dates = JSON.parse(stdout);
      res.json(meeting_dates);
    } catch (parseError) {
      console.error("Error parsing meeting IDs:", parseError);
      res.status(500).json({ error: "Error parsing meeting IDs" });
    }
  });
});

// Endpoint to handle questions
router.post("/", (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Invalid or missing question" });
  }

  const pythonScript = "query_answer.py";
  const pythonProcess = spawn("python3", [pythonScript]);

  let responseData = "";

  pythonProcess.stdout.on("data", (data) => {
    responseData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python (stderr): ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python process exited with code ${code}`);
    if (code === 0) {
      res.json({ answer: responseData.trim() });
    } else {
      res.status(500).json({ error: "Error retrieving answer" });
    }
  });

  pythonProcess.stdin.write(question);
  pythonProcess.stdin.end();
});

module.exports = router;