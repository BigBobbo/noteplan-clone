#!/bin/bash

# NotePlan Backend API Test Script
# This script tests all API endpoints

API_BASE="http://localhost:3001"

echo "===================================="
echo "NotePlan Backend API Test Suite"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to run a test
run_test() {
    local name=$1
    local command=$2

    echo -e "${BLUE}Testing: ${name}${NC}"
    TESTS_RUN=$((TESTS_RUN + 1))

    response=$(eval $command 2>&1)
    status=$?

    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$response" | head -n 5
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "$response"
    fi

    echo ""
}

# 1. Health Check
run_test "Health Check" \
    "curl -s ${API_BASE}/health"

# 2. Initialize Folders
run_test "Initialize Folders" \
    "curl -s -X POST ${API_BASE}/api/folders/init"

# 3. Get Folder Tree
run_test "Get Folder Tree" \
    "curl -s ${API_BASE}/api/folders"

# 4. Create a Test Note
run_test "Create Test Note" \
    "curl -s -X POST ${API_BASE}/api/files/Notes/test.txt \
     -H 'Content-Type: application/json' \
     -d '{\"content\": \"# Test Note\\n\\n* Task 1\\n* [x] Completed task\\n\\n+ 09:00-10:00 Morning meeting\\n\\n[[Related Note]]\\n\\n#tag @person\"}'"

# 5. List All Files
run_test "List All Files" \
    "curl -s ${API_BASE}/api/files"

# 6. List Files in Notes Folder
run_test "List Files in Notes Folder" \
    "curl -s '${API_BASE}/api/files?folder=Notes'"

# 7. Get File Content
run_test "Get File Content" \
    "curl -s ${API_BASE}/api/files/Notes/test.txt"

# 8. Update File
run_test "Update File" \
    "curl -s -X POST ${API_BASE}/api/files/Notes/test.txt \
     -H 'Content-Type: application/json' \
     -d '{\"content\": \"# Updated Test Note\\n\\nThis is updated content.\"}'"

# 9. Create Daily Note
run_test "Create Daily Note for Today" \
    "curl -s -X POST ${API_BASE}/api/calendar/daily"

# 10. Get Daily Note by Date
run_test "Get Daily Note by Date (20251007)" \
    "curl -s ${API_BASE}/api/calendar/daily/20251007"

# 11. Create Note in Subfolder
run_test "Create Note in Subfolder" \
    "curl -s -X POST ${API_BASE}/api/files/Notes/Projects/project1.txt \
     -H 'Content-Type: application/json' \
     -d '{\"content\": \"# Project 1\\n\\nProject notes here.\"}'"

# 12. Search Files
run_test "Search Files" \
    "curl -s '${API_BASE}/api/files?search=test'"

# 13. Delete Test File
run_test "Delete Test File" \
    "curl -s -X DELETE ${API_BASE}/api/files/Notes/Projects/project1.txt"

# 14. Test Invalid Path (Security)
echo -e "${BLUE}Testing: Path Traversal Prevention${NC}"
TESTS_RUN=$((TESTS_RUN + 1))
response=$(curl -s ${API_BASE}/api/files/../etc/passwd 2>&1)
if echo "$response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASSED - Security check working${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Security vulnerability!${NC}"
fi
echo ""

# 15. Test Invalid Extension
echo -e "${BLUE}Testing: File Extension Validation${NC}"
TESTS_RUN=$((TESTS_RUN + 1))
response=$(curl -s -X POST ${API_BASE}/api/files/Notes/test.exe \
    -H 'Content-Type: application/json' \
    -d '{"content": "test"}' 2>&1)
if echo "$response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASSED - Extension validation working${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Invalid extension accepted!${NC}"
fi
echo ""

# Summary
echo "===================================="
echo "Test Summary"
echo "===================================="
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $((TESTS_RUN - TESTS_PASSED))"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
