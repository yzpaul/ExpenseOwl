# BudgetLord - Personal Expense Tracker

> [!NOTE]
> This is another repo I used to test the capabilities of LLMs. Nothing in this repo apart from this callout block was written directly by me. Everything was an output from the LLM that I directed to write things a certain way through my prompts. That includes the Dockerfile and GitHub build workflow.

A lightweight, single-user expense tracking system with CLI support, dead-simple data visualization, and Docker deployment options.

## Overview

This personal expense manager provides a simple yet effective way to track expenses through both a CLI and REST API, with spending patterns visualized through an intuitive web interface. Built with Go, it uses a straightforward JSON file storage solution and provides rich visualization of expense patterns.

## Features

### Core Functionality
- Simple expense tracking with essential details
- UUID-based expense identification
- CLI for both server and client operations
- REST API for expense management
- Flat file storage system
- Single-user focused
- Docker support with persistent storage

### Data Tracking
- Expense name
- Category classification
- Amount tracking
- Date recording

### Visualization Dashboard
- Dark mode interface
- Interactive data visualization
- Three main aspects:
  1. Dashboard with expense category breakdown (pie chart)
  2. Table view for detailed expense listing
  3. Month-by-month navigation

## Installation

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/tanq16/budgetlord.git
cd budgetlord
```

2. Build the binary:
```bash
go build ./cmd/budgetlord
```

### Docker Installation

1. Build the Docker image:
```bash
docker build -t budgetlord .
```

2. Run with persistent storage:
```bash
docker run -d \
  --name budgetlord \
  -p 8080:8080 \
  -v budgetlord_data:/app/data \
  budgetlord
```

## Usage

### CLI Mode

The application can run in either server or client mode:

#### Server Mode (Default)
```bash
./budgetlord
# or explicitly
./budgetlord --serve
```

#### Client Mode
```bash
./budgetlord --client --addr localhost:8080
```

In client mode, you'll be prompted to enter:
1. Expense name (required)
2. Category (select from provided list)
3. Amount (required)
4. Date (optional, format: YYYY-MM-DD)
   - If no date is provided, current date is used
   - Time is automatically set to 2 PM in your local timezone

### REST API

#### Add Expense
```bash
curl -X PUT http://localhost:8080/expense \
-H "Content-Type: application/json" \
-d '{
    "name": "Groceries",
    "category": "Food",
    "amount": 75.50,
    "date": "2024-03-15T14:30:00Z"
}'
```

#### Get All Expenses
```bash
curl http://localhost:8080/expenses
```

### Web Interface

Access the web interface through your browser:

- Dashboard: `http://localhost:8080/`
- Table View: `http://localhost:8080/table`

Features:
- Switch between dashboard and table views
- Navigate through months
- View expense breakdowns by category
- See detailed expense listings

## Data Storage

- Expenses are stored in a JSON file at `./data/expenses.json`
- The data directory is created automatically
- In Docker, data persists in a mounted local directory

## Categories

Default expense categories:
- Food
- Transportation
- Housing
- Utilities
- Entertainment
- Healthcare
- Shopping
- Other

## Technical Stack

- Backend: Go
- Storage: JSON file system
- Frontend: Web-based dashboard with Chart.js
- API: REST
- Containerization: Docker support
- Interface: CLI + Web UI
