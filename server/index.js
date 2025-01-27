// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api");
const webhookRoutes = require("./routes/webhook");
const queryRoutes = require("./routes/queryRoutes"); 

const app = express();

// enable all CORS requests for demo
app.use(cors());

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

// Existing routes
app.use("/api", apiRoutes);
app.use("/webhook", webhookRoutes);
app.use("/queryRoutes", queryRoutes); 

app.listen(3000, () => console.log("Listening on port 3000."));