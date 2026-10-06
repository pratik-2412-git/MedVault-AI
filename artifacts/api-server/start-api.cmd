@echo off
set DATABASE_URL=postgresql://postgres:PratikSen@localhost:5432/medvault
set PORT=5432
set NODE_ENV=development
pnpm run dev
pause