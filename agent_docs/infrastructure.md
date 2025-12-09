# Infrastructure

## Database
- **Neon Project:** `still-snow-60472291`
- **Region:** aws-us-east-1
- **PostgreSQL:** v17
- **Tables:** config_file, config_position, config_option, config_grammar_cohort, config_option_component, config_file_blob, user, session, account, verification, embedding_cache, htb_attribute_mapping_zebra_provided, zebra_provided_attributes, zebra_provided_attribute_values, zebra_provided_properties_catalog

## Deployment
- **Production URL:** https://zebra-h2b-audit-v2-web.vercel.app/
- **Project Name:** zebra-h2b-audit-v2-web
- **Dev Server:** localhost:3001

## Environment Variables
- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL
- CORS_ORIGIN
- OPENAI_API_KEY

## Key Paths
- tRPC routers: `/packages/api/src/routers/`
- Drizzle schema: `/packages/db/src/schema/`
- Auth config: `/packages/auth/src/index.ts`
- UI components: `/apps/web/src/components/`
- Pages: `/apps/web/src/app/`
- Scripts: `/scripts/`
