User Workflow

Landing Page 
user to create new account
Password reset
User to login using email and password
Subscriber questionnaire - demographic and goals - 3 free credits now vs 1 credit later
// Note: Detailed onboarding questionnaire to be implemented post-MVP
Home page
User to submit Youtube url into a text field
User able access account settings
User able to access previous docs created
User to provide input into what they are looking for
Select one of a choice of summaries
How to check list
Summary document
Detailed how to check list
Select one of a choice of descriptions of their level.
Beginner
Intermediate
Expert
Edit screen
User presented the outputted document
User can make edits and formatting in the window.
Include formatting tools 
All features visible
Active features enabled under user subscription plan would be bold/darker text
Inactive features would be visible but greyed out.

Feature list displayed at the side for selection
Subscription or Credits
When a user selects an inactive feature they get a pop-up to enroll or by credit.
If user is credit user - Pro = 3x premium credits.
// Note: Credit system details and pricing to be defined post-MVP

Feature Comparison Table
| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Video Length Limit | 15 min | 30 min | 2 hours |
| File Size Limits | 30MB | 100MB | 500MB |
| Number of Saved Transcripts | 3 | 25 | 50 |
| Include Time stamps on sections | ✓ | ✓ | ✓ |
| Watermark | Yes | No | No |
| Different levels of instructions | ✓ | ✓ | ✓ |
| Increase/decrease the details | ✓ | ✓ | ✓ |
| Collaborative editing | ✓ | ✓ | ✓ |
| Export Formats | PDF only | PDF, DOCX, MD | PDF, DOCX, MD |
| Additional lists/Tools needed | ✓ | ✓ | ✓ |
| Branding | Basic | Branded | Whitelabel |
| Branded design optimized for learning | ✓ | ✓ | ✓ |
| Timestamp and linked URL | ✓ | ✓ | ✓ |

Technical Product Requirements Document
Core Architecture
text
graph TD
    A[User Interface] -->|Submit YouTube URL| B(API Gateway)
    B --> C[Auth Service]
    C -->|JWT Validation| D[Processing Pipeline]
    D --> E[AssemblyAI Transcription]
    E --> F[OpenAI Document Generation]
    F --> G[Supabase Database]
    G --> H[Document Editor]
    H --> I[Stripe Billing]
    I --> J[Admin Dashboard]

Technology Stack
Component
Technology
Frontend
Next.js 14 + ShadCN UX
Backend
Next.js API Routes
Database
Supabase PostgreSQL
Auth
Supabase Auth
Payments
Stripe Subscription
AI Processing
OpenAI GPT-4 Turbo
Transcription
AssemblyAI
Deployment
Vercel

Processing Specifications
- Video Processing Time: Up to 60 seconds
- Maximum Document Size: 10 pages
- Supported Video Platform: YouTube only
- Supported Export Formats: PDF, DOCX, Markdown
- Document Formatting Options:
  - Bold/Italic/Underline
  - Bullet points and numbering
  - Font color and type
  - Templates based on LLM outputs
  - Templates managed via admin interface

Data Retention and Backup Recommendations
1. Data Retention Policy:
   - User data: Retain for 12 months after account deletion
   - Processing logs: Retain for 30 days
   - Analytics data: Retain for 24 months

2. Backup Procedures:
   - Database: Daily full backups, hourly incremental backups
   - User files: Real-time replication to secondary storage
   - Backup retention: 30 days for daily backups, 12 months for weekly backups
   - Backup verification: Weekly restore tests

3. Disaster Recovery:
   - Recovery Time Objective (RTO): 4 hours
   - Recovery Point Objective (RPO): 1 hour
   - Regular disaster recovery testing: Quarterly

Analytics Tracking
Key Metrics:
1. User Activity:
   - Number of video processing runs
   - URLs submitted
   - Processing success/failure rates
   - Feature usage by subscription tier

2. System Performance:
   - Processing time per video
   - Token usage volume
   - API response times
   - Error rates and types

3. Business Metrics:
   - Subscription conversion rates
   - Feature adoption rates
   - User retention rates
   - Revenue per user

Regional Specifications
- Target Market: United States
- Language: American English
- Currency: USD
- Time Zone: US-based operations

Error Handling
typescript
try {
  const transcript = await assemblyAI.submitTranscript(url);
} catch (error) {
  if (error.code === 'TRANSCRIPTION_UNAVAILABLE') {
    throw new Error('Video not eligible for processing');
  }
  // Log error details for admin resolution
  Sentry.captureException(error);
  // Display user-friendly error message
  return {
    error: 'Unable to process video. Please try again later.',
    errorCode: error.code
  };
}

Cursor IDE Best Practices
Mono-repo structure with Turborepo
Type-safe API layer with tRPC
Atomic component design system
Automated API documentation via Swagger
End-to-end type safety with Zod

Admin Interface Requirements
1. Template Management:
   - System prompt templates for LLM configuration
   - Template categories and organization
   - Template version control
   - Template testing interface
   - Template deployment controls
   - Template usage analytics

2. Template Configuration:
   - Prompt engineering interface
   - Variable substitution support
   - Template validation tools
   - Template preview functionality
   - Template A/B testing capabilities
   - Template performance metrics

3. Template Security:
   - Access control for template management
   - Audit logging for template changes
   - Template backup and restore
   - Template rollback capabilities
