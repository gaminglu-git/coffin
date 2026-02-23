#!/bin/bash
# Auf dem Docker-Host ausführen (z.B. per SSH: root@192.168.178.174)
# Behebt: "lookup registry-1.docker.io ... i/o timeout"
#
# Nutzung: sudo bash fix-docker-dns.sh

set -e

DAEMON_JSON="/etc/docker/daemon.json"
DNS_ENTRY='"dns": ["8.8.8.8", "1.1.1.1"]'

echo "=== Docker DNS Fix ==="

# Prüfen ob daemon.json existiert und DNS schon gesetzt ist
if [ -f "$DAEMON_JSON" ]; then
  if grep -q '"dns"' "$DAEMON_JSON"; then
    echo "DNS ist bereits in $DAEMON_JSON konfiguriert."
    cat "$DAEMON_JSON"
    exit 0
  fi
  # Bestehende Config erweitern (vereinfacht – bei komplexer JSON-Struktur manuell prüfen)
  echo "Erweitere bestehende daemon.json..."
  # Backup
  cp "$DAEMON_JSON" "${DAEMON_JSON}.bak"
  # JSON mit jq erweitern falls vorhanden
  if command -v jq &>/dev/null; then
    jq '. + {"dns": ["8.8.8.8", "1.1.1.1"]}' "$DAEMON_JSON" > "${DAEMON_JSON}.tmp"
    mv "${DAEMON_JSON}.tmp" "$DAEMON_JSON"
  elif command -v python3 &>/dev/null; then
    python3 -c "
import json
with open('$DAEMON_JSON') as f: d=json.load(f)
d['dns']=['8.8.8.8','1.1.1.1']
with open('$DAEMON_JSON','w') as f: json.dump(d,f,indent=2)
"
  else
    echo "jq oder python3 nicht installiert. Bitte manuell bearbeiten:"
    echo "  $DAEMON_JSON"
    echo "  Füge hinzu: $DNS_ENTRY"
    exit 1
  fi
else
  echo "Erstelle $DAEMON_JSON..."
  echo "{ $DNS_ENTRY }" > "$DAEMON_JSON"
fi

echo ""
echo "Aktuelle Konfiguration:"
cat "$DAEMON_JSON"
echo ""
echo "Starte Docker neu..."
systemctl restart docker
echo "Fertig. Teste mit: docker pull node:20"
