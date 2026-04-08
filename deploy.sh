#!/bin/bash
VAULT="/Users/local_disk/Desktop/Chronicle/CORE Obsidian Vault Testing/.obsidian/plugins/chronicle"
cp main.js "$VAULT/main.js"
cp manifest.json "$VAULT/manifest.json"
cp styles/main.css "$VAULT/styles.css"
echo "Deployed to Obsidian"
