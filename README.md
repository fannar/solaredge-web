# SolarEdge Data Viewer

Simple Node.js app (Express) that proxies data from an external endpoint at `/api` and displays it in a small UI at `/`.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the app:

`http://localhost:3000`

## Endpoints

- `/` UI that renders the data as a table and shows raw JSON
- `/api` proxies to the external SolarEdge endpoint

## Configuration

- `PORT` environment variable (default: `3000`)
- `SOLAREDGE_URL` external source URL (default: `http://0.0.0.0:8080/api/v1/solaredge`)


