/* eslint-disable no-console, no-sync */
import fs from 'fs';
import path from 'path';
import { makeGasket } from '@gasket/core';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import configPlugin from './plugins/config-plugin.js';
import siteDocsPlugin from './plugins/site-docs-plugin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const projectRoot = path.resolve(__dirname, '..', '..');
const packagesDir = path.join(projectRoot, 'packages');

const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true }).filter(dirent => {
  return dirent.isDirectory() && fs.existsSync(path.join(packagesDir, dirent.name, 'package.json'));
});

const pluginDirs = await Promise.all(packageDirs
  .filter(dirent => dirent.name.startsWith('gasket-plugin-'))
  .map(async dirent => {
    const { name } = require(path.join(packagesDir, dirent.name, 'package.json'));
    const mod = await import(name);
    return mod.default || mod;
  }));

const presetDirs = await Promise.all(packageDirs
  .filter(dirent => dirent.name.startsWith('gasket-preset-'))
  .map(async dirent => {
    const { name } = require(path.join(packagesDir, dirent.name, 'package.json'));
    const mod = await import(name);
    return mod.default || mod;
  }));

const moduleDirs = await Promise.all(packageDirs
  .filter(dirent => !dirent.name.startsWith('gasket-plugin-') && !dirent.name.startsWith('gasket-preset-') && dirent.name.startsWith('gasket-'))
  .map(async dirent => {
    const { name } = require(path.join(packagesDir, dirent.name, 'package.json'));
    const mod = await import(name);
    return mod.default || mod;
  }));

export default makeGasket({
  plugins: presetDirs.concat([configPlugin, siteDocsPlugin], pluginDirs, moduleDirs)
});

