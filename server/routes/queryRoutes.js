const express = require("express");
const { spawn } = require("child_process");

const router = express.Router();

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
