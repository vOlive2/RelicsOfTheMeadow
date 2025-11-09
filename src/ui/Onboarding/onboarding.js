import React from "react";
import ReactDOM from "react-dom/client";
import OnboardingMenu from "./OnboardingMenu.jsx";
import "./styles.css"; // ✅ Ensures the faction card CSS actually loads

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <OnboardingMenu />
  </React.StrictMode>
);
