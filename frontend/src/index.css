@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Syne:wght@400..800&display=swap');

:root {
  --bg-color: #0A1628;
  --card-bg: rgba(13, 34, 64, 0.88);
  --primary: #1BAFBF;
  --high-sev: #E8433A;
  --medium-sev: #F6921E;
  --low-sev: #2DDBB4;
  --warning: #F0C040;
  --text-muted: #7EA8B8;
  --text-primary: #FFFFFF;
  --glass-border: rgba(27, 175, 191, 0.22);
  --sidebar-bg: #070F1C;
  --accent-glow: rgba(27, 175, 191, 0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6, .syne {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Glassmorphism utility */
.glass {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px var(--accent-glow);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-color);
}

::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-glow);
}

/* Badges */
.badge {
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-high {
  background: rgba(232, 67, 58, 0.15);
  color: var(--high-sev);
}
.badge-high::before { background: var(--high-sev); }

.badge-medium {
  background: rgba(246, 146, 30, 0.15);
  color: var(--medium-sev);
}
.badge-medium::before { background: var(--medium-sev); }

.badge-low {
  background: rgba(45, 219, 180, 0.15);
  color: var(--low-sev);
}
.badge-low::before { background: var(--low-sev); }

.badge-warning {
  background: rgba(240, 192, 64, 0.15);
  color: var(--warning);
}
.badge-warning::before { background: var(--warning); }

/* Buttons */
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-outline:hover {
  background: rgba(27, 175, 191, 0.1);
}
