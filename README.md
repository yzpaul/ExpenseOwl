# 📊 ExpenseOwl Credit Card Fork

This is a fork of [ExpenseOwl](https://github.com/yzpaul/ExpenseOwl) tailored to support credit card-style expense tracking with mock data population, Docker deployment, and local development support.

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

```sh
#!/bin/bash
set -e

echo "Stopping and removing old container..."
docker stop expenseowl 2>/dev/null || echo "No running container to stop"
docker rm expenseowl 2>/dev/null || echo "No existing container to remove"

echo "Building Docker image..."
docker build -t expenseowl-custom .

echo "Starting container..."
docker run -d -p 8080:8080 --name expenseowl expenseowl-custom

echo "Waiting for container to initialize..."
sleep 5

# Tag and push to Docker Hub
LOCAL_IMAGE="expenseowl-custom"
REMOTE_IMAGE="yzpaul/expenseowl-creditcard:latest"

docker tag $LOCAL_IMAGE $REMOTE_IMAGE
docker push $REMOTE_IMAGE
```

---

## ✅ Project Status

This fork is actively maintained with a focus on Docker-first deployment and ease of local testing using realistic seeded data.

Feel free to fork, open issues, or contribute!

