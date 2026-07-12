#!/usr/bin/env bash
# TR-014 API test runner — outputs JSON summary
set -euo pipefail
API="${API_URL:-http://localhost:8000}"
RESULTS=()

pass() { RESULTS+=("{\"test\":\"$1\",\"result\":\"PASS\",\"detail\":\"$2\"}"); echo "PASS: $1 — $2"; }
fail() { RESULTS+=("{\"test\":\"$1\",\"result\":\"FAIL\",\"detail\":\"$2\"}"); echo "FAIL: $1 — $2"; }

# Login
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$API/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@pulsefolio.app","password":"demo12345"}')
LOGIN_BODY=$(echo "$LOGIN" | sed '$d')
LOGIN_CODE=$(echo "$LOGIN" | tail -1)
TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

if [[ "$LOGIN_CODE" == "200" && -n "$TOKEN" ]]; then
  pass "auth_login" "HTTP 200, token len ${#TOKEN}"
else
  fail "auth_login" "HTTP $LOGIN_CODE"
fi

# Dashboard with Bearer
DASH=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/dashboard")
DASH_BODY=$(echo "$DASH" | sed '$d')
DASH_CODE=$(echo "$DASH" | tail -1)
TV=$(echo "$DASH_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('portfolio',{}).get('totalValue',0))" 2>/dev/null || echo "0")

if [[ "$DASH_CODE" == "200" && $(python3 -c "print(1 if 180000 < float('$TV') < 200000 else 0)") == "1" ]]; then
  pass "me_dashboard" "HTTP 200, totalValue=\$$TV"
else
  fail "me_dashboard" "HTTP $DASH_CODE, totalValue=$TV"
fi

# Generate
GEN=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/recommendations/generate")
GEN_BODY=$(echo "$GEN" | sed '$d')
GEN_CODE=$(echo "$GEN" | tail -1)
PROVIDER=$(echo "$GEN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('provider',''))" 2>/dev/null || echo "")
REC_ID=$(echo "$GEN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('recommendationId',''))" 2>/dev/null || echo "")

if [[ "$GEN_CODE" == "200" && ("$PROVIDER" == "hybrid" || "$PROVIDER" == "ollama" || "$PROVIDER" == "rules") ]]; then
  pass "generate" "HTTP 200, provider=$PROVIDER"
else
  fail "generate" "HTTP $GEN_CODE, provider=$PROVIDER"
fi

# Approve tradeable rec
if [[ -n "$REC_ID" ]]; then
  # Refresh dashboard for active rec
  DASH2=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/dashboard")
  REC_ID=$(echo "$DASH2" | python3 -c "import sys,json; r=json.load(sys.stdin).get('recommendation',{}); print(r.get('id','') if r.get('action')!='HOLD' else '')" 2>/dev/null || echo "")
fi

if [[ -n "$REC_ID" ]]; then
  APR=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/recommendations/$REC_ID/approve")
  APR_CODE=$(echo "$APR" | tail -1)
  if [[ "$APR_CODE" == "200" ]]; then
    pass "approve_rec" "HTTP 200, rec=$REC_ID"
  else
    fail "approve_rec" "HTTP $APR_CODE body=$(echo "$APR" | sed '$d' | head -c 200)"
  fi
else
  # Generate fresh and try approve
  curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/recommendations/generate" > /dev/null
  DASH3=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/dashboard")
  REC_ID=$(echo "$DASH3" | python3 -c "import sys,json; r=json.load(sys.stdin).get('recommendation',{}); print(r.get('id','') if r.get('action')!='HOLD' else '')" 2>/dev/null || echo "")
  if [[ -n "$REC_ID" ]]; then
    APR=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/recommendations/$REC_ID/approve")
    APR_CODE=$(echo "$APR" | tail -1)
    if [[ "$APR_CODE" == "200" ]]; then
      pass "approve_rec" "HTTP 200 after regen, rec=$REC_ID"
    else
      fail "approve_rec" "HTTP $APR_CODE (HOLD or limit)"
    fi
  else
    fail "approve_rec" "No tradeable recommendation available"
  fi
fi

# Rate limit: 11 generates in 1 min
RL_FAIL=0
for i in $(seq 1 11); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" "$API/api/v1/me/recommendations/generate")
  if [[ $i -le 10 && "$CODE" != "200" && "$CODE" != "429" ]]; then
    RL_FAIL=1
  fi
  if [[ $i -eq 11 ]]; then
    if [[ "$CODE" == "429" ]]; then
      pass "rate_limit" "11th request HTTP 429"
    else
      fail "rate_limit" "11th request HTTP $CODE (expected 429)"
    fi
  fi
done

# Public routes without auth
for ep in "/api/v1/public/dashboard" "/api/v1/public/portfolio" "/api/v1/public/trades" "/api/v1/public/insights" "/api/v1/public/settings"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API$ep")
  if [[ "$CODE" == "200" ]]; then
    pass "public_${ep##*/}" "HTTP 200 no auth"
  else
    fail "public_${ep##*/}" "HTTP $CODE"
  fi
done

echo "---"
echo "[$(IFS=,; echo "${RESULTS[*]}")]"
