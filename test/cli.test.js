import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { tmpdir } from 'os';
import { join } from 'path';
import fs from 'fs-extra';
import { 
  handleClaudeMarkdown,
  handleDirectoryMirror,
  handleSelectiveFileCopy,
  handleSingleFile
} from '../src/fileManager.js';

describe('Claude Init Tests', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'claude-init-test-'));
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('CLAUDE.md handling', () => {
    test('creates new CLAUDE.md when file does not exist', async () => {
      const result = await handleClaudeMarkdown(tempDir);
      
      assert.strictEqual(result.action, 'created');
      assert(await fs.pathExists(join(tempDir, 'CLAUDE.md')));
      
      const content = await fs.readFile(join(tempDir, 'CLAUDE.md'), 'utf8');
      assert(content.includes('During you interaction with the user'));
    });
    
    test('skips when CLAUDE.md already contains template content', async () => {
      // Create file with template content
      const templateContent = await fs.readFile(join(process.cwd(), 'CLAUDE.md'), 'utf8');
      await fs.writeFile(join(tempDir, 'CLAUDE.md'), templateContent);
      
      const result = await handleClaudeMarkdown(tempDir);
      
      assert.strictEqual(result.action, 'skipped');
    });
    
    test('appends to existing CLAUDE.md with different content', async () => {
      // Create file with different content
      await fs.writeFile(join(tempDir, 'CLAUDE.md'), '# My Project\\n\\nExisting content');
      
      const result = await handleClaudeMarkdown(tempDir);
      
      assert.strictEqual(result.action, 'updated');
      
      const content = await fs.readFile(join(tempDir, 'CLAUDE.md'), 'utf8');
      assert(content.includes('My Project'));
      assert(content.includes('# CLAUDE.md'));
      assert(content.includes('During you interaction with the user'));
    });
  });
  
  describe('Directory mirroring', () => {
    test('creates new directory when it does not exist', async () => {
      const result = await handleDirectoryMirror(tempDir, '.devcontainer');
      
      assert.strictEqual(result.action, 'created');
      assert(await fs.pathExists(join(tempDir, '.devcontainer')));
      assert(await fs.pathExists(join(tempDir, '.devcontainer', 'devcontainer.json')));
    });
    
    test('skips when directory already exists', async () => {
      await fs.mkdir(join(tempDir, '.devcontainer'));
      
      const result = await handleDirectoryMirror(tempDir, '.devcontainer');
      
      assert.strictEqual(result.action, 'skipped');
    });
  });
  
  describe('Selective file copying', () => {
    test('creates directory with all files when it does not exist', async () => {
      const result = await handleSelectiveFileCopy(tempDir, '.claude/commands');

      assert.strictEqual(result.action, 'created');
      assert(await fs.pathExists(join(tempDir, '.claude/commands')));
      assert(await fs.pathExists(join(tempDir, '.claude/commands', 'debug.md')));
      assert(result.filesAdded > 0);
    });
    
    test('adds missing files to existing directory', async () => {
      // Create directory with some files
      await fs.mkdir(join(tempDir, '.claude/commands'), { recursive: true });
      await fs.writeFile(join(tempDir, '.claude/commands', 'debug.md'), 'existing content');

      const result = await handleSelectiveFileCopy(tempDir, '.claude/commands');

      assert.strictEqual(result.action, 'updated');
      assert(result.filesAdded > 0);

      // Original file should still exist with original content
      const content = await fs.readFile(join(tempDir, '.claude/commands', 'debug.md'), 'utf8');
      assert.strictEqual(content, 'existing content');

      // New files should be added
      assert(await fs.pathExists(join(tempDir, '.claude/commands', 'commit.md')));
    });
    
    test('skips when all files are present', async () => {
      // First run to create all files
      await handleSelectiveFileCopy(tempDir, '.claude/commands');

      // Second run should skip
      const result = await handleSelectiveFileCopy(tempDir, '.claude/commands');

      assert.strictEqual(result.action, 'skipped');
      assert.strictEqual(result.filesAdded, 0);
    });

    test('overwrites existing files when overwriteExisting is true', async () => {
      // Create directory with custom content
      await fs.mkdir(join(tempDir, '.claude/commands'), { recursive: true });
      await fs.writeFile(join(tempDir, '.claude/commands', 'debug.md'), 'custom content');

      // Read template content for comparison
      const templateContent = await fs.readFile(join(process.cwd(), '.claude/commands', 'debug.md'), 'utf8');

      const result = await handleSelectiveFileCopy(tempDir, '.claude/commands', {
        overwriteExisting: true,
        filter: (relPath) => relPath.endsWith('.md')
      });

      assert.strictEqual(result.action, 'updated');
      assert(result.filesOverwritten >= 1, 'Should have overwritten at least one file');

      // File should now have template content
      const content = await fs.readFile(join(tempDir, '.claude/commands', 'debug.md'), 'utf8');
      assert.strictEqual(content, templateContent);
    });

    test('filter limits which files are overwritten', async () => {
      // Create directory with custom .md and .txt files
      await fs.mkdir(join(tempDir, '.claude/commands'), { recursive: true });
      await fs.writeFile(join(tempDir, '.claude/commands', 'debug.md'), 'custom md content');
      await fs.writeFile(join(tempDir, '.claude/commands', 'test.txt'), 'custom txt content');

      const result = await handleSelectiveFileCopy(tempDir, '.claude/commands', {
        overwriteExisting: true,
        filter: (relPath) => relPath.endsWith('.md')
      });

      assert.strictEqual(result.action, 'updated');

      // .txt file should keep custom content (not overwritten)
      if (await fs.pathExists(join(tempDir, '.claude/commands', 'test.txt'))) {
        const txtContent = await fs.readFile(join(tempDir, '.claude/commands', 'test.txt'), 'utf8');
        assert.strictEqual(txtContent, 'custom txt content');
      }
    });

    test('default behavior preserves existing files without overwrite option', async () => {
      // Create directory with custom content
      await fs.mkdir(join(tempDir, '.claude/commands'), { recursive: true });
      await fs.writeFile(join(tempDir, '.claude/commands', 'debug.md'), 'custom content');

      // Call without overwrite option (default behavior)
      await handleSelectiveFileCopy(tempDir, '.claude/commands');

      // Should add missing files but not overwrite existing
      const content = await fs.readFile(join(tempDir, '.claude/commands', 'debug.md'), 'utf8');
      assert.strictEqual(content, 'custom content');
    });
  });
  
  describe('Single file handling', () => {
    test('creates file when it does not exist', async () => {
      const result = await handleSingleFile(tempDir, '.claude/settings.json');
      
      assert.strictEqual(result.action, 'created');
      assert(await fs.pathExists(join(tempDir, '.claude/settings.json')));
    });
    
    test('skips when file already exists', async () => {
      await fs.mkdir(join(tempDir, '.claude'), { recursive: true });
      await fs.writeFile(join(tempDir, '.claude/settings.json'), '{"existing": true}');
      
      const result = await handleSingleFile(tempDir, '.claude/settings.json');
      
      assert.strictEqual(result.action, 'skipped');
      
      // Original content should be preserved
      const content = await fs.readFile(join(tempDir, '.claude/settings.json'), 'utf8');
      assert(content.includes('"existing": true'));
    });
  });
});