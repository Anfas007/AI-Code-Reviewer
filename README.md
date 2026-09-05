# 🛡️ Syntax Sentinel — AI Code Reviewer

An AI-powered code review platform that combines Python AST-based static analysis with Large Language Model feedback to identify code quality, security, and maintainability issues.

🌐 **Live Demo:** http://3.25.86.24

---

## 📌 Overview

Syntax Sentinel is a full-stack AI code review platform designed to automate the first stage of code review.

Users can upload Python source code and receive:

- Static analysis results
- Code quality score
- Security and maintainability issues
- Code metrics
- Cyclomatic complexity analysis
- AI-generated review and recommendations
- Review history
- Review analytics

The application is containerized with Docker and deployed on AWS EC2 using Nginx as a reverse proxy.

---

## ✨ Key Features

### 🔍 Static Code Analysis

Uses Python's built-in AST module to analyze source code without executing it.

The analyzer detects:

- Dangerous `eval()` usage
- Dangerous `exec()` usage
- Bare `except` blocks
- Unnecessary `print()` statements
- Deep nesting
- High function complexity
- Imports
- Functions
- Classes
- Loops
- Conditions

### 🤖 AI-Powered Review

The static analysis results are combined with an LLM-powered review engine to generate higher-level feedback about:

- Code quality
- Maintainability
- Potential problems
- Improvement suggestions
- Overall code quality

### 📊 Code Metrics

The system calculates useful metrics including:

- Number of functions
- Number of classes
- Number of imports
- Number of loops
- Number of conditions
- Maximum nesting depth
- Function complexity
- Overall review score

### 🔐 Authentication

- User registration
- Secure password hashing
- JWT authentication
- Protected review APIs
- User-specific review history

### 🗄️ Review History

Users can:

- View previous reviews
- Open review details
- Delete reviews
- View review analytics

### 🐳 Production Deployment

The application runs using Docker Compose with:

- React frontend
- Nginx
- FastAPI backend
- PostgreSQL database

---

## 🏗️ Architecture

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │   AWS EC2     │
                    │               │
                    │   Port 80     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     Nginx     │
                    │ React + Proxy │
                    └───────┬───────┘
                            │
                       /api requests
                            │
                            ▼
                    ┌───────────────┐
                    │    FastAPI    │
                    │    Backend    │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │   PostgreSQL    │   │    Gemini AI    │
        │    Database     │   │   Review Engine  │
        └─────────────────┘   └─────────────────┘



## Code Review Flow


Python File
     │
     ▼
FastAPI Upload Endpoint
     │
     ▼
Python AST Parser
     │
     ▼
Static Rules + Metrics
     │
     ├── Security Issues
     ├── Quality Issues
     ├── Complexity
     └── Code Metrics
     │
     ▼
AI Review Engine
     │
     ▼
Combined Review Result
     │
     ▼
PostgreSQL
     │
     ▼
React Dashboard


