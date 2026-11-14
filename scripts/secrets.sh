#!/usr/bin/env bash
# Writes secrets.json for `wrangler deploy --secrets-file`.
# SESSION_SECRET and ENCRYPTION_KEY are generated once and then left alone:
# Worker secrets survive deploys, so later runs skip keys that already exist.
# A repository secret with the same name overrides the stored value.
set -euo pipefail

# Fail closed: regenerating ENCRYPTION_KEY by mistake makes every saved
# notification channel unreadable, so only a missing Worker counts as "no secrets".
if ! list=$(bunx wrangler secret list --format json 2>secret-list.err); then
  if grep -qiE "10007|does not exist|not found" secret-list.err; then
    list="[]"
  else
    cat secret-list.err >&2
    echo "::error::Could not read existing Worker secrets; refusing to generate new keys" >&2
    exit 1
  fi
fi
rm -f secret-list.err
existing=$(jq -r '.[].name' <<<"$list" | tr -d '\r')

secrets=$(jq -n --arg v "$SETUP_SECRET" '{SETUP_SECRET: $v}')
for key in SESSION_SECRET ENCRYPTION_KEY; do
  value="${!key:-}"
  if [ -z "$value" ] && ! grep -qx "$key" <<<"$existing"; then
    value=$(openssl rand -base64 32)
    echo "Generated $key"
  fi
  if [ -n "$value" ]; then
    secrets=$(jq --arg k "$key" --arg v "$value" '. + {($k): $v}' <<<"$secrets")
  fi
done

umask 077
echo "$secrets" > secrets.json
