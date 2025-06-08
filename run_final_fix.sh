#!/bin/bash

# This script performs the final, clean push to your GitHub repository.

# --- Styles ---
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${YELLOW}--- Preparing Final Git Commit ---${NC}"

# Ensure we are in the correct root directory
cd "/Users/israelbill/Development/CoinBack" || exit

# Remove old git history to ensure a clean state
rm -rf .git
echo "✅ Old .git directory removed."

# Initialize a new repository
git init -b main
echo "✅ New Git repository initialized."

# Add the correct remote repository
git remote add origin https://github.com/Billoxinogen18/coinback-rpc-mvp.git
echo "✅ Remote repository configured."

# Add all the corrected files to be committed
git add .
echo "✅ All project files staged."

# Create the definitive commit
git commit -m "feat: FINAL - Full frontend production rebuild"
echo "✅ Definitive commit created."

# --- Final Push ---
echo -e "\n${GREEN}--- Pushing to GitHub & Triggering Vercel Deployment ---${NC}"
git push -u origin main --force
echo -e "\n${GREEN}============================================="
echo -e "   🚀 PUSH COMPLETE! DEPLOYMENT INITIATED"
echo -e "=============================================${NC}"
echo "Your production-ready frontend has been pushed to GitHub."
echo "Vercel will now deploy this version."