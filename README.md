# 🛡️ Venti-Guard -> Next-Gen Control System

![Venti-Guard Banner](https://img.shields.io/badge/Project-ABB_Accelerator_Hackathon_2026-blue?style=for-the-badge) 
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Venti-Guard** is a high-fidelity, life-critical Human Machine Interface (HMI) for underground mining ventilation. Built for the ABB Accelerator Hackathon 2026, it serves as a central control and monitoring dashboard to rapidly identify, triage, and resolve atmospheric and mechanical emergencies deep underground.

## ✨ Key Features

- **📡 Real-Time Telemetry Engine:** Live streaming of Oxygen (O₂), Carbon Monoxide (CO), Temperature (°C), and Fan RPM data across 6 different depth zones via Socket.io.
- **🚨 5 Dynamic Incident Profiles:**
  - **☠️ CO Leak:** Toxic gas accumulation requiring immediate extraction.
  - **🫁 O₂ Depletion:** Asphyxiation risk requiring air purge cycles.
  - **🌀 Fan Failure:** Mechanical trip requiring diagnostic restarts.
  - **💥 Methane Gas:** Extreme explosion hazard requiring mandatory fan auto-shutoffs and passive vent clearance (strict spark-prevention logic).
  - **🔥 Heat Emergency:** Thermal runaway requiring portable spot-cooling deployments.
- **📋 Smart Emergency Playbooks:** Context-aware, priority-based action checklists (P1 Immediate, P2 Urgent, P3 Follow-up) that adapt based on the specific incident type.
- **🗺️ Interactive Mine Map:** Real-time visual tracking of atmospheric conditions down to 800m depth, highlighting critical zones and visualizing the recovery progression.
- **🗄️ Persistent Incident History:** MongoDB integration to securely log all incident durations, peak severity, and resolution times for regulatory compliance.

## 🏗️ Architecture

Venti-Guard uses a full-stack, single-origin architecture optimized for high performance and easy cloud deployment:

- **Frontend:** React 19, Vite, Framer Motion (for dynamic UI morphing), Tailwind CSS.
- **Backend:** Node.js, Express, Socket.io (for sub-second telemetry streams).
- **Database:** MongoDB & Mongoose (for persistent incident reporting).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local instance)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/venti-guard.git
   cd venti-guard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ..
   ```

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and add your MongoDB connection string:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/venti-guard
   ```

4. **Start the Development Servers:**
   Run the following command to start both the Node/Socket backend and Vite frontend concurrently:
   ```bash
   npm run dev:all
   ```
   - **Frontend UI:** `http://localhost:5173`
   - **Backend API:** `http://localhost:4000`

## ☁️ Deployment (Render)

This project is configured out-of-the-box for a **single-service deployment** on Render using the provided `render.yaml` Blueprint.

1. Connect your repository to Render via **New > Blueprint**.
2. Render will automatically detect the configuration and build the application (`npm run build`).
3. When prompted, supply your `MONGO_URI` environment variable.
4. The Node backend will act as the single source of truth, serving both the Socket connections and the static React files on a single port.

## 🕹️ Demo Mode
Click the pulsing **🔀 RANDOM** button in the top navigation bar to inject a randomized mechanical or atmospheric fault into the system, allowing judges and users to experience the playbook resolution flow live.

---
*Built for the ABB Accelerator Hackathon 2026*
