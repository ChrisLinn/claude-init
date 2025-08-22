#!/usr/bin/env node

import { cli } from '../src/cli.js';

// Entry point for npx claude-init
cli().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});