import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navigation.css";

const Navigation: React.FC = () => (
  <nav className="navigation">
    <Link to="/screen1" className="nav-link">Screen 1</Link>
    <Link to="/screen2" className="nav-link">Screen 2</Link>
    <Link to="/screen3" className="nav-link">Screen 3</Link>
    <Link to="/screen4" className="nav-link">Screen 4</Link>
    <Link to="/screen5" className="nav-link">Screen 5</Link>
  </nav>
);

export default Navigation;