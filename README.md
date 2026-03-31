# SolarEdge Data Viewer

Simple TypeScript app (Express) that proxies data from an external SolarEdge endpoint at `/api` and displays it in a monitoring dashboard at `/`.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm run dev
```

Or build and start:

```bash
npm run build
npm start
```

3. Open the app:

`http://localhost:3000`

## Endpoints

- `/` monitoring dashboard with live-updating KPIs, power chart, and power factor gauge
- `/api` proxies to the external SolarEdge endpoint

## Configuration

- `PORT` environment variable (default: `3000`)
- `SOLAREDGE_URL` external source URL (default: `http://0.0.0.0:8080/api/v1/solaredge`)


