import React from "react";
import Navigation from "./Navigation";
import "../styles/Navigation.css";
import "../styles/Screens.css";

const Screen1: React.FC = () => (
  <div className="screen-container">
    <Navigation />
    <h1>Screen 1</h1>
    <p>This is the first screen.</p>
    <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
      <button className="screen-btn">Primary Action</button>
      <button className="screen-btn secondary">Secondary Action</button>
    </div>
  </div>
);

export default Screen1;