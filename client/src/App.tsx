import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./components/Header/Header";
import MeetingDispatcher from "./components/MeetingDispatcher/MeetingDispatcher";
import MeetingDisplay from "./components/MeetingDisplay/MeetingDisplay";
import QueryHandler from "./components/QueryHandler/QueryHandler";
import { MeetingState } from "./constants";
import "./App.css";

function App() {
  const [meetingState, setMeetingState] = useState(MeetingState.NOT_STARTED);
  const [meetingError, setMeetingError] = useState("");
  const [queryAnswer, setQueryAnswer] = useState("");
  const [queryError, setQueryError] = useState("");
  const [activeTab, setActiveTab] = useState("meetings");
  const [selectedMeetingDate, setSelectedMeetingDate] = useState("");
  const [meetings, setMeetings] = useState<{ date: string; title: string }[]>([]);

  useEffect(() => {
    const fetchMeetingDates = async () => {
      try {
        const response = await axios.get("http://localhost:3000/queryRoutes/get_meeting_dates");
        const meetingData = response.data.map((date: string) => ({
          date,
          title: `Meeting on ${date}`,
        }));
        setMeetings(meetingData);
      } catch (error) {
        console.error("Error fetching meeting dates:", error);
      }
    };

    fetchMeetingDates();
  }, []);

  return (
    <div className="App">
      {/* Header Section */}
      <Header />

      {/* Tabs Section */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab("meetings")}
          className={activeTab === "meetings" ? "active" : ""}
        >
          Live Meeting Summary
        </button>
        <button
          onClick={() => setActiveTab("askAndAnswer")}
          className={activeTab === "askAndAnswer" ? "active" : ""}
        >
          Past Meeting RAG
        </button>
      </div>

      {/* Main Content */}
      {activeTab === "meetings" && (
        <div className="meetings-tab">
          <MeetingDispatcher
            meetingState={meetingState}
            setMeetingState={setMeetingState}
            setMeetingError={setMeetingError}
          />
          <MeetingDisplay
            meetingState={meetingState}
            setMeetingState={setMeetingState}
            meetingError={meetingError}
            setMeetingError={setMeetingError}
          />
        </div>
      )}

      {activeTab === "askAndAnswer" && (
        <div className="ask-answer-tab">
          <h2>Select a Past Meeting</h2>
          <select
            value={selectedMeetingDate}
            onChange={(e) => setSelectedMeetingDate(e.target.value)}
            style={{
              marginBottom: "20px",
              padding: "10px",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            <option value="">-- Select a Meeting --</option>
            {meetings.map((meeting) => (
              <option key={meeting.date} value={meeting.date}>
                {meeting.title} {/* Shows "Meeting on {date}" */}
              </option>
            ))}
          </select>

          {selectedMeetingDate && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Selected Meeting</h3>
              <p>{meetings.find((m) => m.date === selectedMeetingDate)?.title}</p>
            </div>
          )}

          <QueryHandler setQueryAnswer={setQueryAnswer} setQueryError={setQueryError} />

          {queryAnswer && (
            <div className="query-answer-display" style={{ marginTop: "20px" }}>
              <h3>Answer:</h3>
              <p>{queryAnswer}</p>
            </div>
          )}

          {queryError && (
            <div className="query-error-display" style={{ color: "red", marginTop: "10px" }}>
              {queryError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Header from "./components/Header/Header";
// import MeetingDispatcher from "./components/MeetingDispatcher/MeetingDispatcher";
// import MeetingDisplay from "./components/MeetingDisplay/MeetingDisplay";
// import QueryHandler from "./components/QueryHandler/QueryHandler";
// import { MeetingState } from "./constants";
// import "./App.css";

// function App() {
//   const [meetingState, setMeetingState] = useState(MeetingState.NOT_STARTED);
//   const [meetingError, setMeetingError] = useState("");
//   const [queryAnswer, setQueryAnswer] = useState("");
//   const [queryError, setQueryError] = useState("");
//   const [activeTab, setActiveTab] = useState("meetings");
//   const [selectedMeetingId, setSelectedMeetingId] = useState("");
//   const [meetings, setMeetings] = useState<{ id: string; title: string; date: string }[]>([]);
//   //const [actionItems, setActionItems] = useState<string[]>([]); // To store action items
//   //const [actionItemsError, setActionItemsError] = useState("");

//   useEffect(() => {
//     const fetchMeetingIds = async () => {
//       try {
//         const response = await axios.get("http://localhost:3000/queryRoutes/get_meeting_ids");
//         const meetingData = response.data.map((id: string) => ({
//           id,
//           title: `Meeting ${id}`,
//           date: "N/A",
//         }));
//         setMeetings(meetingData);
//       } catch (error) {
//         console.error("Error fetching meeting IDs:", error);
//       }
//     };

//     fetchMeetingIds();
//   }, []);

//   return (
//     <div className="App">
//       <Header />

//       <div className="tabs">
//         <button
//           onClick={() => setActiveTab("meetings")}
//           className={activeTab === "meetings" ? "active" : ""}
//         >
//           Live Meeting Summary
//         </button>
//         <button
//           onClick={() => setActiveTab("askAndAnswer")}
//           className={activeTab === "askAndAnswer" ? "active" : ""}
//         >
//           Past Meeting RAG
//         </button>
//       </div>

//       {activeTab === "meetings" && (
//         <div className="meetings-tab">
//           <MeetingDispatcher
//             meetingState={meetingState}
//             setMeetingState={setMeetingState}
//             setMeetingError={setMeetingError}
//           />
//           <MeetingDisplay
//             meetingState={meetingState}
//             setMeetingState={setMeetingState}
//             meetingError={meetingError}
//             setMeetingError={setMeetingError}
//           />
//         </div>
//       )}

//       {activeTab === "askAndAnswer" && (
//         <div className="ask-answer-tab">
//           <h2>Select a Past Meeting</h2>
//           <select
//             value={selectedMeetingId}
//             onChange={(e) => setSelectedMeetingId(e.target.value)}
//             style={{
//               marginBottom: "20px",
//               padding: "10px",
//               width: "100%",
//               maxWidth: "300px",
//             }}
//           >
//             <option value="">-- Select a Meeting --</option>
//             {meetings.map((meeting) => (
//               <option key={meeting.id} value={meeting.id}>
//                 {meeting.title} - {meeting.date}
//               </option>
//             ))}
//           </select>

//           {selectedMeetingId && (
//             <div style={{ marginBottom: "20px" }}>
//               <h3>Selected Meeting</h3>
//               <p>{meetings.find((m) => m.id === selectedMeetingId)?.title}</p>
//             </div>
//           )}

//           <QueryHandler setQueryAnswer={setQueryAnswer} setQueryError={setQueryError} />

//           {queryAnswer && (
//             <div className="query-answer-display" style={{ marginTop: "20px" }}>
//               <h3>Answer:</h3>
//               <p>{queryAnswer}</p>
//             </div>
//           )}

//           {queryError && (
//             <div className="query-error-display" style={{ color: "red", marginTop: "10px" }}>
//               {queryError}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
