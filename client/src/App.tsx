import { useState } from "react";
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

  return (
    <div className="App">
      {/* Header Section */}
      <Header />

      {/* Meeting Management Section */}
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

      {/* Query Handling Section */}
      <QueryHandler
        setQueryAnswer={setQueryAnswer}
        setQueryError={setQueryError}
      />

      {/* Display Query Answer */}
      {queryAnswer && (
        <div className="query-answer-display">
          <h2>Answer:</h2>
          <p>{queryAnswer}</p>
        </div>
      )}

      {/* Display Query Errors */}
      {queryError && (
        <div className="query-error-display">
          <p style={{ color: "red" }}>{queryError}</p>
        </div>
      )}
    </div>
  );
}

export default App;
