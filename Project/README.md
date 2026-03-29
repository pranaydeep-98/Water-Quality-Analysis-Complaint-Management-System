# AquaWatch Backend

Water Quality Complaint Management System - Core API

## Startup & Port Management

The application is configured with a robust startup mechanism. By default, it uses port **8081**.

### Automatic Port Fallback
If port 8081 is already occupied by another process, the system will automatically search for the next available port (up to 8091). You can check the current port in the console logs:
`>>> App starting on port: 8082`

### Environment Configuration
You can explicitly override the port by setting the `SERVER_PORT` environment variable:
`SERVER_PORT=9000 mvn spring-boot:run`

---

## Developer Tool: Troubleshooting Port Conflicts

If you need to manually free a specific port (e.g., to force use of 8081), use these commands:

### Windows (PowerShell/CMD)
1.  **Find the PID** (Process ID) using the port:
    `netstat -ano | findstr :8081`
2.  **Terminate the process** (replace `<PID>` with the ID found):
    `taskkill /PID <PID> /F`

### Standard Build Commands
- **Compile and Package**: `mvn clean install`
- **Run Application**: `mvn spring-boot:run`
