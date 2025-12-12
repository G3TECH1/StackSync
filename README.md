# 🚀 StackSync: Plan the Stack, Not Just the Task

**StackSync** is a collaborative, multi-stack project planner designed for teams working with microservices and polyglot architectures (multiple programming languages/frameworks). It solves the problem of dependency management and visualization across different technology stacks (e.g., Flask, Express, GoLang) within a single project.

## ✨ Features

* **Multi-Stack Visualization:** Use **StackTags** (`#Flask`, `#Express`, etc.) to instantly filter and visualize work queues by technology.
* **Kanban Board:** Intuitive drag-and-drop interface for updating task status (To Do, In Progress, Complete).
* **Secure Authentication:** User registration and login with account lock-out and password reset policies (Flask/MySQL).
* **Collaborative:** User accounts linked to multiple projects.
* **RESTful API:** Dedicated Express API for high-performance task management (CRUD).

## 🛠️ Architecture

StackSync uses a robust, two-tier microservice architecture:

| Service | Technology | Role | Database |
| :--- | :--- | :--- | :--- |
| **Frontend/Auth** | **Flask (Python)** | Handles user authentication, session management, and project creation. Renders Jinja2 templates for the dashboard. | MySQL/SQLAlchemy |
| **Task API** | **Express (Node.js)** | High-performance RESTful API for all task-related CRUD operations and future features like file uploads. | MongoDB/Mongoose |



## 💻 Setup and Installation

Follow these steps to get StackSync running locally.

### Prerequisites

* Python 3.8+
* Node.js and npm (or yarn)
* A running MySQL database instance
* A running MongoDB database instance

### 1. Backend Setup (Flask/Python)

```bash
# Clone the repository
git clone [YOUR_REPO_URL]
cd stacksync/flask_app

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (Database URLs, Flask Secret Key, etc.)
# Set EXPRESS_API_URL to your Node.js server address (e.g., http://localhost:5001/api)

# Initialize the database (MySQL)
flask shell
>>> db.create_all() 
>>> exit()

# Run the Flask app
flask run 
# Default: [http://127.0.0.1:5000](http://127.0.0.1:5000)
#API SETUP

cd ../express_api # Assuming this folder structure

# Install dependencies
npm install 

# Configure environment variables (MongoDB URL, etc.)

# Run the Express API
node server.js 
# Default: [http://127.0.0.1:5001](http://127.0.0.1:5001)
