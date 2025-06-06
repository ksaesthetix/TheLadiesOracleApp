import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Screen1 from "./pages/Screen1";
import Screen2 from "./pages/Screen2";
import Screen3 from "./pages/Screen3";
import Screen4 from "./pages/Screen4";
import Screen5 from "./pages/Screen5";


const MainApp: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Screen1 />} />
      <Route path="/screen1" element={<Screen1 />} />
      <Route path="/screen2" element={<Screen2 />} />
      <Route path="/screen3" element={<Screen3 />} />
      <Route path="/screen4" element={<Screen4 />} />
      <Route path="/screen5" element={<Screen5 />} />
    </Routes>
  </Router>
);

export default MainApp;