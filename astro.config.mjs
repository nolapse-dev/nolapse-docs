import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.nolapse.dev',
  integrations: [
    starlight({
      title: 'Nolapse Docs',
      description: 'Git-native coverage enforcement — CLI, GitHub Action, and platform API.',
      customCss: ['./src/styles/custom.css', './src/styles/design-tokens.css'],
      editLink: {
        baseUrl: 'https://github.com/nolapse-dev/nolapse-docs/edit/main/',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/nolapse-dev' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Quickstart', link: '/quickstart/' },
            { label: 'Install', link: '/install/' },
            { label: 'First Baseline', link: '/first-baseline/' },
            { label: 'First Enforcement', link: '/first-enforcement/' },
          ],
        },
        {
          label: 'Language Guides',
          items: [
            { label: 'Go', link: '/languages/go/' },
            { label: 'Python', link: '/languages/python/' },
            { label: 'Node.js', link: '/languages/nodejs/' },
            { label: 'Java', link: '/languages/java/' },
            { label: '.NET', link: '/languages/dotnet/' },
            { label: 'Custom Runner', link: '/languages/custom/' },
          ],
        },
        {
          label: 'CI Integration',
          items: [
            { label: 'GitHub Actions', link: '/ci/github-actions/' },
            { label: 'GitLab CI', link: '/ci/gitlab-ci/' },
            { label: 'Jenkins', link: '/ci/jenkins/' },
            { label: 'Bitbucket', link: '/ci/bitbucket/' },
          ],
        },
        {
          label: 'Tokens & Auth',
          items: [
            { label: 'Setup', link: '/tokens/setup/' },
            { label: 'Rotation', link: '/tokens/rotation/' },
            { label: 'Scopes', link: '/tokens/scopes/' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'nolapse.yaml Reference', link: '/config/nolapse-yaml/' },
            { label: 'Exclusions', link: '/config/exclusions/' },
            { label: 'Thresholds', link: '/config/thresholds/' },
            { label: 'Dry Run', link: '/config/dry-run/' },
          ],
        },
        {
          label: 'Baseline Management',
          items: [
            { label: 'Init', link: '/baseline/init/' },
            { label: 'Update', link: '/baseline/update/' },
            { label: 'Lock', link: '/baseline/lock/' },
            { label: 'Audit List', link: '/baseline/audit-list/' },
          ],
        },
        {
          label: 'Diagnostics',
          items: [
            { label: 'nolapse doctor', link: '/doctor/' },
            { label: 'Troubleshooting', link: '/troubleshooting/' },
          ],
        },
        {
          label: 'Platform API',
          items: [
            { label: 'Overview', link: '/api/overview/' },
            { label: 'Auth', link: '/api/auth/' },
            { label: 'Executions', link: '/api/executions/' },
          ],
        },
        {
          label: 'Billing & Plans',
          items: [
            { label: 'Plans', link: '/billing/plans/' },
            { label: 'Usage', link: '/billing/usage/' },
          ],
        },
        {
          label: 'How-To Guides',
          items: [
            { label: 'Monorepo Setup', link: '/how-to/monorepo/' },
            { label: 'Multi-Language Repo', link: '/how-to/multi-language/' },
            { label: 'Raise Threshold', link: '/how-to/raise-threshold/' },
            { label: 'Exclude Generated Code', link: '/how-to/exclude-generated/' },
            { label: 'PR Gate', link: '/how-to/pr-gate/' },
            { label: 'Coverage Badge', link: '/how-to/badge/' },
            { label: 'Self-Hosted Runner', link: '/how-to/self-hosted-runner/' },
            { label: 'Migrate from Codecov', link: '/how-to/migrate-codecov/' },
          ],
        },
        {
          label: 'Tutorials',
          items: [
            { label: 'Go Microservice', link: '/tutorials/go-microservice/' },
            { label: 'Python (Django)', link: '/tutorials/python-django/' },
            { label: 'Node.js (Express)', link: '/tutorials/nodejs-express/' },
            { label: 'Java (Spring Boot)', link: '/tutorials/java-spring/' },
            { label: '.NET Web API', link: '/tutorials/dotnet-api/' },
            { label: 'Nx Monorepo', link: '/tutorials/monorepo-nx/' },
            { label: 'Open Source', link: '/tutorials/open-source/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI Commands', link: '/reference/cli/' },
            { label: 'JSON Output', link: '/reference/json-output/' },
            { label: 'Exit Codes', link: '/reference/exit-codes/' },
            { label: 'Changelog', link: '/reference/changelog/' },
          ],
        },
      ],
    }),
  ],
});
