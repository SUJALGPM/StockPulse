# MERN Project

This is a MERN (MongoDB, Express.js, React, Node.js) stack project with a separate client and server structure.

## Project Structure

```
mern-project/
├── client/           # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/           # Node.js backend with Express
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Git Setup

Since Git may not be installed on this system, here are the steps to initialize and connect to your remote repository:

1. **Install Git** (if not already installed):
   - Download from https://git-scm.com/downloads
   - Follow the installation instructions

2. **Initialize the repository**:
   ```bash
   cd c:\Users\zycus\Documents\ZycusProject
   git init
   ```

3. **Connect to your remote repository**:
   ```bash
   git remote add origin https://github.com/Faisal786111/Zycus_Project.git
   git branch -M main
   ```

4. **Add and commit files**:
   ```bash
   git add .
   git commit -m "Initial commit: MERN project structure"
   ```

5. **Push to remote repository**:
   ```bash
   git push -u origin main
   ```

## Setup Instructions

Due to PowerShell execution policy restrictions, you may need to manually install dependencies:

### Server Setup
1. Navigate to the `server` directory
2. Run `npm install` to install server dependencies
3. Run `npm run dev` to start the development server

### Client Setup
1. Navigate to the `client` directory
2. Run `npm install` to install client dependencies
3. Run `npm run dev` to start the development server

### Running Both Servers
After installing dependencies in both directories:
- From the root directory, run `npx concurrently "npm run dev --prefix server" "npm run dev --prefix client"`

## Available Endpoints

### Server
- **Health Check**: `GET /api/health` - Returns server status
- **Base URL**: `http://localhost:2000`

### Client
- **Development Server**: `http://localhost:5173`