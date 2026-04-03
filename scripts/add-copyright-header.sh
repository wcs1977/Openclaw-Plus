#!/bin/bash
# OpenClaw Copyright Header Addition Script
# 为所有源文件添加统一的版权头注释

set -e

echo "📝 Adding copyright headers to source files..."
echo "=" | head -c 60
echo ""

# Copyright header template
COPYRIGHT_HEADER="/**
 * @file {filename}
 * @description {brief description}
 * @author OpenClaw Team <team@openclaw.ai>
 * @copyright Copyright (c) 2026 OpenClaw Team. All rights reserved.
 * @license MIT License - See LICENSE file for details
 */

"

# Files to skip
SKIP_PATTERNS=("node_modules" "dist" ".git" "*.test.ts" "*.spec.ts")

# Function to add copyright header to TypeScript files
add_ts_header() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check if already has copyright header
    if head -n 5 "$file" | grep -q "Copyright"; then
        echo "⏭️  Skipping $filename (already has copyright)"
        return
    fi
    
    # Create brief description from filename
    local desc=$(echo "$filename" | sed 's/_/ /g' | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    # Add header
    echo "📝 Adding header to $filename..."
    
    {
        echo "$COPYRIGHT_HEADER"
        cat "$file"
    } > "${file}.tmp"
    
    mv "${file}.tmp" "$file"
}

# Function to add copyright header to Markdown files
add_md_header() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check if already has copyright notice
    if head -n 5 "$file" | grep -qi "copyright"; then
        echo "⏭️  Skipping $filename (already has copyright)"
        return
    fi
    
    echo "📝 Adding header to $filename..."
    
    {
        echo "# OpenClaw - Personal AI Assistant Gateway"
        echo ""
        echo "**Copyright** © 2026 OpenClaw Team. All rights reserved."
        echo ""
        echo "**License**: MIT License - See [LICENSE](./LICENSE) file for details."
        echo ""
        echo "---"
        echo ""
        cat "$file"
    } > "${file}.tmp"
    
    mv "${file}.tmp" "$file"
}

# Process TypeScript files
echo -e "\n🔧 Processing TypeScript files..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    # Skip test files (they have their own copyright)
    if [[ "$file" == *".test.ts"* ]] || [[ "$file" == *".spec.ts"* ]]; then
        echo "⏭️  Skipping $file (test file)"
        continue
    fi
    
    add_ts_header "$file"
done

# Process Markdown files
echo -e "\n📝 Processing Markdown files..."
find . -name "*.md" | grep -v node_modules | while read file; do
    # Skip if in docs folder (already has copyright)
    if [[ "$file" == *"docs"* ]]; then
        echo "⏭️  Skipping $file (in docs folder)"
        continue
    fi
    
    add_md_header "$file"
done

echo -e "\n✅ Copyright headers added successfully!"
echo ""
echo "Files processed:"
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) | grep -v node_modules | grep -v dist | wc -l
echo ""
echo "Note: Test files and docs folder files were skipped."
