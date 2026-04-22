import React from "react"
import "./index.css"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { CompareProvider } from "./context/CompareContext"
import { ThemeProvider } from "./context/ThemeContext"
import App from "./App"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <CompareProvider>
        <App />
      </CompareProvider>
    </ThemeProvider>
  </BrowserRouter>
)