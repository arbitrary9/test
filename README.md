# test
# Project Environment Configuration

This project uses environment variables for configuration. The environment variables are loaded from `.env` files and validated using Zod.

## Environment Files

The following environment files are supported:

- `.env` - Default environment file for local development
- `.env.local` - Local overrides (gitignored)
- `.env.test` - Test environment settings
- `.env.ci` - CI environment settings

## Environment Variables

### TestRail Configuration

- `TESTRAIL_HOST` - TestRail host URL
- `TESTRAIL_USERNAME` - TestRail username
- `TESTRAIL_PASSWORD` - TestRail password
- `TESTRAIL_PROJECT_ID` - TestRail project ID
- `TESTRAIL_SUITE_ID` - TestRail suite ID (optional)
- `TESTRAIL_RUN_NAME` - TestRail run name (optional)

### Cucumber Configuration

- `TAG` - Cucumber tag to run (optional)
- `WEB_SITE_URL` - Web site URL (default: https://www.google.com)
- `ENV` - Environment (local, ci, docker) (default: local)
- `DEBUG` - Debug mode (optional)

## Usage

Create a `.env` file based on the `.env.example` file and set the environment variables.

```typescript
import { env } from '@config/env.testrail';

console.log(env.TESTRAIL_HOST);
## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

Portions of this project utilize Playwright, which is licensed under the MIT License.
