import React from "react";
import Navigation from "./Navigation";
import "../styles/Navigation.css";
import "../styles/Screens.css";
const Screen4: React.FC = () => (
  <div className="screen-container">
    <Navigation />
    <h1>Screen 4</h1>
    <p>This is the fourth screen.</p>
  </div>
);

export default Screen4;