# BudgetLord

<p align="center">
<img src="/assets/logo.png" alt="BudgetLord Logo" width="200" height="200" />

<p align="center">
<a href="https://github.com/tanq16/budgetlord/actions/workflows/release.yml"><img src="https://github.com/tanq16/budgetlord/actions/workflows/release.yml/badge.svg" alt="Release Build"></a>
</p>
</p>

BudgetLord is a lightweight, single-user expense tracking system that combines the simplicity of CLI-based input with web-based visualization. It provides an intuitive way to track daily expenses, visualize spending patterns, and maintain a clear overview of your financial habits through an elegant dark or light mode interface.

## Screenshots

<p align="center">
  <img src="/assets/dashboard-dark.png" alt="Dashboard Dark" width="400" align="top" />
  <img src="/assets/dashboard-light.png" alt="Dashboard Light" width="400" align="top" />
  <img src="/assets/table-dark.png" alt="Table Dark" width="400" align="top" />
  <img src="/assets/table-light.png" alt="Table Light" width="400" align="top" />
  <br/>
  <em>Desktop View - Dark and Light modes</em>
  <br/><br/>
  <img src="/assets/mobile-dashboard-dark.png" alt="Mobile Dashboard Dark" height="400" align="top" />
  <img src="/assets/mobile-dashboard-light.png" alt="Mobile Dashboard Light" height="400" align="top" />
  <img src="/assets/mobile-table-dark.png" alt="Mobile Table Dark" height="400" align="top" />
  <img src="/assets/mobile-table-light.png" alt="Mobile Table Light" height="400" align="top" />
  <br/>
  <em>Mobile View - Dark and Light modes</em>
</p>

The interface automatically adapts to your system preferences, featuring:

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

Both views feature automatic dark/light mode switching, elegant transitions, and a clean, minimalist design focused on data visibility.

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

### Progressive Web App (PWA)

BudgetLord can be installed as a Progressive Web App on desktop and mobile devices, offering:

- **Installation**: Install directly from your browser to your device
- **Standalone Mode**: Runs in its own window, without browser navigation bars
- **App-like Experience**: 
  - Full-screen interface
  - Native-like app icon in your launcher/home screen
  - System-integrated dark/light mode support
  - Responsive design for all screen sizes
- **Platform Support**:
  - Desktop: Chrome, Edge, and other Chromium-based browsers
  - iOS: Safari
  - Android: Chrome and other modern browsers

To install BudgetLord as a PWA:
1. Open BudgetLord in a supported browser
2. Look for the "Install" or "Add to Home Screen" option:
   - Desktop: Click the install icon in your browser's address bar
   - iOS: Use Safari's "Add to Home Screen" option in the share menu
   - Android: Use Chrome's "Add to Home Screen" option in the menu

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

- Food & Groceries
- Travel
- Rent
- Utilities
- Entertainment
- Healthcare
- Shopping
- Miscellaneous

## Technical Stack

- Backend: Go
- Storage: JSON file system
- Frontend: Web-based dashboard with Chart.js
- API: REST
- Containerization: Docker support
- Interface: CLI + Web UI
