import React from "react";
import Navigation from "./Navigation";
import "../styles/Navigation.css";
import "../styles/Screens.css";

const Screen5: React.FC = () => (
  <div className="screen-container">
    <Navigation />
    <h1>Screen 5</h1>
    <p>This is the fifth screen.</p>
  </div>
);

export default Screen5;