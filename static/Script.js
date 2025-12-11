const flashMessage = document.querySelector(".flash-message")

if (flashMessage){
    setTimeout(()=>{
        flashMessage.style.opacity = 0
            setTimeout(()=>{
                flashMessage.remove()
            }, 500)
    }, 5000)
}

const API_URL = window.EXPRESS_API_URL
const Task_containers = {
    "To Do" : document.getElementById("to-do-tasks"),
    "In Progress" : document.getElementById("in-progress-tasks"),
    "Complete" : document.getElementById("complete-tasks")
}


//Helper Function: Task Card HTML Renderer
const createTaskCard = function(task){
    let tagColor;
    switch(task.stackTags){
        case "Flask" : tagColor = "info"; break
        case "Bootstrap" : tagColor = "Success"; break
        case "Express" : tagColor = "Primary"; break

        default: tagColor = 'secondary'
    }
    return `
        <div class="card shadow-sm border-${tagColor}" data-task-id='${task._id}' data-tag='${task.stackTags}' draggable='true'>
            <div class='card-body'>
                <h5 class='card-title text-light'>${task.title}</h5>
                <p class="card-text text-muted small">${task.description || "No description provided."}</p>
                <span class="badge bg-${tagColor} tag-badge">#${task.stackTags}</span>
            </div>
            <div class="card-footer d-flex justify-content-between">
                <span class="text-muted small">ID: ${task._id.substring(0, 8)}...</span>
                <button class="btn btn-sm btn-outline-danger delete-task-btn" data-id="${task._id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `
}

// Helper Function: Get Active Project ID
const getActiveProjectId = () => {
    const activeProject = document.querySelector("#project-list a.active")
    return activeProject ? activeProject.dataset.id : null
}

// Function to load tasks (remains mostly the same but ensures container clearing)
const loadTasks = async function(projectId){
    Object.values(Task_containers).forEach(container => container.innerHTML = '')
    if(!projectId) return

    try{
        const response = await fetch(`${API_URL}/tasks/${projectId}`)
        if(!response.ok){
            throw new Error("Failed to fetch tasks")
        }
        const tasks = await response.json()
        
        if(tasks.length === 0){
            document.getElementById("no-tasks-message").textContent = "No tasks yet. Create one to get started!"
            document.getElementById("no-tasks-message").classList.remove('d-none')
        } else {
            document.getElementById("no-tasks-message").classList.add('d-none')
            tasks.forEach(task => {
                const cardHtml = createTaskCard(task)
                // Use task.status to find the correct container
                const container = Task_containers[task.status]
                if(container){
                    container.insertAdjacentHTML('beforeend', cardHtml)
                }
            })
        }

    }catch(error){
        console.error("Error fetching tasks:", error)
        // Show an error message in the console and UI placeholder
        document.getElementById("no-tasks-message").textContent = "Error loading tasks. See console for details."
        document.getElementById("no-tasks-message").classList.remove('d-none')

    }
}


// Handle New Task Submission
document.getElementById("newTaskForm").addEventListener("submit", async function(e){
    e.preventDefault()
    const projectId = getActiveProjectId()

    if(!projectId){
        // Replace alert() with a console log/better UI message
        console.error("Task creation failed: No active project selected.")
        alert("Please select a project first.")
        return
    }
    const formData = new FormData(e.target)
    
    // Create the task payload. Note: The input for stack is named 'stack_tag' in dashboard.html
    const taskData = {
        project_id: projectId, // This is explicitly set
        title: formData.get('title'),
        description: formData.get('description'),
        stack_tag: formData.get('stack_tag'), // Get value from form input named 'stack_tag'
        status: formData.get('status') || 'To Do' 
    }

    // simple validation for required fields
    if(!taskData.title || !taskData.stack_tag){
        alert("Title and Stack Tag are required.")
        return
    }
    document.getElementById("saveTaskBtn").disabled = true
    try{
        const response = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify(taskData)
        })
        if(!response.ok){
            throw new Error(`Failed to create task. Status: ${response.status} - ${await response.text()}`)
        }
         const newTask = await response.json()
         // success - close modal, reset form, reload tasks from the active project
         const modalElement = document.getElementById("newTaskModal");
         // Check if the modal instance exists before hiding
         const modalInstance = bootstrap.Modal.getInstance(modalElement);
         if (modalInstance) {
             modalInstance.hide();
         }
         e.target.reset() // clear form fields
        loadTasks(projectId)
    }catch(error){
        console.error("Error creating task:", error)
        alert(`Couldn't create task. Please try again. Details: ${error.message}`)
    }finally{
        document.getElementById("saveTaskBtn").disabled = false
    }
})


