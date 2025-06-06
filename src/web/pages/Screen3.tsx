import React from "react";
import Navigation from "./Navigation";
import "../styles/Navigation.css";
import "../styles/Screens.css";
const Screen3: React.FC = () => (
  <div className="screen-container">
    <Navigation />
    <h1>Screen 3</h1>
    <p>This is the third screen.</p>
  </div>
);

export default Screen3;