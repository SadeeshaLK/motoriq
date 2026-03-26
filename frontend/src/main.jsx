import React from "react"
import "./index.css"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { CompareProvider } from "./context/CompareContext"
import App from "./App"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <CompareProvider>
      <App />
    </CompareProvider>
  </BrowserRouter>
)