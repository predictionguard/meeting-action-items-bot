import "./Header.css";

const Header = () => {
  return (
    <div className="Header">
      <h1 className="Header--heading">Get updates from standup</h1>
      <p className="Header--subheading">
        Enter your current meeting link and get a list of updates after the standup.
      </p>
    </div>
  );
};

export default Header;
