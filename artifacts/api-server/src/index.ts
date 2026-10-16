/**
 * artifacts/api-server/src/index.ts
 *
 * Entry point — imports app (which loads dotenv + express),
 * then starts listening. Nothing else lives here.
 */
import app from './app';


const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`[api] MedVault API → http://localhost:${PORT}`);
  console.log(`[api] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET — AI summaries disabled'}`);
});