-- Clients
create table if not exists clients (
  id        text primary key,
  name      text not null,
  color     text not null default '#6b7280',
  created_at timestamptz default now()
);

-- Blocks library (per client)
create table if not exists blocks (
  id          text not null,
  client_id   text not null references clients(id) on delete cascade,
  name        text not null,
  type        text not null,
  description text not null default '',
  html        text not null,
  created_at  timestamptz default now(),
  primary key (id, client_id)
);

-- Newsletters
create table if not exists newsletters (
  id          text primary key,
  name        text not null,
  client_id   text not null references clients(id) on delete cascade,
  blocks      jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Seed: Acme Store
insert into clients (id, name, color) values
  ('acme-store', 'Acme Store', '#6366f1'),
  ('nova-gym',   'Nova Gym',   '#ef4444')
on conflict (id) do nothing;

-- Seed: Acme Store blocks
insert into blocks (id, client_id, name, type, description, html) values
('header-logo', 'acme-store', 'Header s logem', 'header', 'Černý header s logem a navigací',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#111111;"><tr><td align="center" style="padding:24px 20px;"><table width="600" border="0" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;"><tr><td align="left" valign="middle" style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;">{{logo_text}}</td><td align="right" valign="middle" style="font-family:Arial,sans-serif;font-size:13px;color:#aaaaaa;"><a href="{{nav_link_1_url}}" style="color:#ffffff;text-decoration:none;margin-left:20px;">{{nav_link_1}}</a><a href="{{nav_link_2_url}}" style="color:#ffffff;text-decoration:none;margin-left:20px;">{{nav_link_2}}</a><a href="{{nav_link_3_url}}" style="color:#ffffff;text-decoration:none;margin-left:20px;">{{nav_link_3}}</a></td></tr></table></td></tr></table>'),
('text-block', 'acme-store', 'Textový blok', 'content', 'Jednoduchý odstavec textu',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;"><tr><td align="center" style="padding:32px 30px;"><table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;"><tr><td style="font-family:Arial,sans-serif;font-size:15px;color:#444444;line-height:1.7;"><h2 style="font-size:22px;color:#111111;margin:0 0 14px;">{{section_heading}}</h2><p style="margin:0;">{{body_text}}</p></td></tr></table></td></tr></table>'),
('divider', 'acme-store', 'Oddělovač', 'utility', 'Horizontální linka',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;"><tr><td style="padding:8px 30px;"><div style="height:1px;background:#e5e5e5;"></div></td></tr></table>'),
('spacer', 'acme-store', 'Mezera', 'utility', 'Prázdný prostor 40px',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;"><tr><td height="40" style="font-size:1px;line-height:1px;">&nbsp;</td></tr></table>'),
('footer', 'acme-store', 'Patička', 'footer', 'Standardní patička s adresou a odhlášením',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#111111;"><tr><td align="center" style="padding:32px 20px;"><table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;"><tr><td align="center" style="font-family:Arial,sans-serif;font-size:13px;color:#aaaaaa;line-height:1.8;"><p style="margin:0 0 8px;font-weight:bold;color:#ffffff;">{{company_name}}</p><p style="margin:0 0 16px;">{{company_address}}</p><p style="margin:0;"><a href="{{unsubscribe_url}}" style="color:#aaaaaa;text-decoration:underline;">Odhlásit odběr</a> &nbsp;&middot;&nbsp; <a href="{{webview_url}}" style="color:#aaaaaa;text-decoration:underline;">Zobrazit v prohlížeči</a></p></td></tr></table></td></tr></table>')
on conflict do nothing;

-- Seed: Nova Gym blocks
insert into blocks (id, client_id, name, type, description, html) values
('ng-header', 'nova-gym', 'Gym Header', 'header', 'Tmavý header s logem a sloganem',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:0;"><table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;"><tr><td align="left" valign="middle" style="padding:28px 30px 16px;"><span style="font-family:Arial,sans-serif;font-size:24px;font-weight:900;color:#ef4444;letter-spacing:-1px;">NOVA</span><span style="font-family:Arial,sans-serif;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-1px;"> GYM</span></td><td align="right" valign="middle" style="padding:28px 30px 16px;font-family:Arial,sans-serif;font-size:12px;color:#666666;"><a href="{{schedule_url}}" style="color:#ef4444;text-decoration:none;font-weight:bold;">Rozvrh hodin</a> &nbsp;&nbsp; <a href="{{membership_url}}" style="color:#ffffff;text-decoration:none;">Členství</a></td></tr><tr><td colspan="2" style="height:3px;background:linear-gradient(90deg,#ef4444,#ff6b35);"></td></tr></table></td></tr></table>'),
('ng-quote', 'nova-gym', 'Motivační citát', 'content', 'Velký motivační citát s autorem',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ef4444;"><tr><td align="center" style="padding:48px 40px;"><p style="font-family:Georgia,serif;font-size:26px;color:#ffffff;font-style:italic;line-height:1.4;margin:0 0 16px;">&#8220;{{quote_text}}&#8221;</p><p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);margin:0;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">— {{quote_author}}</p></td></tr></table>'),
('ng-footer', 'nova-gym', 'Gym Footer', 'footer', 'Patička s adresou a sociálními sítěmi',
'<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#0a0a0a;border-top:3px solid #ef4444;"><tr><td align="center" style="padding:32px 30px;"><table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;"><tr><td align="center" style="padding-bottom:16px;"><span style="font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#ef4444;">NOVA</span><span style="font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#ffffff;"> GYM</span></td></tr><tr><td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:#555555;line-height:1.8;padding-bottom:16px;">{{gym_address}}<br><a href="tel:{{gym_phone}}" style="color:#555555;text-decoration:none;">{{gym_phone}}</a></td></tr><tr><td align="center" style="font-family:Arial,sans-serif;font-size:11px;color:#444444;"><a href="{{unsubscribe_url}}" style="color:#444444;text-decoration:underline;">Odhlásit odběr</a></td></tr></table></td></tr></table>')
on conflict do nothing;

-- Seed: test newsletter
insert into newsletters (id, name, client_id, blocks, created_at, updated_at) values (
  'test-acme-store',
  'Test Newsletter — Duben 2026',
  'acme-store',
  '[{"instanceId":"header-logo-1","blockId":"header-logo","name":"Header s logem","type":"header","rawTemplate":"<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#111111;\"><tr><td align=\"center\" style=\"padding:24px 20px;\"><table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:600px;max-width:100%;\"><tr><td align=\"left\" valign=\"middle\" style=\"font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;\">{{logo_text}}</td><td align=\"right\" valign=\"middle\" style=\"font-family:Arial,sans-serif;font-size:13px;color:#aaaaaa;\"><a href=\"{{nav_link_1_url}}\" style=\"color:#ffffff;text-decoration:none;margin-left:20px;\">{{nav_link_1}}</a></td></tr></table></td></tr></table>","variables":{"logo_text":"Acme Store","nav_link_1_url":"#","nav_link_1":"Novinky"}},{"instanceId":"footer-1","blockId":"footer","name":"Patička","type":"footer","rawTemplate":"<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#111111;\"><tr><td align=\"center\" style=\"padding:32px 20px;\"><table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;\"><tr><td align=\"center\" style=\"font-family:Arial,sans-serif;font-size:13px;color:#aaaaaa;\"><p style=\"margin:0 0 8px;font-weight:bold;color:#ffffff;\">{{company_name}}</p><p style=\"margin:0;\"><a href=\"{{unsubscribe_url}}\" style=\"color:#aaaaaa;\">Odhlásit odběr</a></p></td></tr></table></td></tr></table>","variables":{"company_name":"Acme Store s.r.o.","unsubscribe_url":"#"}}]'::jsonb,
  '2026-04-19T08:00:00.000Z',
  '2026-04-19T08:00:00.000Z'
) on conflict (id) do nothing;
