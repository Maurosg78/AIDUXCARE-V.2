#!/bin/bash

echo "Agrega las variables de entorno a Vercel (entorno production). Copia y pega cada valor cuando la CLI lo solicite."

vercel env add VITE_SUPABASE_URL production
echo "https://mchxyyuaegsbrwodenqr.supabase.co"

vercel env add VITE_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dHpndHptYWh3aWdhenFrYW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTY1NTQsImV4cCI6MjA2MzA5MjU1NH0.YwBrDh5g8IGHLO26zPQyOuKGVEQg2h8d-W5gnvA1V88"

vercel env add VITE_LANGFUSE_PUBLIC_KEY production
echo "pk-1f-57c6e2ec-8603-44cf-b030-cddce1f1f13d"

vercel env add VITE_LANGFUSE_SECRET_KEY production
echo "sk-1f-c1872960-86af-4899-b275-b7de8d536794"

vercel env add VITE_ANALYTICS_ENABLED production
echo "true"

vercel env add VITE_ANALYTICS_PILOT_MODE production
echo "true"

vercel env add VITE_ENCRYPTION_ENABLED production
echo "true"

vercel env add VITE_AUDIT_LOGGING_ENABLED production
echo "true"

vercel env add VITE_FEATURE_AUDIO_CAPTURE production
echo "true"

vercel env add VITE_FEATURE_SOAP_EDITOR production
echo "true"

vercel env add VITE_FEATURE_AGENT_SUGGESTIONS production
echo "true"

vercel env add VITE_FEATURE_MCP_INTEGRATION production
echo "true"

vercel env add VITE_UI_MODE production
echo "pilot"

vercel env add VITE_SHOW_PILOT_BANNER production
echo "true"

vercel env add VITE_PILOT_FEEDBACK_ENABLED production
echo "true"

echo "\n¡Listo! Todas las variables han sido agregadas." 