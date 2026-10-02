import "dotenv/config.js";
import ConnectDB from "./config/DB.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

ConnectDB();

app.listen(PORT, () => {
    console.log(`server started at PORT : ${PORT}`);
});