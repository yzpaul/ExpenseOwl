<p align="center">
<img src="/assets/logo.png" alt="ExpenseOwl Logo" width="250" height="250" /><br>
<h1 align="center">ExpenseOwl</h1><br>

<p align="center">
<a href="https://github.com/tanq16/expenseowl/actions/workflows/release.yml"><img src="https://github.com/tanq16/expenseowl/actions/workflows/release.yml/badge.svg" alt="Release Build"></a>&nbsp;<a href="https://goreportcard.com/report/github.com/tanq16/expenseowl"><img src="https://goreportcard.com/badge/github.com/tanq16/expenseowl" alt="Go Report Card"></a><br>
<a href="https://github.com/Tanq16/expenseowl/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/tanq16/expenseowl"></a>&nbsp;<a href="https://hub.docker.com/r/tanq16/expenseowl"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/tanq16/expenseowl"></a>
</p>
</p>

`ExpenseOwl` is an extremely simple expense tracking system offering a modern interface with a monthly pie-chart visualization. It helps track daily expenses, visualize monthly spending patterns, and maintain an overview of your financial habits.

---

- [Why Create This](#why-create-this)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Tech Stack](#technology-stack)

# Why Create This?

There are a ton of amazing projects for expense tracking all across GitHub ([Actual](https://github.com/actualbudget/actual), [Firefly III](https://github.com/firefly-iii/firefly-iii), etc.). They're all great, but they aren't the *fastest* when trying to add expenses, and offer a ton of features which I don't use. Some of them also use varying formats of data or complex API. Don't get me wrong, they're great when they fit your needs, but I wanted something dead simple that just gives me a pie chart per month and a tabular representation. NOTHING else!

Hence, I ended up creating this project, which I use to track my expenses. I also wanted data to be just JSON format, so I can do whatever I want with that, including a quick `jq` command to convert it to CSV. Also, the UI is mobile-friendly, so it works great for homelab use.

# Features

### Core Functionality

- Simple expense tracking with essential details only
- UUID-based expense identification in the backend
- Flat file storage system (default `data/expenses.json`)
- Docker container with support for persistent storage
- REST API for expense management
- Single-user focused (mainly for a homelab deployment)
- CLI for both server and client (if needed) operations

### Visualization

1. Dashboard with expense category breakdown (pie chart)
    - Click on a category to exclude it from the graph, click again to reset
2. Table view for detailed expense listing
    - This is where you can delete individual expenses
3. Month-by-month navigation

### Progressive Web App (PWA)

ExpenseOwl can be installed as a Progressive Web App on desktop and mobile devices. To install:

- Desktop: Click the install icon in your browser's address bar
- iOS: Use Safari's "Add to Home Screen" option in the share menu
- Android: Use Chrome's "Add to Home Screen" option in the menu

### Intention of Use

Just use this to add expenses quickly. It's been designed to help you do that. The default name for an expense is `unnamed` and the date is automatically set to current date. There's a set list of categories to choose from.

In the ideal case, `enter the amount and choose category` - that's it!

For a bit more involved case, `enter the amount and name, choose the category, and select the date` - still very simple!

The application only allows addition and deletion, there's no need for editing. There are no tags, no wallet info, nothing. Once again, plain and simple is the main intention with this one.

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

# Installation

### Go Install

```bash
go install github.com/tanq16/expenseowl/cmd/expenseowl@latest
```

### Docker Installation

```bash
docker pull tanq16/expenseowl:main
```

```bash
docker run -d \
  --name expenseowl \
  -p 8080:8080 \
  -v expenseowl_data:/app/data \
  tanq16/expenseowl:main
```

> [!WARNING]
> The image only builds for AMD64, so you should build it yourself for other architectures.

To use it with Docker compose or a container-management system like Portainer or Dockge, use this YAML definition:

```yaml
version: "3.8"
services:
  budgetlord:
    image: tanq16/expenseowl:main
    restart: unless-stopped
    ports:
      - 5006:8080
    volumes:
      - /home/tanq/expenseowl:/app/data # CHANGE DIR
```

### Building from Source

```bash
git clone https://github.com/tanq16/expenseowl.git && \
cd expenseowl
```

```bash
go build ./cmd/expenseowl
```

# Usage

Ideally, once deployed, just use the web interface and you're good to go. Access the web interface through your browser:

- Dashboard: `http://localhost:8080/`
- Table View: `http://localhost:8080/table`

If there are command-line automations that are required for use with the REST API, read on!

### CLI Mode

The application binary can run in either server or client mode:

Server Mode (Default):

```bash
./expenseowl
# or explicitly
./expenseowl --serve
```

Client Mode:

```bash
./expenseowl --client --addr localhost:8080
```

In client mode, you'll be prompted to enter the expense name, category (select from a list), amount, and date (in YYYY-MM-DD; optional, sets to current date when not provided).

### REST API

Add Expense:

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

Get All Expenses:

```bash
curl http://localhost:8080/expenses
```

# Technology Stack

- Backend: Go
- Storage: JSON file system
- Frontend: Chart.js and vanialla web stack (HTML, JS, CSS)
- Interface: CLI + Web UI
