---
id: SOLUTION-LOGGING
type: solution
module: global
status: draft
---

# Logging

Application logs must be written daily, retain the latest 10 days, and exclude passwords, JWTs, refresh tokens, reset tokens, secrets, API keys, credentials, and unnecessary sensitive data.

## Purpose
Define application logging requirements.

## Log Categories
- Application startup/shutdown.
- API request failures.
- Authentication failures without sensitive details.
- Authorization failures without sensitive details.
- Database operation failures.
- Scheduled job failures if scheduled jobs are approved.

## Retention
- Logs are written daily.
- Retain latest 10 days.
- Older logs may be deleted/rotated by approved implementation.

## Security
- Never log passwords.
- Never log JWTs or refresh tokens.
- Never log reset tokens.
- Never log API keys or credentials.
- Avoid logging full request bodies for auth endpoints.

## Pending Decisions
- Log format.
- Log file location.
- Request ID/correlation ID.
- External log aggregation.
