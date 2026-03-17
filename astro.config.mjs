import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.nolapse.dev',
  integrations: [
    starlight({
      title: 'Nolapse Docs',
      description: 'Git-native coverage enforcement — CLI, GitHub Action, and platform API.',
      logo: {
        light: './src/assets/nolapse-logo-light.svg',
        dark: './src/assets/nolapse-logo-dark.svg',
        replacesTitle: true,
      },
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/nolapse-dev/nolapse-docs/edit/main/',
      },
      social: {
        github: 'https://github.com/nolapse-dev',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', slug: 'index' },
            { label: 'Quickstart', slug: 'quickstart/index' },
            { label: 'Install', slug: 'install/index' },
            { label: 'First Baseline', slug: 'first-baseline/index' },
            { label: 'First Enforcement', slug: 'first-enforcement/index' },
          ],
        },
        {
          label: 'Language Guides',
          items: [
            { label: 'Go', slug: 'languages/go/index' },
            { label: 'Python', slug: 'languages/python/index' },
            { label: 'Node.js', slug: 'languages/nodejs/index' },
            { label: 'Java', slug: 'languages/java/index' },
            { label: '.NET', slug: 'languages/dotnet/index' },
            { label: 'Custom Runner', slug: 'languages/custom/index' },
          ],
        },
        {
          label: 'CI Integration',
          items: [
            { label: 'GitHub Actions', slug: 'ci/github-actions/index' },
            { label: 'GitLab CI', slug: 'ci/gitlab-ci/index' },
            { label: 'Jenkins', slug: 'ci/jenkins/index' },
            { label: 'Bitbucket', slug: 'ci/bitbucket/index' },
          ],
        },
        {
          label: 'Tokens & Auth',
          items: [
            { label: 'Setup', slug: 'tokens/setup/index' },
            { label: 'Rotation', slug: 'tokens/rotation/index' },
            { label: 'Scopes', slug: 'tokens/scopes/index' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'nolapse.yaml Reference', slug: 'config/nolapse-yaml/index' },
            { label: 'Exclusions', slug: 'config/exclusions/index' },
            { label: 'Thresholds', slug: 'config/thresholds/index' },
            { label: 'Dry Run', slug: 'config/dry-run/index' },
          ],
        },
        {
          label: 'Baseline Management',
          items: [
            { label: 'Init', slug: 'baseline/init/index' },
            { label: 'Update', slug: 'baseline/update/index' },
            { label: 'Lock', slug: 'baseline/lock/index' },
            { label: 'Audit List', slug: 'baseline/audit-list/index' },
          ],
        },
        {
          label: 'Diagnostics',
          items: [
            { label: 'nolapse doctor', slug: 'doctor/index' },
            { label: 'Troubleshooting', slug: 'troubleshooting/index' },
          ],
        },
        {
          label: 'Platform API',
          items: [
            { label: 'Overview', slug: 'api/overview/index' },
            { label: 'Auth', slug: 'api/auth/index' },
            { label: 'Executions', slug: 'api/executions/index' },
          ],
        },
        {
          label: 'Billing & Plans',
          items: [
            { label: 'Plans', slug: 'billing/plans/index' },
            { label: 'Usage', slug: 'billing/usage/index' },
          ],
        },
        {
          label: 'How-To Guides',
          items: [
            { label: 'Monorepo Setup', slug: 'how-to/monorepo/index' },
            { label: 'Multi-Language Repo', slug: 'how-to/multi-language/index' },
            { label: 'Raise Threshold', slug: 'how-to/raise-threshold/index' },
            { label: 'Exclude Generated Code', slug: 'how-to/exclude-generated/index' },
            { label: 'PR Gate', slug: 'how-to/pr-gate/index' },
            { label: 'Coverage Badge', slug: 'how-to/badge/index' },
            { label: 'Self-Hosted Runner', slug: 'how-to/self-hosted-runner/index' },
            { label: 'Migrate from Codecov', slug: 'how-to/migrate-codecov/index' },
          ],
        },
        {
          label: 'Tutorials',
          items: [
            { label: 'Go Microservice', slug: 'tutorials/go-microservice/index' },
            { label: 'Python (Django)', slug: 'tutorials/python-django/index' },
            { label: 'Node.js (Express)', slug: 'tutorials/nodejs-express/index' },
            { label: 'Java (Spring Boot)', slug: 'tutorials/java-spring/index' },
            { label: '.NET Web API', slug: 'tutorials/dotnet-api/index' },
            { label: 'Nx Monorepo', slug: 'tutorials/monorepo-nx/index' },
            { label: 'Open Source', slug: 'tutorials/open-source/index' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI Commands', slug: 'reference/cli/index' },
            { label: 'JSON Output', slug: 'reference/json-output/index' },
            { label: 'Exit Codes', slug: 'reference/exit-codes/index' },
            { label: 'Changelog', slug: 'reference/changelog/index' },
          ],
        },
      ],
    }),
  ],
});