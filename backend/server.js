import "dotenv/config"

import app from "./src/app.js";
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log("Server is running at Port: ", PORT);
  });
};

startServer();
