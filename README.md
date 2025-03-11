<p align="center">
<img src="/assets/logo.png" alt="ExpenseOwl Logo" width="250" height="250" /><br>
<h1 align="center">ExpenseOwl</h1><br>

<p align="center">
<a href="https://github.com/tanq16/expenseowl/actions/workflows/release.yml"><img src="https://github.com/tanq16/expenseowl/actions/workflows/release.yml/badge.svg" alt="Release Build"></a>&nbsp;<a href="https://goreportcard.com/report/github.com/tanq16/expenseowl"><img src="https://goreportcard.com/badge/github.com/tanq16/expenseowl" alt="Go Report Card"></a><br>
<a href="https://github.com/Tanq16/expenseowl/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/tanq16/expenseowl"></a>&nbsp;<a href="https://hub.docker.com/r/tanq16/expenseowl"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/tanq16/expenseowl"></a>
</p>
</p>

`ExpenseOwl` is an extremely simple expense tracking system with a modern monthly pie-chart visualization. It tracks daily expenses, visualizes monthly spending patterns, and maintains an overview of financial habits.

---

- [Why Create This](#why-create-this)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Tech Stack](#technology-stack)

# Why Create This?

There are a ton of amazing projects for expense tracking across GitHub ([Actual](https://github.com/actualbudget/actual), [Firefly III](https://github.com/firefly-iii/firefly-iii), etc.). They're all incredible, but they aren't the *fastest* when trying to add expenses and offer many features I don't use. Some use varying formats of data or complex budgeting or complex APIs. *Don't get me wrong*, they're incredible when fully utilized, but I wanted something dead simple that only gives me a monthly pie chart and a tabular representation. NOTHING else!

So, I created this project, which I use in my home lab to track my expenses. This app's intention is to track spending across your categories (custom or pre-defined) in a simplistic manner. There is no complicated searching or editing - just `add`, `delete`, and `view`! This intention will not change throughout the project's lifecycle. This is *not* an app for budgeting; it's for straightforward tracking.

# Features

### Core Functionality

- Simple expense tracking with essential details only (optional name, date without time, amount, and category)
- UUID-based expense identification in the backend
- Flat file storage system (`data/expenses.json`)
- Multi-architecture Docker container with support for persistent storage
- REST API for expense management
- Single-user focused (mainly for a home lab deployment)
- CSV and JSON export of all expense data from the UI
- Custom categories via app settings or environment variable (`EXPENSE_CATEGORIES`)
- Custom currency symbol in the frontend via app settings environment variable (`CURRENCY`)

### Visualization

1. Dashboard with expense category breakdown (pie chart)
    - Click on a category to exclude it from the graph, click again to add it back
    - This helps visualize the breakdown without considering some categories like Rent
    - The legend shows the total expenditure of the month along with the total without the "Rent" category
2. Table view for detailed expense listing
    - This is where you can view individual expenses chronologically and delete them
    - You can use the browser's search to find a name if needed
3. Month-by-month navigation
4. Settings page for setting custom categories, currency, and export data as CSV or JSON

### Progressive Web App (PWA)

The front end of ExpenseOwl can be installed as a Progressive Web App on desktop and mobile devices (i.e., the back end still needs to be self-hosted). To install:

- Desktop: Click the install icon in your browser's address bar
- iOS: Use Safari's "Add to Home Screen" option in the share menu
- Android: Use Chrome's "Install" option in the menu

### Intention of Use

I reiterate that you should use this to add expenses quickly. The default name for an expense is `unnamed`, and the date is automatically set to today. There's a default list of categories, which can be edited easily through an environment variable.

In the ideal case, `enter the amount and choose the category` - that's it!

For a bit more involved case, `enter the name, choose the category, enter the amount, and select the date` - still very simple!

The application only allows addition and deletion; there's no need for editing (if needed, just delete and re-add). There are no tags, wallet info, budgeting, or anything else! Plain and simple for the win.

# Screenshots

| | Desktop View | Mobile View |
| --- | --- | --- |
| Dashboard Light | <img src="/assets/dashboard-desktop-light.png" alt="Dashboard Light" /> | <img src="/assets/dashboard-mobile-light.png" alt="Mobile Dashboard Light" /> |
| Dashboard Dark | <img src="/assets/dashboard-desktop-dark.png" alt="Dashboard Dark" /> | <img src="/assets/dashboard-mobile-dark.png" alt="Mobile Dashboard Dark" /> |
| Table Light | <img src="/assets/table-desktop-light.png" alt="Table Light" /> | <img src="/assets/table-mobile-light.png" alt="Mobile Table Light" /> |
| Table Dark | <img src="/assets/table-desktop-dark.png" alt="Table Dark" /> | <img src="/assets/table-mobile-dark.png" alt="Mobile Table Dark" /> |

The interface automatically adapts to system preferences for themes.

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
-e EXPENSE_CATEGORIES="Rent,Food,Transport,Fun,Bills" \
-e CURRENCY=jpy \
-v expenseowl_data:/app/data \
tanq16/expenseowl:main # EXPENSE_CATEGORIES, CURRENCY are optional configs
```

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

### Kubernetes Deployment

The project also has a community-built Kubernetes spec. The spec is a sample and you should review it before deploying it within your cluster. Read the [associated readme](./kubernetes/README.md) for more information.

# Usage

Ideally, once deployed, use the web interface and you're good to go. Access the web interface through your browser:

- Dashboard: `http://localhost:8080/`
- Table View: `http://localhost:8080/table`

> [!NOTE]
> This app has no authentication, so deploy carefully. It works very well with a reverse proxy like Nginx Proxy Manager and is mainly intended for home lab use. The app has not undergone a pentest to allow for any production deployment. It should strictly be deployed in home lab settings, behind authentication, and for only one (or a few non-destructive) user(s).

If command-line automations are required for use with the REST API, read on!

### Executable

The application binary can be run directly within CLI for any common OS and architecture:

```bash
./expenseowl
# or from a custom directory
./expenseowl -data /custom/path
```

### REST API

ExpenseOwl provides an API to allow adding expenses via automations or simply via cURL, Siri Shortcuts, or other automations.

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

### Config Options

The primary config is stored in the data directory in the `config.json` file. A pre-defined configuration is automatically initialized. The currency in use and the categories can be customized from the `/settings` endpoint within the UI.

##### Currency Settings

ExpenseOwl supports multiple currencies through the CURRENCY environment variable. If not specified, it defaults to USD ($). All available options are shown in the UI settings page.

Alternatively, an environment variable can also be used to set the currency. This is useful for containerized deployments where non-sensitive configuration can remain as deployment templates. For example, to use Euro:

```bash
CURRENCY=eur ./expenseowl
```

The environment variable can be set in a compose stack or using `-e` in the command line with a Docker command.

##### Category Settings

ExpenseOwl also supports custom categories. A default set is pre-loaded in the config for ease of use and can be easily changed within the UI.

Alternatively, like currency, categories can also be specified in an environment variable like so:

```bash
EXPENSE_CATEGORIES="Rent,Food,Transport,Fun,Bills" ./expenseowl
```

# Contributing

Contributions are welcome; please ensure they align with the project's philosophy of simplicity. The project's core principle is maintaining user-facing simplicity by strictly using the current [tech stack](#technology-stack). It is intended for home lab use, i.e., a self-hosted first approach (containerized use). Consider the following:

- Additions should have sensible defaults without breaking foundations
- Environment variables should be used for user configuration in containers
- Custom features should prefer configuration via command-line arguments
- Found a typo? Please open an issue instead of a PR

Ideas and improvements are welcome! Feel free to start a discussion by opening an issue.

# Technology Stack

- Backend: Go
- Storage: JSON file system
- Frontend: Chart.js and vanilla web stack (HTML, JS, CSS)
- Interface: CLI + Web UI
