#!/bin/bash

# Setup Script for value_analytics Collection
# This script deploys Firestore indexes for value_analytics collection

set -e

echo "🚀 Setting up value_analytics collection indexes..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI detected and authenticated"
echo ""

# Check/Set project
echo "📁 Checking Firebase project..."
if [ -f .firebaserc ]; then
    CURRENT_PROJECT=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
    if [ -n "$CURRENT_PROJECT" ]; then
        echo "   Current project: $CURRENT_PROJECT"
    fi
else
    echo "⚠️  No .firebaserc found. Setting project to aiduxcare-v2-uat-dev..."
    firebase use aiduxcare-v2-uat-dev --add || firebase use aiduxcare-v2-uat-dev
fi

echo ""

# Deploy indexes and rules
echo "📊 Deploying Firestore indexes and rules for value_analytics..."
echo "   This will create:"
echo "   - 3 indexes for the value_analytics collection"
echo "   - Security rules for value_analytics collection"
echo ""

# Deploy indexes
echo "📋 Deploying indexes..."
firebase deploy --only firestore:indexes

echo ""

# Deploy rules
echo "🔒 Deploying security rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Firestore indexes and rules deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify indexes in Firebase Console → Firestore → Indexes"
echo "2. Verify rules in Firebase Console → Firestore → Rules"
echo "3. Collection 'value_analytics' will be created automatically on first write"
echo "4. Test with: AnalyticsService.trackValueMetrics(testMetrics)"
echo ""
echo "⏱️  Note: Indexes may take 1-5 minutes to build. Check status in Firebase Console."
echo ""


