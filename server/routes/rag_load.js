const { spawn } = require("child_process");


async function executePythonScript(inputData) {
  return new Promise((resolve, reject) => {
    const pythonScript = "RAG_pipeline.py";
    const pythonProcess = spawn("python3", [pythonScript]);

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();


    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python (stdout): ${data}`);
    });


    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python (stderr): ${data}`);
    });


    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Python process completed successfully.");
        resolve();
      } else {
        reject(new Error(`Python process exited with code ${code}`));
      }
    });


    pythonProcess.on("error", (error) => {
      reject(error);
    });
  });
}

module.exports = { executePythonScript };