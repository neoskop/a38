export default {
    '*.ts': () => 'bun run lint:staged',
    '*.json': ['prettier --write', 'biome format --write ']
};
