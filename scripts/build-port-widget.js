// widget/port-today-template.html の /*LOGIC*/ に src/port-today-logic.js を埋め込み、
// WordPressに貼る1ファイル widget/port-today-widget.html を作る。
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const tpl = fs.readFileSync(path.join(dir, 'widget/port-today-template.html'), 'utf8');
const logic = fs.readFileSync(path.join(dir, 'src/port-today-logic.js'), 'utf8');
if (!tpl.includes('/*LOGIC*/')) throw new Error('テンプレートに /*LOGIC*/ がありません');
fs.writeFileSync(path.join(dir, 'widget/port-today-widget.html'), tpl.replace('/*LOGIC*/', () => logic));
console.log('widget/port-today-widget.html を作りました');
