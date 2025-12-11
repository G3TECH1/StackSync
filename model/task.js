const mongoose = require('mongoose')


const taskSchema = mongoose.Schema({
    // This is the column that link the flask/mysql db project table 
    //  to tasks , we store them in number
    project_id:{
        type: Number,
        index: true,
        required: true
    },

    title:{
        type: String,
        required: true,
        trim: true
    },

    description:{
        type: String,
        
    },

    // for the filter tag like(#Flask, #pytorch)
    stackTags:{
        type: String,
        required: true,
        default: 'General'
    },

    status:{
        enum: ['To Do', 'Complete', 'In Progress'],
        type: String,
        required: true,
        default: 'To Do'
    },

    // ---Metadata-----
    createdAt:{
        type: Date,
        default: Date.now
    }

})

const taskDocument = mongoose.model("Task", taskSchema)



module.exports = {taskDocument}




