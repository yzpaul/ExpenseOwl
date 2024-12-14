<p align="center">
<img src="/assets/logo.png" alt="BudgetLord Logo" width="200" height="200" /><br>
<h1 align="center">BudgetLord</h1><br>

<p align="center">
<a href="https://github.com/tanq16/budgetlord/actions/workflows/release.yml"><img src="https://github.com/tanq16/budgetlord/actions/workflows/release.yml/badge.svg" alt="Release Build"></a>&nbsp;<a href="https://github.com/Tanq16/BudgetLord/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/tanq16/budgetlord"></a>&nbsp;<a href="https://hub.docker.com/r/tanq16/budgetlord"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/tanq16/budgetlord"></a>
</p>
</p>

BudgetLord is a lightweight, single-user expense tracking system that combines the simplicity of CLI-based input with web-based visualization. It helps track daily expenses, visualize monthly spending patterns, and maintain an overview of your financial habits through an elegant dark or light mode interface.

# Screenshots

| | Desktop View | Mobile View |
| --- | --- | --- |
| Dashboard Light | <img src="/assets/dashboard-light.png" alt="Dashboard Light" /> | <img src="/assets/mobile-dashboard-light.png" alt="Mobile Dashboard Light" /> |
| Dashboard Dark | <img src="/assets/dashboard-dark.png" alt="Dashboard Dark" /> | <img src="/assets/mobile-dashboard-dark.png" alt="Mobile Dashboard Dark" /> |
| Table Light | <img src="/assets/table-light.png" alt="Table Light" /> | <img src="/assets/mobile-table-light.png" alt="Mobile Table Light" /> |
| Table Dark | <img src="/assets/table-dark.png" alt="Table Dark" /> | <img src="/assets/mobile-table-dark.png" alt="Mobile Table Dark" /> |

The interface automatically adapts to system preferences for themes. The views have the following features:

- **Dashboard View**:
  - Interactive pie chart showing expense distribution
  - Custom legend with percentage breakdowns
  - Real-time category totals
  - Seamless month-to-month navigation

- **Table View**:
  - Chronological expense listing
  - Quick category reference
  - Formatted currency display
  - Responsive mobile design
  - Expense deletion with confirmation

# Features

### Core Functionality

- Simple expense tracking with essential details
- UUID-based expense identification
- CLI for both server and client operations
- REST API for expense management
- Flat file storage system (default `data/expenses.json`)
- Single-user focused (mainly for a homelab deployment)
- Docker container with support for persistent storage

### Visualization Dashboard

Interactive data visualization via pie chart with three main aspects:
  1. Dashboard with expense category breakdown (pie chart)
  2. Table view for detailed expense listing
  3. Month-by-month navigation

### Progressive Web App (PWA)

BudgetLord can be installed as a Progressive Web App on desktop and mobile devices. To install:

1. Open BudgetLord in a supported browser
2. Look for the "Install" or "Add to Home Screen" option:
   - Desktop: Click the install icon in your browser's address bar
   - iOS: Use Safari's "Add to Home Screen" option in the share menu
   - Android: Use Chrome's "Add to Home Screen" option in the menu

# Installation

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

1. Pull the Docker image:
```bash
docker pull tanq16/budgetlord:main
```

2. Run with persistent storage:
```bash
docker run -d \
  --name budgetlord \
  -p 8080:8080 \
  -v budgetlord_data:/app/data \
  tanq16/budgetlord:main
```

> [!WARNING]
> The image only builds for AMD64, so you should build it yourself for other architectures.

# Usage

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

# Technical Stack

- Backend: Go
- Storage: JSON file system
- Frontend: Web-based dashboard with Chart.js
- API: REST
- Containerization: Docker support
- Interface: CLI + Web UI
