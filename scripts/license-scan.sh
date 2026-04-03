#!/bin/bash
# OpenClaw License Scanner
# Automated license compliance check for dependencies

set -e

echo "🔍 OpenClaw License Compliance Scan"
echo "=" | head -c 60
echo ""

# Check if npm-license-checker is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm not found. Please install Node.js first."
    exit 1
fi

echo "📦 Scanning dependencies..."
echo ""

# Run license checker
npx license-checker --production --onlyAllow "MIT;ISC;BSD-2-Clause;BSD-3-Clause;Apache-2.0;Unlicense;WTFPL" --json | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    
    # Count licenses
    license_counts = {}
    for pkg, info in data.items():
        lic = info.get('licenses', 'Unknown')
        if isinstance(lic, list):
            lic = lic[0] if lic else 'Unknown'
        license_counts[lic] = license_counts.get(lic, 0) + 1
    
    # Print summary
    print('License Summary:')
    print('-' * 40)
    for lic, count in sorted(license_counts.items(), key=lambda x: -x[1]):
        status = '✅' if lic in ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0'] else '⚠️'
        print(f'{status} {lic}: {count} packages')
    
    # Check for problematic licenses
    problematic = ['GPL', 'LGPL', 'AGPL', 'CC-BY-SA', 'CC-BY-NC']
    found_problematic = []
    
    for pkg, info in data.items():
        lic = info.get('licenses', '')
        if isinstance(lic, list):
            lic = lic[0] if lic else ''
        
        for prob in problematic:
            if prob.lower() in lic.lower():
                found_problematic.append(f'{pkg}: {lic}')
    
    print('\n' + '-' * 40)
    if found_problematic:
        print('⚠️  Potentially problematic licenses found:')
        for item in found_problematic:
            print(f'   - {item}')
        print('\nRecommendation: Review these packages for compatibility.')
    else:
        print('✅ No problematic licenses detected!')
    
    # Check main license
    if data.get('openclaw', {}).get('licenses') == 'MIT':
        print('\n✅ Main project uses MIT License - Compatible!')
    else:
        print(f'\n⚠️  Main project license: {data.get(\"openclaw\", {}).get(\"licenses\", \"Unknown\")}')

except Exception as e:
    print(f'Error parsing results: {e}')
    sys.exit(1)
"

echo ""
echo "✅ License scan complete!"
echo ""
echo "For detailed report, run:"
echo "  npx license-checker --production > LICENSE_REPORT.json"
