# Pinpoint

### Document Pinpoint — Runbook Retrieval Assistant for NOC Engineers

Pinpoint is a full-stack **RAG (Retrieval-Augmented Generation) application** designed to help NOC engineers quickly find the exact troubleshooting step they need from network runbooks, configuration guides, and operational documentation.

Instead of treating a document as a generic block of text, Pinpoint models the troubleshooting procedure as:

**Document → Version → Section → Step**

This allows the system to return a specific documented step together with its surrounding procedure context and source information.

---

## Problem

Network operations teams work with large collections of:

* Network troubleshooting runbooks
* Vendor configuration guides
* BGP / OSPF / MPLS / ISIS / BFD documentation
* Operational procedures
* Troubleshooting manuals

During an incident, engineers often need an answer to a very specific question:

> "BGP neighbor is stuck in Active state. What should I check next?"

Searching through a long PDF manually can be slow, especially during an outage.

Pinpoint aims to reduce that time by retrieving the most relevant documented troubleshooting step and showing exactly where it came from.

---

## What Pinpoint Does

A typical request flows through the system like this:

```text
Engineer Question
       ↓
Generate Query Embedding
       ↓
Semantic Vector Search
       ↓
Retrieve Candidate Steps
       ↓
Confidence Threshold
       ↓
Select Relevant Procedure
       ↓
Retrieve Previous / Current / Next Step
       ↓
Grounded LLM Generation
       ↓
Answer + Source Traceability
```

The system does **not** simply ask an LLM to answer a networking question.

The retrieval system first finds relevant documentation. The LLM is then used to generate a response from the retrieved evidence.

---

## Key Features

### Semantic Runbook Retrieval

Questions are converted into embeddings and searched against stored troubleshooting steps using vector similarity.

### Step-Level Retrieval

Instead of retrieving arbitrary document chunks, Pinpoint works with structured procedural steps:

```text
Document
   └── Version
        └── Section
             ├── Step 1
             ├── Step 2
             ├── Step 3
             └── Step 4
```

### Confidence-Based Retrieval

Pinpoint uses a minimum retrieval score to avoid returning weak matches.

Current threshold:

```text
RETRIEVAL_MIN_SCORE=0.70
```

If no candidate reaches the required confidence:

```text
NO_CONFIDENT_MATCH
```

is returned instead of generating an unsupported answer.

### Procedure Context

When a step is selected, Pinpoint can display:

* Previous step
* Current step
* Next step

This helps engineers understand where the selected action fits into the troubleshooting procedure.

### Source Traceability

Every generated answer can be traced back to:

```text
Document
Version
Vendor
System
Section
Step
```

### Query History

Previous investigations are persisted and can be reopened without running the retrieval pipeline again.

### Admin Dashboard

The administration page provides basic operational metrics including:

* Queries today
* Low-confidence queries
* Documents indexed
* Average retrieval relevance
* Service status
* Retrieval engine status
* Vector index status
* AI generation status
* Document ingestion status

### Health Monitoring

The backend exposes a health endpoint for checking application and dependency status.

### Graceful Failure

The application distinguishes between:

```text
Successful retrieval
No confident match
AI/provider failure
```

For example, if an AI provider is unavailable, Pinpoint does not silently present the request as a successful retrieval.

---

# Architecture

```text
                    ┌──────────────────────┐
                    │     NOC Engineer     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Next.js Client   │
                    │                      │
                    │  Search              │
                    │  Results             │
                    │  History             │
                    │  Admin               │
                    └──────────┬───────────┘
                               │
                         REST / JSON
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Fastify API       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Query Service    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌────────────────┐           ┌──────────────────┐
       │ Gemini         │           │ PostgreSQL       │
       │ Embeddings     │           │ + pgvector       │
       └────────────────┘           └────────┬─────────┘
                                              │
                                              ▼
                                     Vector Similarity
                                          Search
                                              │
                                              ▼
                                     Candidate Steps
                                              │
                                   ┌──────────┴──────────┐
                                   │                     │
                              High score             Low score
                                   │                     │
                                   ▼                     ▼
                            Grounded LLM          NO_CONFIDENT_MATCH
                              Generation
                                   │
                                   ▼
                              Final Answer
                                   │
                                   ▼
                         Source + Procedure Context
```

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* CSS
* Next.js App Router

