import "./Header.css";

const Header = () => {
  return (
    <div className="Header">
  <img
    className="Header--logo"
    src="../assets/prediction_guard_1x1_light_background.svg"
    alt="My Logo"
  />
  <div>
    <h1 className="Header--heading">Prediction Guard Meeting Bot</h1>
    {/* <p className="Header--subheading">
      Enter your current meeting link and get a list of updates from each participant at the end of your meeting + Ask questions from past meetings.
    </p> */}
  </div>
</div>
    // <div className="Header">
    //   <img
    //       className="Header--logo"
    //       src="../assets/prediction_guard_1x1_light_background.svg"
    //       alt="My Logo"
    //   />
    //   <h1 className="Header--heading">Prediction Guard meeting bot</h1>
      
    //   <p className="Header--subheading">
    //     Enter your current meeting link and get a list of updates from each participant at the
    //     end of your meeting + Ask questions from past meetings.
    //   </p>
    // </div>
  );
};

export default Header;