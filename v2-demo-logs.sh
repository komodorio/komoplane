#!/bin/bash

echo "🎯 Komoplane v2 API Compatibility Demo"
echo "======================================"
echo 
echo "This shows what you can expect to see when running Komoplane with the new v2 compatibility:"
echo
echo "📜 Sample Log Output with v2 API Available:"
echo "-------------------------------------------"
echo "INFO[0000] Found Crossplane apiextensions group"
echo "INFO[0000] Discovered XRD API version: v1"
echo "INFO[0000] Discovered XRD API version: v2"
echo "INFO[0000] Using preferred API version: v2 (avoids deprecation warnings)"
echo "DEBU[0000] Attempting to list XRDs using v2 API"
echo "INFO[0000] Successfully listed 3 XRDs using v2 API"
echo
echo "📜 Sample Log Output with v2 API NOT Available (fallback):"
echo "----------------------------------------------------------"
echo "INFO[0000] Found Crossplane apiextensions group"
echo "INFO[0000] Discovered XRD API version: v1"
echo "INFO[0000] Using API version: v1 (v2 not available)"
echo "DEBU[0000] Listing XRDs using v1 API"
echo "INFO[0000] Successfully listed 3 XRDs using v1 API"
echo
echo "🔄 When v2 API Call Fails (graceful fallback):"
echo "----------------------------------------------"
echo "WARN[0000] Failed to list XRDs with v2 API: not found, falling back to v1"
echo "DEBU[0000] Listing XRDs using v1 API"
echo "INFO[0000] Successfully listed 3 XRDs using v1 API"
echo
echo "🏷️  Resource Annotations Added:"
echo "-------------------------------"
echo "komoplane.io/retrieved-api-version: apiextensions.crossplane.io/v2"
echo "komoplane.io/original-api-version: apiextensions.crossplane.io/v2"
echo "komoplane.io/v2-scope: Namespaced"
echo
echo "✨ Benefits:"
echo "• No more deprecation warnings when v2 is available"
echo "• Smart fallback ensures compatibility with older clusters"
echo "• Enhanced observability through detailed logging"
echo "• Future-proof architecture for Crossplane evolution"
echo
echo "🚀 Ready to test with your Crossplane cluster!"
