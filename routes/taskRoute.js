const express = require('express')
const router = express.Router()
const {taskDocument} = require("../model/task")


// First get the projects or task
router.get("/:projectId", async(req, res)=>{
    try{
        let task = await taskDocument.find({project_id: req.params.projectId}).sort({createdAt: -1})
        res.json(task)
    }catch(err){
        console.error(err.message)
        res.status(500).send("Server Error")
    }
})

router.post("/", async(req, res)=>{
    // Destructure using the expected keys from the frontend form submission
    const { project_id, title, description, stack_tag, status } = req.body;
    
    try{
        let newTask = new taskDocument({
            // Use project_id from the request body
            project_id: project_id,
            title: title,
            description: description,
            // Use stack_tag from the request body for stackTags field in the model
            stackTags: stack_tag,
            status: status || "To Do"
        })

        const newlyCreatedTask = await newTask.save()
        res.json(newlyCreatedTask)
    }catch(error){
        console.error(error.message)
        res.status(500).send("Server Error")
    }
})


// to update a task like change status or tag
router.put("/:id", async(req, res)=>{
    const {title, description, stack, status} = req.body

    const taskFields = {}
    if(title) taskFields.title = title
    if(description) taskFields.description = description
    if(stack) taskFields.stack = stack
    if(status) taskFields.status = status

    try{
        let task = await taskDocument.findById(req.params.id)
        if(!task) return res.status(404).json({msg: "Task not found"})
        
        task = await taskDocument.findByIdAndUpdate(
            req.params.id,
            {$set: taskFields},
            {new: true}
        )
        res.json(task)
    }catch(err){
        console.error(err.message)
        res.status(500).send("Server Error")
    }
})

router.delete("/:id", async(req, res)=>{
    try{
        const task = await taskDocument.findByIdAndDelete(req.params.id)
        if(!task){
            return res.status(404).send("Task not found")
        }
        res.json({msg: "Task removed"})
    }catch(err){
        console.error(err.message)
        res.status(500).send("Server Error")
    }
})


module.exports = router