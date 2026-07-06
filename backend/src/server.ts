import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import organizationsRoutes from "./routes/organizations.routes";
import featureFlagsRoutes from "./routes/featureFlags.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/organizations", organizationsRoutes);
app.use("/flags", featureFlagsRoutes);

// Catch-all error handler — makes sure unexpected errors (e.g. a Prisma
// error) return clean JSON instead of crashing the process or leaking a
// stack trace to the client.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