// Handle Project Switching (Move the content from dashboard.html script block here)
document.addEventListener("DOMContentLoaded", () => {
    // 1. Set the global API URL from the Jinja template variable
    // This assumes the script is loaded after the global variable is set in dashboard.html
    // window.EXPRESS_API_URL should be available globally from the Flask template
    const firstProject = document.querySelector("#project-list a.active");
    if (firstProject) {
        loadTasks(firstProject.dataset.id);
        document.getElementById('active-project-title').textContent = firstProject.textContent.trim();
    }
});

document.getElementById('project-list').addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.dataset.id) {
        // Update active state in sidebar
        document.querySelectorAll("#project-list a").forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');

        loadTasks(e.target.dataset.id);
        document.getElementById("active-project-title").textContent = e.target.textContent.trim();
    }
});

// Event listener for task deletion
document.getElementById('task-kanban').addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-task-btn') || e.target.closest('.delete-task-btn')) {
        e.preventDefault();
        const deleteButton = e.target.closest('.delete-task-btn');
        const taskId = deleteButton.dataset.id;
        const projectId = getActiveProjectId();

        // Simple confirmation replacement
        if (!window.confirm('Are you sure you want to delete this task?')) {
             return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                throw new Error("Failed to delete task.");
            }
            // Reload tasks after successful deletion
            loadTasks(projectId);
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Could not delete task. Please try again.");
        }
    }
});

// Drag and Drop (Kanban Board Functionality)
let draggedTask = null;

// Add dragstart listener to the kanban container to handle card dragging
document.getElementById('task-kanban').addEventListener('dragstart', (e) => {
    const card = e.target.closest('.card');
    if (card && card.draggable) {
        draggedTask = card;
        e.dataTransfer.setData('text/plain', card.dataset.taskId);
        setTimeout(() => {
            card.classList.add('dragging-task');
        }, 0);
    }
});

// Clean up after dragging stops
document.getElementById('task-kanban').addEventListener('dragend', (e) => {
    if (draggedTask) {
        draggedTask.classList.remove('dragging-task');
        draggedTask = null;
    }
});

// Prevent default behavior to allow dropping
document.querySelectorAll('.task-container').forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // This is crucial to allow dropping
        // Visual feedback
        container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
        container.classList.remove('drag-over');
    });

    // Handle the drop event
    container.addEventListener('drop', async (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');

        if (draggedTask) {
            const taskId = draggedTask.dataset.taskId;
            const newStatus = container.dataset.status;
            const projectId = getActiveProjectId();

            // 1. Move the card visually immediately
            container.appendChild(draggedTask);

            // 2. Update the status on the server
            try {
                const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) {
                    throw new Error("Failed to update task status.");
                }
                // The task is updated, but we can reload to ensure state consistency
                // For a smoother UX, we only reload on error or when necessary. 
                // Since we moved it visually, we can skip reload here unless the API response requires it.
                // const updatedTask = await response.json(); 
            } catch (error) {
                console.error("Error updating task status:", error);
                alert("Could not update task status. Please try again.");
                // Reload tasks to revert the visual change if the API call failed
                loadTasks(projectId);
            }
            draggedTask = null;
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
  const newProjectForm = document.getElementById('newProjectForm');
  const projectList = document.getElementById('project-list');
  const activeProjectTitle = document.getElementById('active-project-title');

  newProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(newProjectForm);

    try {
      const response = await fetch(newProjectForm.action, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status === 'success') {
        const projectId = result.project_id;
        const projectTitle = result.title;

        // Remove active class from existing active project
        const activeLink = projectList.querySelector('a.active');
        if (activeLink) activeLink.classList.remove('active');

        // Create new project element
        const newProjectLink = document.createElement('a');
        newProjectLink.href = '#';
        newProjectLink.className = 'list-group-item list-group-item-action active';
        newProjectLink.dataset.id = projectId;
        newProjectLink.textContent = projectTitle;

        // Append new project before the "Create New Project" link
        const createLink = projectList.querySelector('a.text-primary');
        projectList.insertBefore(newProjectLink, createLink);

        // Update active project title
        activeProjectTitle.textContent = projectTitle;

        // Close modal
        const modalElement = document.getElementById('newProjectModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();

        // Reset form
        newProjectForm.reset();

        // Load tasks or trigger any further logic here for the new active project
        // loadTasks(projectId); // Uncomment and define if needed

      } else {
        alert('Error creating project: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  });

  // Optional: handle click events on projects to switch active project
  projectList.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && !e.target.classList.contains('text-primary')) {
      e.preventDefault();
      const projectId = e.target.dataset.id;

      // Remove active from all and add to clicked
      projectList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      e.target.classList.add('active');

      // Update active project title
      activeProjectTitle.textContent = e.target.textContent.trim();

      // Load tasks for selected project
      loadTasks(projectId); // Uncomment and define if you have this function
    }
  });
});
