#!/bin/bash
# Install pre-commit hook que bloquea commits que introducen nueva deuda en build.
# Idempotente: corre las veces que quieras, mismo resultado.
#
# Uso: bash bin/install-hooks.sh
# (Cualquier dev que clone el repo debe correrlo una vez.)

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "❌ No es un repo git. Aborta."
  exit 1
fi

HOOK_PATH="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$HOOK_PATH" << 'EOF'
#!/bin/bash
# pre-commit: corre `node build.js` y bloquea commit si introduce deuda NUEVA.
# El sistema baseline (.build-warnings-baseline.json) permite deuda conocida.
# Para aceptar deliberadamente nueva deuda: `node build.js --update-baseline`
# y commitea el baseline actualizado JUNTO con tu cambio.

REPO_ROOT="$(git rev-parse --show-toplevel)"

# Solo corre si hay cambios staged en archivos relevantes
STAGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(html|css|js)$' || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

cd "$REPO_ROOT"
if [ ! -f "build.js" ]; then
  exit 0
fi

echo "[pre-commit] Corriendo node build.js…"
if ! node build.js > /tmp/build-precommit.log 2>&1; then
  echo ""
  echo "🚨 COMMIT BLOQUEADO: build.js detectó deuda nueva."
  echo "───────────────────────────────────────────────────────────"
  tail -30 /tmp/build-precommit.log
  echo "───────────────────────────────────────────────────────────"
  echo ""
  echo "Opciones:"
  echo "  1. Arregla la deuda (recomendado)."
  echo "  2. Acepta deliberadamente con \`node build.js --update-baseline\`"
  echo "     y agrega .build-warnings-baseline.json al commit."
  echo "  3. Bypass de emergencia: \`git commit --no-verify\` (NO recomendado)."
  echo ""
  exit 1
fi

echo "[pre-commit] ✓ build limpio. Commit autorizado."
exit 0
EOF

chmod +x "$HOOK_PATH"
echo "✓ Pre-commit hook instalado en $HOOK_PATH"
echo ""
echo "Test: prueba commitear cualquier archivo con clase CSS rota — debe bloquear."
echo "Bypass de emergencia: git commit --no-verify (NO recomendado, deja deuda entrar al repo)."
