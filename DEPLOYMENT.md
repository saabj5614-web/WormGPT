# Deployment Guide — Nobita AI

This repository contains a Flask web app and a local-model inference setup. Vercel is used for the **static frontend only**; the AI model and Flask API must run on your Pterodactyl server.

## Architecture

- GitHub: source of truth for the project.
- Vercel: builds and hosts the website at a free `*.vercel.app` address.
- Pterodactyl: runs `chatbot/app.py` and an Ollama or llama.cpp inference backend.
- Browser requests go from the Vercel website to the Pterodactyl backend over HTTPS.

Vercel does not run or store the 5+ GB model. A Vercel domain also does not keep a Pterodactyl server online.

## Vercel setup

1. Import the private repository `saabj5614-web/WormGPT` into Vercel. If it is not listed, grant the Vercel GitHub App access to this repository in GitHub settings.
2. In Vercel → Project Settings → Environment Variables, add:
   - `PANEL_BACKEND_URL` = the public **HTTPS base URL** for the Pterodactyl Flask app, without a trailing slash or API path (example format: `https://your-backend.example.com`).
3. Keep the project root as the repository root. The included `vercel.json` runs `npm run build`, which copies the existing UI to `public/index.html` and injects the backend URL.
4. Deploy. The build deliberately stops with a clear error if `PANEL_BACKEND_URL` is missing.
5. After the first successful deployment, Vercel provides a `*.vercel.app` address. Set that exact origin as `VERCEL_ORIGIN` on the Pterodactyl backend, then restart the backend.

The backend URL must already be reachable over HTTPS for browser API calls to work. A panel's private/internal address is not enough.

## Pterodactyl setup

1. Create a Python server with enough disk space for the model plus temporary download space. The model is approximately 5.4 GB; reserve additional disk for the runtime and logs.
2. Import/clone this private GitHub repository into the server. If the panel cannot clone private repositories directly, use a GitHub deploy key/token with minimum read-only repository access, or upload a ZIP. Do not put a GitHub token in source code or commit it to Git.
3. Install the Python dependencies once:
   `python3 -m pip install --user -r chatbot/requirements.txt`
   If your panel provides a managed Python environment, use that environment's pip instead.
4. Make sure an inference backend is actually available in the container:
   - Ollama must be installed and the model must be created as `camchat` from the supplied `Modelfile`; or
   - `bin/llama-server` and `models/gemma4.gguf` must both be present, and the server must support the required CPU/GPU runtime.
5. Set the Pterodactyl startup command to `python3 chatbot/app.py` only if the inference backend is already running separately. If Ollama/llama.cpp must be launched in the same container, use a compatible supervisor/start script for that container instead; a plain Flask command alone does not start the model.
6. Set these environment variables in the Pterodactyl server:
   - `WEB_PORT` = the port allocated by the panel (or let the app read the panel's `SERVER_PORT`/ `PORT` variable).
   - `VERCEL_ORIGIN` = the exact deployed Vercel origin, e.g. `https://your-project.vercel.app`.
   - `ADMIN_TOKEN` = a long, unique secret used to protect system-prompt editing.
   - Optional: `BACKEND` = `ollama` or `llamacpp`, consistent with your running inference backend.
7. Open the Pterodactyl backend URL directly and check `/status`. Then open the Vercel URL and send a short test prompt.

## Private repository and moving between panels

The GitHub repository can be the source for more than one Pterodactyl server. Each server still needs its own compatible runtime, enough disk, the model file, and an accessible inference backend. Private repositories require the panel's Git integration to be authorized; a URL alone does not grant access.

For migration, clone the same repository on the new panel, copy/re-download the model into persistent storage, configure the same environment variables and allocated port, then start the service. The Vercel frontend only needs updating if the backend's public URL changes; update `PANEL_BACKEND_URL` in Vercel and redeploy.

## Known limitations to verify before public launch

- The configured model is a local model, not the ChatGPT model. Output quality and speed depend on model capability and the panel's actual CPU/GPU/RAM.
- The current Flask app keeps conversations and stats in memory; they can reset when the process restarts. Exported history requires persistent disk.
- The inference API needs to be reachable by Flask on the same container at `127.0.0.1:11434` unless you adapt the backend URL.
- Do not expose the site publicly until the Pterodactyl endpoint is HTTPS, CORS is restricted to the correct frontend origin, and `ADMIN_TOKEN` is set.
- A free Vercel hostname is available, but neither Vercel nor GitHub guarantees uninterrupted operation of the Pterodactyl AI backend.
