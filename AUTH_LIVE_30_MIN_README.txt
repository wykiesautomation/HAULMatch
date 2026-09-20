HaulMatch Auth Live Patch
- Email/password sign in
- Email/password account creation
- Google sign-in button using Neon Managed Better Auth
- Trusted domain callback to /transport-leads/
- Existing RLS, wallet and secure unlock behavior retained

Expected live behavior:
- Any visitor may create an Auth account.
- New accounts cannot access wallets or unlock customer data until an approved transporter profile is linked to auth_subject.
- Google shared credentials are suitable for immediate testing but show Neon branding. Configure custom Google OAuth credentials before public production launch.
