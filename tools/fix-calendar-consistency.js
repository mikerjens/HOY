const fs = require('fs');

function replaceOnce(text, regex, replacement, label) {
  const next = text.replace(regex, replacement);
  console.log(label + ': ' + (next === text ? 'no match' : 'updated'));
  return next;
}

let p = 'netlify/functions/portal-data.js';
let s = fs.readFileSync(p, 'utf8');

s = replaceOnce(
  s,
  /      const blocks = timedBlocks\(kimText\);\n      const starts = blocks\.map\(b => b\.start\)\.sort\(\);\n      const ends = blocks\.map\(b => b\.end\)\.sort\(\);\n      pushShift\(shifts,\{id:`LIVEW\$\{seq\+\+\}`,date,start:starts\[0\]\|\|'',end:ends\.slice\(-1\)\[0\]\|\|'',person:'Kim Hansen',[^\n]+\}\);/,
  `      const blocks = timedBlocks(kimText);\n      const starts = blocks.map(b => b.start).sort();\n      const ends = blocks.map(b => b.end).sort();\n      const orchestraBlock = blocks.find(b => /^ORKESTER(?: ALENE)?$/i.test(stripWeekName(b.label)));\n      const isFreeOrchestraDay = /FRI · ORKESTRET HAR FRI/i.test(kimText);\n      const aggregateEnd = ends.slice(-1)[0] || (/kl\\. 16:00|fra kl\\. 16:00/i.test(kimText)?'16:00':'');\n      const bandStart = orchestraBlock?.start || starts[0] || '';\n      const bandEnd = orchestraBlock && !/ALENE/i.test(orchestraBlock.label) ? orchestraBlock.end : aggregateEnd;\n      if (!isFreeOrchestraDay) pushShift(shifts,{id:\`LIVEW\${seq++}\`,date,start:bandStart,end:bandEnd,person:'Kim Hansen',role:'Kapellmeistari',task:sanitizePublicText(kimText.replace(/\\n+/g,' · ')),location:WEEK_LOCATION,activity:blocks.length?'Musiktræning med orkester':'Bandøvelse',status:/forslag/i.test(kimText)?'Forslag':'Planlagt'});`,
  'backend Kim/orchestra times'
);

s = replaceOnce(
  s,
  /      const bandStart=starts\[0\]\|\|'';\n      const bandEnd=ends\.slice\(-1\)\[0\]\|\|\(\/kl\\\. 16:00\|fra kl\\\. 16:00\/i\.test\(kimText\)\?'16:00':''\);\n      if \(!\/FRI · ORKESTRET HAR FRI\/i\.test\(kimText\)\) bandMembers\.forEach\(m=>\{/,
  `      if (!isFreeOrchestraDay) bandMembers.forEach(m=>{`,
  'backend band member times'
);

fs.writeFileSync(p, s);

p = 'index.html';
s = fs.readFileSync(p, 'utf8');

const earlyBranch = `if(!c.out&&earlyWeek&&crew.length){const kim=crew.find(x=>x.person==='Kim Hansen'&&/musik|træning|øvelse/i.test(String(x.activity||x.task||'')));const training=crew.filter(x=>x.role==='Spíri'&&/(spíri træning|træning med orkester)/i.test(String(x.activity||''))).sort((a,b)=>(a.start||'').localeCompare(b.start||''));const sync=crew.filter(x=>x.role==='Spíri'&&/sync/i.test(String(x.activity||''))).sort((a,b)=>(a.start||'').localeCompare(b.start||''));const singing=crew.filter(x=>x.role==='Spíri'&&/sangtræning med Guðrun/i.test(String(x.activity||x.task||''))).sort((a,b)=>(a.start||'').localeCompare(b.start||''));const primary=[...(kim?[kim]:[]),...training];const starts=primary.map(x=>x.start).filter(Boolean).sort();const ends=primary.map(x=>x.end).filter(Boolean).sort();let label=kim?'MUSIKTRÆNING':(p[0]?.dayType||crew[0]?.activity||'Produktionsdag');if(kim&&/øvelse/i.test(String(kim.activity||kim.task||''))&&!training.length)label='MUSIKØVELSE';const detail=[];if(kim)detail.push(\`Orkester \${kim.start&&kim.end?kim.start+'–'+kim.end:(kim.end?'slutter '+kim.end:'tid afventer')}\`);if(training.length)detail.push(\`Træning: \${training.map(x=>\`\${x.person} \${x.start&&x.end?x.start+'–'+x.end:''}\`.trim()).join(' · ')}\`);if(sync.length)detail.push(\`Sync: \${sync.map(x=>\`\${x.person} \${x.start&&x.end?x.start+'–'+x.end:''}\`.trim()).join(' · ')}\`);if(singing.length)detail.push(\`Sang: \${singing.map(x=>\`\${x.person} \${x.start&&x.end?x.start+'–'+x.end:''}\`.trim()).join(' · ')}\`);items=[{label,type:'pr',start:kim?.start||starts[0]||'',end:kim?.end||ends.slice(-1)[0]||'',detail:detail.join('\\n')}]}else if(!c.out&&p.length)`;

s = replaceOnce(
  s,
  /if\(!c\.out&&earlyWeek&&crew\.length\)\{[\s\S]*?\}\s*else if\(!c\.out&&p\.length\)/,
  earlyBranch,
  'frontend early calendar summary'
);

fs.writeFileSync(p, s);
