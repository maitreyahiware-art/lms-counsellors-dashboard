# Educator Module: Scope & Implementation Plan

## 1. Overview
The **Educator Module** represents a new concept and phase in the platform's growth. Its primary purpose is to empower sales mentors and educators by providing a centralized, intelligent hub to search, discover, and retrieve content seamlessly. 

Instead of a traditional curriculum layout, this module acts as a **Universal Content Engine**, aggregating resources from across all existing modules and the company's Content CRM.

## 2. Core Features

### A. Universal Search
- A single, prominent search bar designed to handle queries across the entire database.
- It will leverage a **RAG (Retrieval-Augmented Generation) based system** combined with semantic search using vector embeddings to understand user queries deeply, mapping them contextually to appropriate health tags rather than just relying on exact keyword matches.

### B. Health Condition Categorization (The 6 Pillars)
Below the universal search, there will be a fast-filter tab system featuring 6 primary health conditions (e.g., Weight Management, Diabetes Care, PCOS, Gut Health, Heart Health, General Wellness). These tabs allow educators to quickly pivot the content view to specific domains.

### C. Comprehensive Content Database
When a search is performed or a tab is clicked, the module dynamically renders related content from the unified Content CRM. Supported content types include:
- Training Videos & Reels
- External Links & Resources
- Blog Articles
- Success Stories
- Challenges & Protocols

## 3. Technical Architecture Summary
- **Frontend UI:** Built using Next.js App Router. Following the existing design system tokens (e.g., `#FAFCEE` background, `#0E5858` primary text, `#00B6C1` accents).
- **Backend/Search Engine:** To be driven by a vector database (e.g., Pinecone/Supabase pgvector) and an embedding model (e.g., Gemini `text-embedding-004`).
- **Data Source:** Aggregation of the current dynamic `syllabus_content`, standard modules, and any external CRM data into a centralized indexed repository.

## 4. Immediate Next Steps
1. **Empty Module Layout:** Create the foundational UI `page.tsx` under `/educators` consisting of the hero search bar, the 6 health condition tabs, and a mock content grid.
2. **Data Modeling:** Finalize the schema for tagging content and mapping it to vector embeddings.
3. **RAG Integration:** Setup the semantic search backend and wire it to the universal search bar.


the design for the page is to be in Kanban board - after slecting the heath tab- let the conent be displayed in the form of kanban board - with the columns as - videos , articles , external links , success stories , challenges & protocols.
after tis 