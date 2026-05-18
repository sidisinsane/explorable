# ---
# name: server
# description: runs a simple http server.
# usage: sh server.sh
# exits:
#   0: server stopped cleanly
#   2: failed to start (port in use, python not found, etc.)
# ---
python3 -m http.server 8000
