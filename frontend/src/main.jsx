import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className:
          "bg-white text-black dark:bg-gray-800 dark:text-white",
      }}
    />
  </React.StrictMode>
);
