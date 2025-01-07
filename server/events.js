let client = null;

const eventsHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  client = res;

  req.on("close", () => {
    client = null;
  });
};

const sendEvent = (data) => {
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

module.exports = { eventsHandler, sendEvent };
// // After the debugging steps look at why action items are still not being displayed
// let client = null;

// const eventsHandler = (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   client = res;
//   console.log("Client connected to /events");

//   req.on("close", () => {
//     console.log("Client disconnected");
//     client = null;
//   });
// };

// function sendEvent(data) {
//   console.log("sendEvent triggered with data:", JSON.stringify(data, null, 2));

//   if (client) {
//     console.log("Client is connected. Sending event data...");
//     client.write(`data: ${JSON.stringify(data)}\n\n`);
//   } else {
//     console.log("No client connected. Data not sent.");
//   }
// }

// module.exports = { eventsHandler, sendEvent };

// // const sendEvent = (data) => {
// //   if (client) {
// //     client.write(`data: ${JSON.stringify(data)}\n\n`);
// //   }
// // };

// module.exports = { eventsHandler, sendEvent };