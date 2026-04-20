interface ActiveBlock {
  instanceId: string;
  rawTemplate: string;
  variables: Record<string, string>;
}

export function buildEmailHtml(name: string, blocks: ActiveBlock[]): string {
  const body = blocks
    .map((b) => {
      let html = b.rawTemplate;
      for (const [k, v] of Object.entries(b.variables)) {
        html = html.split(`{{${k}}}`).join(v);
      }
      return html;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f4; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
