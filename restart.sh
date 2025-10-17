#!/bin/bash

# Kill existing npm processes
pkill -f "npm start" 2>/dev/null

# Wait a moment
sleep 1

# Start the application
cd "/Users/eticajans/Desktop/Etic Ajans/Projeler/masaustu-veresiye-takip"
npm start


