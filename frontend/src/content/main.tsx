
import { createRoot } from "react-dom/client";
import styles from "./content.css?inline";
import App from "./App";


export const HOST_ID = "quick-search-root";

const host = document.createElement("div");

host.id = HOST_ID;

document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const style = document.createElement("style");

style.textContent = styles;

shadow.appendChild(style);

const mountPoint = document.createElement("div");

shadow.appendChild(mountPoint);

createRoot(mountPoint).render(<App />);
