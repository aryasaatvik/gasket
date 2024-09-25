/* eslint-disable max-statements */

const { writeFile } = require('fs').promises;
const path = require('path');
const mdTable = require('markdown-table');

const isUrl = /^(https?:)?\/\//;

/**
 * Generates the index README.md
 * @param {import('../internal').DocsConfigSet} docsConfigSet - Docs generation
 * configs
 * @returns {string} filename
 */
function generateContent(docsConfigSet) {
  const { app: appDocs, docsRoot } = docsConfigSet;
  const refMap = new Map();
  let content = '';
  let idx = 0;

  /**
   * Ensure that references are unique
   * @param {string | number} ref - Reference to check
   * @returns {string | number} unique reference
   */
  function uniqueRef(ref) {
    return refMap.has(ref) ? ++idx : ref;
  }

  const addLine = (text = '') => {
    content += text + '\n';
  };
  const addContent = (text = '') => {
    addLine(text);
    addLine();
  };
  const addTable = (elems) => {
    // @ts-ignore
    addContent(mdTable(elems));
  };
  const formatLink = (link, targetRoot) =>
    isUrl.test(link)
      ? link
      : path.relative(docsRoot, path.join(targetRoot, link));

  addContent('<!-- generated by `gasket docs` -->');
  addContent('# App');
  addContent(`[${appDocs.name}] — ${appDocs.description}`);
  refMap.set(appDocs.name, formatLink(appDocs.link, appDocs.targetRoot));

  const addSection = (
    sectionTitle,
    sectionDesc,
    docs,
    {
      includeVersion = true,
      additionalHeaders = [],
      linkFallbacks = false
    } = {}
  ) => {
    if (!docs || !docs.length) return;

    addContent(`## ${sectionTitle}`);

    addContent(sectionDesc);

    const headers = includeVersion
      ? ['Name', 'Version', 'Description'].concat(additionalHeaders)
      : ['Name', 'Description'].concat(additionalHeaders);
    addTable([
      headers,
      ...docs.map((moduleDoc) => {
        const additionalHeaderValues = additionalHeaders.map(
          (h) => moduleDoc[h.toLowerCase()]
        );

        const {
          name,
          description,
          link,
          version,
          targetRoot,
          deprecated
        } = moduleDoc;

        let itemName = deprecated ? `${name} (deprecated)` : name;

        if (link || linkFallbacks) {
          const ref = uniqueRef(itemName);
          itemName = ref === name ? `[${itemName}]` : `[${itemName}][${ref}]`;
          refMap.set(ref, formatLink(link || 'README.md', targetRoot));
        }

        return [
          itemName,
          ...(includeVersion
            ? [version, description, ...additionalHeaderValues]
            : [description, ...additionalHeaderValues])
        ];
      })
    ]);
  };

  addSection('Guides', 'Help and explanations docs', docsConfigSet.guides, {
    includeVersion: false
  });

  addSection('Commands', 'Available commands', docsConfigSet.commands, {
    includeVersion: false
  });

  addSection('Actions', 'Available actions', docsConfigSet.actions, {
    includeVersion: false
  });

  addSection('Lifecycles', 'Available lifecycles', docsConfigSet.lifecycles, {
    includeVersion: false
  });

  addSection('Structures', 'Available structure', docsConfigSet.structures, {
    includeVersion: false
  });

  addSection('Presets', 'All configured presets', docsConfigSet.presets);
  addSection('Plugins', 'All configured plugins', docsConfigSet.plugins);
  addSection(
    'Modules',
    'Dependencies and supporting modules',
    docsConfigSet.modules
  );
  addSection(
    'Configurations',
    'Available configuration options in the `gasket.js`',
    docsConfigSet.configurations,
    {
      includeVersion: false,
      additionalHeaders: ['Type', 'Default'],
      linkFallbacks: true
    }
  );

  addContent('<!-- LINKS -->');
  refMap.forEach(function (value, key) {
    addLine('[' + key + ']:' + value);
  });

  return content;
}

/**
 * Generates the index README.md
 * @param {import('../internal').DocsConfigSet} docsConfigSet - Docs generation
 * configs
 * @returns {Promise<string>} filename
 */
async function generateIndex(docsConfigSet) {
  const { docsRoot } = docsConfigSet;

  const target = path.join(docsRoot, 'README.md');
  const content = await generateIndex.generateContent(docsConfigSet);
  await writeFile(target, content);
  return target;
}

generateIndex.generateContent = generateContent;

module.exports = generateIndex;
