# ALMOOL: AI Tutoring System for Adaptive Learning and Motivation of Online Learning

ALMOOL is a web-based AI tutoring platform designed for mathematics education. Students study problems on the **Digital Learning Platform (ALMOOL_Study)** and can request AI-powered tutoring through the **Chat System (ALMOOL_Chat)** with a single click.

## Architecture

| Component | Stack | Port | Role |
|-----------|-------|------|------|
| **ALMOOL_Study** | PHP 8.x + SQLite | 8080 | Digital Learning Platform — serves exam problems from LaTeX sources |
| **ALMOOL_Chat** | Python/Flask + SQLite | 5001 | AI Tutoring Chat — provides AI-assisted problem solving via OpenAI & Google Generative AI |

### How It Works

1. Students access exam problems on ALMOOL_Study
2. Clicking the **chat bubble** on any problem opens ALMOOL_Chat in a new tab
3. The problem context (examID, bookIndex, problemID) is passed via URL parameters
4. ALMOOL_Chat fetches the full problem data from ALMOOL_Study's API
5. Students can then ask the AI tutor questions about the problem

## Quick Start

### Prerequisites

- **PHP 8.0+** with SQLite3 extension
- **Python 3.x** with venv support

### Setup (one-time)

```bash
git clone https://github.com/JiEunJanetSong/Source-Code-and-Interaction-Logs-for-ALMOOL-AI-Tutoring-System.git
cd Source-Code-and-Interaction-Logs-for-ALMOOL-AI-Tutoring-System
./setup.sh
```

Then edit `ALMOOL_Chat/.env` with your API keys:

```
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
ALMOOL_STUDY_URL=http://localhost:8080
```

### Run

```bash
./start.sh
```

This starts both servers. Access the Digital Learning Platform by visiting one of the sample exam URLs below.

Press `Ctrl+C` to stop both servers.

### Try It Out

Since authentication is not fully implemented in this release, you can directly access the Digital Learning Platform using the following exam IDs. Each exam ID corresponds to a participant's personalized problem set used in the study:

| Exam ID | Description | URL |
|---------|-------------|-----|
| `AlMool-EOS-P01` | Participant P01's problem set | http://localhost:8080/DSAT_test.php?examID=AlMool-EOS-P01 |
| `AlMool-EOS-P05` | Participant P05's problem set | http://localhost:8080/DSAT_test.php?examID=AlMool-EOS-P05 |
| `AlMool-EOS-P09` | Participant P09's problem set | http://localhost:8080/DSAT_test.php?examID=AlMool-EOS-P09 |
| `AlMool-EOS-GFMaP` | Group study problem set | http://localhost:8080/DSAT_test.php?examID=AlMool-EOS-GFMaP |
| `AlMool-EOS-ResearchTeam` | Demo problem set | http://localhost:8080/DSAT_test.php?examID=AlMool-EOS-ResearchTeam |

All available exam IDs can be found in `ALMOOL_Study/examFileList.json`.

## Interaction Logs

`chat_logs_anonymized.csv` contains anonymized interaction logs between 10 participants (P01–P10) and the AI tutor. All participant identifiers have been anonymized for privacy. See the accompanying paper for details on the study design and data collection process.

## Project Structure

```
├── setup.sh                  # One-time setup script
├── start.sh                  # Start both servers
├── chat_logs_anonymized.csv  # Anonymized interaction logs
├── ALMOOL_Study/             # Digital Learning Platform (PHP)
│   ├── start.sh              # Start Study server only
│   ├── router.php            # PHP built-in server router
│   ├── init_db.php           # Database initialization
│   ├── DSAT_test.php         # Main exam interface
│   ├── DSAT_parseTex.php     # LaTeX problem parser
│   ├── DSAT_getProblemData.php  # Problem data API
│   ├── examFileList.json     # Exam ID registry
│   ├── DB/                   # LaTeX exam files
│   ├── js/                   # Client-side JavaScript
│   └── css/                  # Stylesheets
├── ALMOOL_Chat/              # AI Tutoring Chat (Flask)
│   ├── start.sh              # Start Chat server only
│   ├── .env.example          # Environment variable template
│   ├── init_db.py            # Database initialization
│   ├── run.py                # Flask application entry point
│   ├── requirements.txt      # Python dependencies
│   ├── config.json           # Server configuration
│   ├── server/               # Backend (Flask routes, AI integration)
│   └── client/               # Frontend (HTML, CSS, JS)
```

## License

This project is for academic research purposes.
