import path from 'node:path';
import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';
import { glob } from 'glob';

const workspaces = glob.sync(require('./package.json').workspaces).map(ws => path.basename(ws));

module.exports = {
    extends: ['@commitlint/config-conventional', 'monorepo'],
    formatter: '@commitlint/format',
    rules: {
        'scope-enum': [RuleConfigSeverity.Error, 'always', [...workspaces, 'repo', 'release', 'github']]
    }
} satisfies UserConfig;
