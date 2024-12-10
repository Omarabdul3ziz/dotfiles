#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <AppName>"
  exit 1
fi

APP_NAME="$1"

# Check if the window is currently active
ACTIVE_WINDOW=$(xdotool getwindowfocus getwindowname)

if [ "$ACTIVE_WINDOW" == "$APP_NAME" ]; then
  # Minimize the window if it's focused
  xdotool search --name "$APP_NAME" windowminimize
else
  # Bring the window to the front
  xdotool search --name "$APP_NAME" windowactivate
fi
