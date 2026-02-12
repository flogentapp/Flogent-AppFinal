@echo off
echo Setting up fresh test tenant for wilhelmkuun1@gmail.com...
node scripts/create_new_tenant_test.js
echo.
echo Process complete. Check output above for any errors.
echo You can now log in at http://localhost:3000
pause