The UI intentionally avoids Tailwind CSS and uses regular CSS for a simple enterprise/SaaS-style interface.

## Backend

* Node.js
* TypeScript
* Fastify
* REST API

## Database

* PostgreSQL
* pgvector
* Drizzle ORM

PostgreSQL stores both application data and vector embeddings.

## AI

### Embeddings

```text
Gemini
gemini-embedding-001
```

Used to convert user queries and searchable document steps into vector representations.

### Generation

```text
Groq
openai/gpt-oss-20b
```

Used to generate a readable response from retrieved documentation.

---

# Project Structure

```text
Pinpoint/
│
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── history/
│   │   │   ├── query/
│   │   │   ├── results/
│   │   │   ├── sidebar/
│   │   │   └── ...
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts
│   │   │
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── .env.local
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── embeddings/
│   │   │   └── generation/
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── ...
│   │   │
│   │   ├── modules/
│   │   │   ├── query/
│   │   │   ├── documents/
│   │   │   ├── feedback/
│   │   │   └── admin/
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# API

Base URL during local development:

```text
http://localhost:4000/v1
```

## Query

```http
POST /v1/query
```

Example:

```json
{
  "query": "Verify the configured peer address."
}
```

Possible retrieval states include:

```text
GENERATED
NO_CONFIDENT_MATCH
GENERATION_FAILED
```

---

## Query History

### List history

```http
GET /v1/query/history
```

### Get a specific history item

```http
GET /v1/query/history/:id
```

Previously stored results can be reopened without executing a new retrieval request.

---

## Documents

```http
GET /v1/documents
```

```http
POST /v1/documents
```

These endpoints support the document management/ingestion workflow.

---

## Feedback

```http
POST /v1/feedback
```

Used to record feedback against a retrieved answer.

---

## Health

```http
GET /v1/health
```

Example response:

```json
{
  "status": "ok",
  "database": "connected",
  "embedding": "configured",
  "llm": "configured"
}
```

---

# Example Retrieval

Suppose the engineer asks:

```text
Verify the configured peer address.
```

Pinpoint performs:

```text
1. Receive query
       ↓
2. Generate embedding
       ↓
3. Search step embeddings
       ↓
4. Rank candidates
       ↓
5. Check confidence threshold
       ↓
6. Select Step 2
       ↓
7. Retrieve surrounding procedure context
       ↓
8. Generate grounded response
       ↓
9. Return source metadata
```

Example result:

```text
Recommended step

Verify the configured peer address.
```

Procedure context:

```text
Previous · Step 1
Review the BGP neighbor state and session logs.

Current · Step 2
Verify the configured peer address.

Next · Step 3
Check network connectivity between the peers.
```

Source:

```text
Document:
Pinpoint Development BGP Guide

Version:
dev-1

Section:
Neighbor Investigation

Step:
2
```

---

# No Confident Match

If a query doesn't meet the retrieval threshold, Pinpoint does not generate an unsupported answer.

For example:

```text
BGP neighbor is stuck in Active state.
What should I check next?
```

may produce candidates such as:

```text
0.6804  Review the BGP neighbor state and session logs.
0.6783  Verify the configured peer address.
0.6732  Check network connectivity between the peers.
```

With:

```text
RETRIEVAL_MIN_SCORE=0.70
```

the system returns:

```text
NO_CONFIDENT_MATCH
```

The UI shows the closest matches and asks the engineer to provide more specific information.

This behavior is intentional.

---

# Environment Variables

## Client

Create:

```text
client/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
```

## Server

Create:

```text
server/.env
```

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/pinpoint

GEMINI_API_KEY=your_gemini_api_key

GROQ_API_KEY=your_groq_api_key

RETRIEVAL_MIN_SCORE=0.70

PORT=4000
```

