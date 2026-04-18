module.exports = {
  apps: [
    {
      name: "pf-backend",
      cwd: "../backend",
      script: "uvicorn",
      args: "main:app --host 0.0.0.0 --port 8000",
      interpreter: "python3",
      env: {
        MONGODB_URL: "mongodb://pfuser:pfpass123@localhost:27017/personalfinance?authSource=personalfinance",
        MONGODB_DB: "personalfinance",
      },
    },
    {
      name: "pf-frontend",
      cwd: "../frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "http://localhost:8000",
      },
    },
  ],
};
