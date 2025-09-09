#!/bin/bash
# Quick validation script for AiduxCare

echo "🏥 AiduxCare Setup Validation"
echo "=============================="

# Check Node version
echo -e "\n📦 Node Version:"
node --version

# Check npm packages
echo -e "\n📚 Key Dependencies:"
npm ls ajv 2>/dev/null | head -1
npm ls @commitlint/cli 2>/dev/null | head -1
npm ls firebase 2>/dev/null | head -1
npm ls openai 2>/dev/null | head -1

# Run tests
echo -e "\n🧪 Running Tests:"
npm run test:ci

# Check build
echo -e "\n🔨 Building Project:"
npm run build

# Check prompt validation
echo -e "\n🧠 Validating Prompts:"
npm run validate:prompts

echo -e "\n✅ Validation Complete!"
