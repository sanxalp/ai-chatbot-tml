# Database Schema Design

## Overview

The database schema is designed using a hybrid approach with PostgreSQL for structured data and Object Storage (AWS S3/Azure Blob Storage) for media files and documents. This design optimizes for both data integrity and storage efficiency.

## Tables

### 1. users

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'user', 'support')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb
);
```

### 2. chat_sessions

```sql
CREATE TABLE chat_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 3. messages

```sql
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(session_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('user', 'assistant', 'system')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 4. documents

```sql
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    bucket_name VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    processing_status VARCHAR(20) CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL
);
```

### 5. media_files

```sql
CREATE TABLE media_files (
    media_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    filename VARCHAR(255) NOT NULL,
    media_type VARCHAR(20) CHECK (media_type IN ('audio', 'video')) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    storage_path VARCHAR(255) NOT NULL,
    bucket_name VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(20) CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 6. transcriptions

```sql
CREATE TABLE transcriptions (
    transcription_id SERIAL PRIMARY KEY,
    media_id INTEGER NOT NULL REFERENCES media_files(media_id),
    content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confidence_score FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 7. complaints

```sql
CREATE TABLE complaints (
    complaint_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    sentiment_score FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 8. product_queries

```sql
CREATE TABLE product_queries (
    query_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    product_id VARCHAR(50),
    query_text TEXT NOT NULL,
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

## Object Storage Structure

### S3/Azure Blob Storage Buckets

1. **media-bucket**

   - /audio/
   - /video/
   - /temp/

2. **documents-bucket**

   - /pdf/
   - /docx/
   - /other/

3. **processing-bucket**
   - /temp/
   - /cache/

## Indexes

### Performance Optimization Indexes

```sql
-- Chat session lookup
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created ON chat_sessions(created_at);

-- Message retrieval
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Document search
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(file_type);
CREATE INDEX idx_documents_status ON documents(processing_status);

-- Media file search
CREATE INDEX idx_media_files_user ON media_files(user_id);
CREATE INDEX idx_media_files_type ON media_files(media_type);
CREATE INDEX idx_media_files_status ON media_files(processing_status);

-- Complaint management
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created ON complaints(created_at);

-- JSONB indexes for metadata
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata);
CREATE INDEX idx_documents_metadata ON documents USING GIN (metadata);
CREATE INDEX idx_media_files_metadata ON media_files USING GIN (metadata);
```

## Security Considerations

1. **Data Encryption**

   - Sensitive user data encrypted at rest
   - Passwords hashed using bcrypt
   - API keys encrypted
   - Object Storage encryption enabled

2. **Access Control**

   - Role-based access control
   - Row-level security
   - Object Storage IAM policies
   - Signed URLs for media access

3. **Audit Trail**
   - All sensitive operations logged
   - Timestamps maintained
   - User activity tracking
   - Object Storage access logs

## Backup Strategy

1. **PostgreSQL Backups**

   - Daily full backups
   - Hourly incremental backups
   - Point-in-time recovery
   - Cross-region replication

2. **Object Storage Backups**

   - Versioning enabled
   - Cross-region replication
   - Lifecycle policies
   - Access logging

3. **Data Retention**
   - Chat history: 1 year
   - Media files: 6 months
   - User data: Until account deletion
   - Audit logs: 2 years
   - Object Storage: Configurable lifecycle policies
