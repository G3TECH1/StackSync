const express = require('express')
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const taskRoute = require("./routes/taskRoute")
dotenv.config();


const app = express()
const PORT = process.env.PORT || 8001

app.use(cors({
    origin: 'http://127.0.0.1:8000'
}))
app.use(express.json())

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/stacksync_tasks_db")
try{
    console.log("Database connected")
}catch(err){
    console.log("Database error: ", err)
}


// app.get("/api/tasks/status", (req, res)=>{
//     res.json({message: "Express API is running and ready for tasks."})
// })

app.use("/api/tasks", taskRoute)


app.listen(PORT, ()=>{
    console.log(`Express Task API running on port ${PORT}`)
    console.log(`Express API url: http://127.0.0.1:${PORT}/api`)
})

