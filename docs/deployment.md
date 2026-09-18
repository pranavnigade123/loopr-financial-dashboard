# Azure deployment

Target: a single Linux Azure App Service (Node 22) serving compiled React assets and `/api`, plus MongoDB Atlas. The Bicep template defaults to a paid B1 plan with Always On. Confirm region, quota, credit eligibility, and cost before provisioning. No cloud resources have been created by adding these files.

## Provisioning checklist

1. Choose subscription, resource group, region, and globally unique app name.
2. Review `infra/main.bicep` and run an Azure what-if preview. Provide secure parameters without committing a parameter file or placing secret values in shell history.
3. Create resources after reviewing the preview. Configure budget alerts separately; alerts do not stop spending.
4. Limit the Atlas database user to `readWrite` on `loopr`. Add App Service's possible outbound addresses to the Atlas access list and revisit these if the hosting plan changes. Do not default to allowing every address. Test actual outbound connectivity before release.
5. Seed once through a trusted development/admin environment. Do not store the demo password in the running server or reseed on startup.
6. Configure GitHub-to-Azure OIDC scoped to the repository and deployment environment. Scope deployment permissions to the app where possible.
7. Set GitHub environment variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and `AZURE_WEBAPP_NAME`. These identifiers are not database credentials. Store database/JWT secrets only in protected runtime configuration.

## Release

The manual deployment workflow checks the exact selected commit, builds on Linux, copies only compiled runtime files into `release/`, installs production API dependencies, and deploys that artifact. It does not upload `.env`, source data, or test fixtures. A versioned artifact is retained for recovery. Configure the GitHub `production` environment according to the desired release approval policy.

After deployment, verify readiness, login/logout, secure cookies, transaction retrieval, frontend refresh behavior, and client-IP attribution behind Azure's proxy. Do not broaden `trustProxy` without validating the deployment's trusted proxy topology. Current rate limiting uses the immediate peer IP and may group traffic behind the proxy.

## Recovery and operations

Retain known-good release artifacts and redeploy the selected artifact if a release fails. B1 does not provide deployment slots; do not claim a slot-swap rollback. Brief restart downtime is acceptable for this assignment. Database schema changes must remain compatible with the prior application release.

Use structured application logs without credentials, cookies, or financial request bodies. Health checks should reveal status only. Monitor the paid plan and remember that stopping the web app does not remove plan charges. Atlas billing is separate unless explicitly arranged otherwise.
