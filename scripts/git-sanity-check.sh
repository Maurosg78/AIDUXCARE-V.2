#!/usr/bin/env bash

set -e

echo "📂 Repo path:"
pwd
echo

echo "🌿 Git branch:"
git branch --show-current
echo

echo "📡 Remote:"
git remote -v | sed 's/(fetch)//' | sed 's/(push)//'
echo

echo "📦 Git status (resumen):"
git status -sb

