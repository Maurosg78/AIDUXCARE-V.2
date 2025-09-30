#!/usr/bin/env bash

# Salir en caso de error
set -e

# --- Carga tus variables de entorno desde .env y .env.local ---
set -o allexport
source .env
[ -f .env.local ] && source .env.local
set +o allexport

# --- Supabase ---
gh secret set SUPABASE_URL           --body "\$SUPABASE_URL"
gh secret set SUPABASE_ANON_KEY      --body "\$SUPABASE_ANON_KEY"

# --- Vite / Next.js compatibility ---
gh secret set VITE_SUPABASE_URL      --body "\$VITE_SUPABASE_URL"
gh secret set VITE_SUPABASE_ANON_KEY --body "\$VITE_SUPABASE_ANON_KEY"
gh secret set NEXT_PUBLIC_SUPABASE_URL      --body "\${NEXT_PUBLIC_SUPABASE_URL:-\$VITE_SUPABASE_URL}"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "\${NEXT_PUBLIC_SUPABASE_ANON_KEY:-\$VITE_SUPABASE_ANON_KEY}"

# --- Langfuse (opcional) ---
[[ -n "\$LANGFUSE_PUBLIC_KEY"      ]] && gh secret set LANGFUSE_PUBLIC_KEY      --body "\$LANGFUSE_PUBLIC_KEY"
[[ -n "\$VITE_LANGFUSE_PUBLIC_KEY" ]] && gh secret set VITE_LANGFUSE_PUBLIC_KEY --body "\$VITE_LANGFUSE_PUBLIC_KEY"
[[ -n "\$LANGFUSE_SECRET_KEY"      ]] && gh secret set LANGFUSE_SECRET_KEY      --body "\$LANGFUSE_SECRET_KEY"
[[ -n "\$VITE_LANGFUSE_SECRET_KEY" ]] && gh secret set VITE_LANGFUSE_SECRET_KEY --body "\$VITE_LANGFUSE_SECRET_KEY"

# --- HuggingFace token (opcional) ---
[[ -n "\$HUGGINGFACE_TOKEN" ]] && gh secret set HUGGINGFACE_TOKEN --body "\$HUGGINGFACE_TOKEN"

# --- Supabase service role (opcional) ---
[[ -n "\$SUPABASE_SERVICE_ROLE" ]] && gh secret set SUPABASE_SERVICE_ROLE --body "\$SUPABASE_SERVICE_ROLE"

# --- Listado final de secrets ---
echo "Secrets configurados en este repositorio:"
gh secret list
