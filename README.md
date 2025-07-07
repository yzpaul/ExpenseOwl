# 📊 ExpenseOwl Credit Card Fork

This is a fork of [ExpenseOwl](https://github.com/Tanq16/ExpenseOwl) in TypeScript tailored to support credit card-style expense tracking with mock data population, Docker deployment, and local development support.

---

## 🧑‍💻 Local Development

Run the app locally with hot-reloading:

```bash
npm run dev
```

This uses `tsx` in watch mode to serve the project. Expenses are hardcoded for UI testing and stored in `data/expenses.json`.

---

## 🐳 Docker

### Build & Run with Mock Data

```bash
npm run docker
```


Steps performed:
- Stops and removes any running container.
- Builds the Docker image (`expenseowl-custom`).
- Runs the container on port `8080`.
- Executes `mock-data-populate.sh` to seed `expenses.json` in the Docker environment.

### Publish to Docker Hub

```bash
npm run publish
```


Steps performed:
- Rebuilds the Docker image.
- Tags the image as `yzpaul/expenseowl-creditcard:latest`.
- Pushes to Docker Hub.

---

## 📂 Scripts

### `scripts/restart.sh`

Used for local testing USING DOCKER and demo data population.

### `scripts/docker-deploy.sh`

Used for building and publishing the Docker image.

---

## ✅ Project Status

This is a TypeScript fork of ExpenseOwl with a focus on credit-card statement imports 
(transaction are assumed to be negative as opposed to bank account imports in the original where a transaction is positive)