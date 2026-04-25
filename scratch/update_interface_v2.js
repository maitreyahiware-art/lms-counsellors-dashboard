const fs = require('fs');
const path = 'src/data/social_content_clean.ts';
let content = fs.readFileSync(path, 'utf8');

const oldLine = 'recipeCategorySlug?: string;';
const newLine = 'recipeCategoryName?: string;';

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated field name');
} else {
  console.log('Could not find field to replace');
}
