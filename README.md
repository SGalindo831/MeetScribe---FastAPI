# MeetScribe - AI Meeting Transcription & Summarization

MeetScribe is a full-stack web application that automatically transcribes and summarizes meeting recordings using local AI models. Upload audio files or record directly in your browser to get detailed meeting notes, key points, action items, and decisions—perfect for anyone who missed a meeting or needs quick reference.

## Features

- **Live Recording** - Record meetings directly in your browser via WebSocket connection
- **File Upload** - Support for multiple audio formats (MP3, WAV, MP4, M4A, WebM, OGG)
- **AI-Powered Transcription** - Uses OpenAI's Whisper model for accurate speech-to-text
- **Intelligent Summarization** - Leverages Llama3 via Ollama to generate comprehensive meeting summaries
- **Real-Time Processing** - Background processing with live status updates
- **Meeting Management** - View, search, and delete past meetings with persistent storage

## Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- SQLAlchemy - ORM for database management
- SQLite - Lightweight database for meeting storage
- Whisper - OpenAI's speech recognition model
- Ollama + Llama3 - Local LLM for summarization

**Frontend:**
- Vanilla JavaScript - No framework dependencies
- WebSocket API - Real-time communication
- Fetch API - RESTful endpoint integration

## What You Get

Each processed meeting includes:
- **Full Transcript** - Complete text of the meeting
- **Overview** - 3-5 sentence summary of the meeting's purpose and outcomes
- **Key Points** - Detailed discussion points with specific context
- **Action Items** - Who needs to do what, by when, and why
- **Decisions** - What was decided, by whom, and the reasoning

## Privacy First

All processing happens locally on your machine - no cloud services, no data sharing, complete privacy.
