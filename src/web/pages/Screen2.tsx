import React from "react";
import Navigation from "./Navigation";
import "../styles/Navigation.css";
import "../styles/Screens.css";
const Screen2: React.FC = () => (
  <div className="screen-container">
    <Navigation />
    <h1>Screen 2</h1>
    <p>This is the second screen.</p>
  </div>
);

export default Screen2;