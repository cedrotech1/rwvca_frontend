const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/pages/dashboard/workflow/DocumentDetailPage.jsx');
let s = fs.readFileSync(file, 'utf8');

if (!s.includes('askNotifyPriority')) {
  s = s.replace(
    'const { fetchNotifications } = useNotifications();',
    "const { fetchNotifications } = useNotifications();\n  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();"
  );
}

s = s.replace(/\n\s*const \[sharePriority, setSharePriority\] = useState\(''\);/, '');

s = s.replace(
  /if \(!sharePriority\) \{\s*setError\('Select notification priority \(Send as\)'\);\s*return;\s*\}\s*/,
  ''
);

s = s.replace(
  'const res = await api.post(`/documents/${id}/share`, { user_ids: selectedIds, is_forward: isForward, priority: sharePriority });',
  `const priority = await askNotifyPriority({
        title: 'Notify shared users as',
        subtitle: 'Choose how this document share should appear in their notification alerts.',
        confirmLabel: 'Share & notify',
      });
      if (!priority) return;

      const res = await api.post(\`/documents/\${id}/share\`, { user_ids: selectedIds, is_forward: isForward, priority });`
);

s = s.replace(
  /<label className="mt-4 block text-sm text-gray-700">\s*Send as \(notification priority\)[\s\S]*?<\/label>\s*/,
  ''
);

s = s.replace(
  'disabled={saving || !selectedIds.length || !sharePriority}',
  'disabled={saving || !selectedIds.length}'
);

s = s.replace(
  'setIsForward(false);\n\n      await afterChange();',
  'setIsForward(false);\n\n      await afterChange();'
);

if (!s.includes('{notifyModal}')) {
  s = s.replace(
    '          />\n\n        </>\n\n      )}\n\n    </div>',
    '          />\n\n          {notifyModal}\n\n        </>\n\n      )}\n\n    </div>'
  );
}

fs.writeFileSync(file, s);
console.log('DocumentDetailPage updated');
