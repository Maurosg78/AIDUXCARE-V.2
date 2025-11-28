#!/bin/bash
# Count test files efficiently with timeout
timeout 5 find src -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) -maxdepth 5 2>/dev/null | wc -l
