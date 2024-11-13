# README.md

# Personal Expense Manager

A lightweight, single-user expense tracking system with data visualization capabilities.

## Overview

This personal expense manager provides a simple yet effective way to track expenses through a REST API and visualize spending patterns through an intuitive web interface. Built with Go, it uses a straightforward storage solution and provides rich visualization of expense patterns.

## Features

### Core Functionality
- Simple expense tracking with essential details
- UUID-based expense identification
- REST API for expense management
- Flat file storage system
- Single-user focused

### Data Tracking
- Expense name
- Category classification
- Amount tracking
- Date recording

### Visualization Dashboard
- Dark mode interface
- Interactive data visualization
- Three main views:
  1. 6-month expense trends (line chart)
  2. Current month's category distribution (pie chart)
  3. Top 20 expenses table (current & previous month)

## API Endpoints

### Add Expense
```
PUT /expense
```

### Get All Expenses
```
GET /expenses
```

## Technical Stack

- Backend: Go
- Storage: Flat file system
- Frontend: Web-based dashboard
- API: REST

## Getting Started

[Installation instructions will be added]

## Usage

### Adding an Expense
```bash
# Example curl command will be added
```

### Viewing Expenses
Access the dashboard through your web browser at `http://localhost:[PORT]`
