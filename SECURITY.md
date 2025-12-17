# Security Policy

## Reporting a Vulnerability

We take the security of ZenithScores seriously. If you believe you have found a security vulnerability, please report it to us by emailing security@zenithscores.com.

## Security Controls

1. **Data Encryption**: Sensitive data such as API keys are encrypted at rest using AES-256.
2. **Read-Only Access**: Users are required to provide read-only API keys for exchange integrations.
3. **Environment Secrets**: All sensitive configuration is managed via environment variables and never committed to version control.
4. **Rate Limiting**: Core API endpoints are protected by rate limiting to prevent abuse.
5. **Subscription Guards**: Premium features are validated both on the frontend (for UX) and backend (for security).

## Disclaimer

ZenithScores is an educational platform. We are not responsible for financial losses incurred while using our software. Always trade responsibly and within your means.