Never commit real API keys or database credentials.

Use `.env.example` for configuration documentation.

---

# Local Development

## Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL
* pgvector extension
* Gemini API key
* Groq API key

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd Pinpoint
```

---

## 2. Install frontend dependencies

```bash
cd client
npm install
```

---

## 3. Install backend dependencies

```bash
cd ../server
npm install
```

---

## 4. Configure environment variables

Create the required `.env` / `.env.local` files using the provided examples.

---

## 5. Start PostgreSQL

Make sure PostgreSQL is running and the configured database exists.

The database must have pgvector enabled.

---

## 6. Start the backend

From:

```text
server/
```

run the project's development command:

```bash
npm run dev
```

Backend:

```text
http://localhost:4000
```

---

## 7. Start the frontend

From:

```text
client/
```

run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# Production Build

## Frontend

```bash
cd client
npm run build
```

## Backend

```bash
cd server
npm run build
```

Both applications should pass TypeScript compilation before deployment.

---

# Design Principles

Pinpoint follows several principles.

### 1. Retrieval before generation

The LLM should not independently invent the troubleshooting procedure.

```text
Retrieve → Validate → Generate
```

### 2. Evidence over confidence

A fluent AI answer isn't necessarily a correct answer.

Pinpoint prioritizes documented evidence.

### 3. Step-level traceability

The system should answer:

```text
Which document?
Which version?
Which section?
Which step?
```

### 4. Fail safely

When the system cannot confidently identify a documented procedure:

```text
NO_CONFIDENT_MATCH
```

is preferable to hallucinating an answer.

### 5. Simple architecture

The project intentionally avoids unnecessary infrastructure such as:

* Kubernetes
* Kafka
* Redis
* Multiple databases
* Microservices
* Complex agent frameworks

The goal is to build a maintainable full-stack RAG application with a clear architecture.

---

# Security Considerations

The project is designed with the following security considerations:

* API keys remain server-side
* Environment variables are used for secrets
* Uploaded documents should be validated
* Document access should be controlled when authentication/authorization is introduced
* Retrieved document content should be treated as untrusted input
* Prompt injection inside documents should not be blindly followed
* Sensitive information should not be unnecessarily written to logs

---

# Current Status

The current application includes:

* [x] Next.js frontend
* [x] Minimal enterprise-style UI
* [x] Fastify REST API
* [x] PostgreSQL database
* [x] pgvector integration
* [x] Gemini embeddings
* [x] Groq LLM generation
* [x] Semantic retrieval
* [x] Confidence threshold
* [x] `NO_CONFIDENT_MATCH` behavior
* [x] Previous/current/next procedure context
* [x] Source traceability
* [x] Query history
* [x] Feedback API
* [x] Health endpoint
* [x] Admin dashboard
* [x] API/provider error state handling
* [x] Responsive UI
* [x] Production build verification

---

# Why Pinpoint?

Most RAG demos stop at:

```text
Upload PDF
   ↓
Ask question
   ↓
AI answer
```

Pinpoint focuses on a more operational problem:

```text
Network incident
      ↓
Engineer question
      ↓
Exact documented troubleshooting step
      ↓
Procedure context
      ↓
Source verification
```

The goal is not to build another generic chatbot.

The goal is to build a **trustworthy retrieval tool for engineers working under operational pressure**.

---

# Project Goals

Pinpoint is intended to demonstrate practical experience with:

* Full-stack TypeScript development
* Next.js and React
* REST API design
* Fastify
* PostgreSQL
* pgvector
* Vector similarity search
* Embeddings
* RAG architecture
* LLM integration
* Document processing
* Retrieval evaluation
* Error handling
* Database modeling
* API design
* Production-oriented application architecture

# Deployment

Link - https://pinpoint-chi-nine.vercel.app/