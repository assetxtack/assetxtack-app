const fs = require('fs');

let content = fs.readFileSync('app/api/profile/avatar/route.ts', 'utf8');
content = content.replace(
  'return NextResponse.json({ success: true, avatarUrl:);',
  'return NextResponse.json({ success: true, avatarUrl: avatarUrl });'
);
fs.writeFileSync('app/api/profile/avatar/route.ts', content);
console.log('Fixed avatar route syntax');
