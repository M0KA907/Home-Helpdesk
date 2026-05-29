/**
 * Home Helpdesk receiver for Google Apps Script.
 *
 * Private values are stored in Script Properties, not in the public GitHub repo.
 *
 * Required Script Properties:
 * - SHEET_ID: target Google Sheet ID
 * - SUBMIT_KEY: long random shared submit key
 */

const DEFAULTS = {
  SHEET_NAME: 'Tickets',
  POW_PREFIX: '000',
  MIN_FORM_AGE_MS: 5000,
  MAX_FORM_AGE_MS: 2700000
};

const HEADERS = [
  'Ticket ID', 'Submitted At', 'Name', 'Issue', 'Severity', 'Status',
  'Parsed Summary', 'Device Guess', 'Signals', 'Visitor ID', 'Proof Digest',
  'Notes', 'Resolved At'
];

function doGet() {
  return HtmlService.createHtmlOutput('<h1>Home Helpdesk receiver online.</h1>');
}

function doPost(e) {
  try {
    setup();
    const result = submitIssue_(e && e.parameter ? e.parameter : {});
    return HtmlService.createHtmlOutput('<h1>Sent.</h1><p>Ticket <b>' + escapeHtml_(result.ticketId) + '</b> was saved.</p>');
  } catch (err) {
    return HtmlService.createHtmlOutput('<h1>Rejected.</h1><p>' + escapeHtml_(err.message || String(err)) + '</p>');
  }
}

function setup() {
  const props = getProps_();
  if (!props.SHEET_ID) throw new Error('Missing Script Property: SHEET_ID');
  if (!props.SUBMIT_KEY) throw new Error('Missing Script Property: SUBMIT_KEY');
  const sheet = getSheet_();
  initializeSheet_(sheet);
  return { ok: true, sheetUrl: SpreadsheetApp.openById(props.SHEET_ID).getUrl() };
}

function submitIssue_(payload) {
  validatePayload_(payload);
  const name = clean_(payload.name) || 'Household';
  const issue = cleanLong_(payload.issue);
  const visitorId = clean_(payload.visitor_id);
  const now = new Date();
  const parsed = parseIssue_(issue);
  const ticketId = makeTicketId_(now);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    rateLimit_(visitorId, issue);
    const sheet = getSheet_();
    sheet.appendRow([
      ticketId, now, name, issue, parsed.severity, 'Open', parsed.summary,
      parsed.deviceGuess, parsed.signals.join(', '), visitorId, clean_(payload.pow_digest), '', ''
    ]);
    styleRow_(sheet, sheet.getLastRow(), parsed.severity);
    const props = getProps_();
    if (props.OWNER_EMAIL) {
      MailApp.sendEmail({
        to: props.OWNER_EMAIL,
        subject: '[' + parsed.severity + '] ' + ticketId + ' - Home Helpdesk',
        body: ['Ticket: ' + ticketId, 'Name: ' + name, 'Severity: ' + parsed.severity, 'Device guess: ' + parsed.deviceGuess, '', 'Issue:', issue, '', 'Signals: ' + parsed.signals.join(', ')].join('\n')
      });
    }
    return { ok: true, ticketId: ticketId, severity: parsed.severity };
  } finally {
    lock.releaseLock();
  }
}

function validatePayload_(payload) {
  const props = getProps_();
  if (!payload) throw new Error('Missing payload.');
  if (clean_(payload.submit_key) !== props.SUBMIT_KEY) throw new Error('Bad submit key.');
  ['company', 'website', 'email_confirm'].forEach(function(name) {
    if (clean_(payload[name])) throw new Error('Bot trap triggered.');
  });
  const issue = cleanLong_(payload.issue);
  if (!issue || issue.length < 5) throw new Error('Issue is too short.');
  if (issue.length > 2400) throw new Error('Issue is too long.');
  const startedAt = Number(payload.started_at || 0);
  const age = Date.now() - startedAt;
  const minAge = Number(props.MIN_FORM_AGE_MS || DEFAULTS.MIN_FORM_AGE_MS);
  const maxAge = Number(props.MAX_FORM_AGE_MS || DEFAULTS.MAX_FORM_AGE_MS);
  if (!startedAt || age < minAge) throw new Error('Form submitted too quickly.');
  if (age > maxAge) throw new Error('Form expired. Reload and try again.');
  const a = Number(payload.challenge_a);
  const b = Number(payload.challenge_b);
  const op = String(payload.challenge_op || '');
  const expected = op === '+' ? a + b : a - b;
  if (Number(payload.challenge_answer) !== expected) throw new Error('Challenge payload invalid.');
  const powPrefix = String(props.POW_PREFIX || DEFAULTS.POW_PREFIX);
  const visitorId = clean_(payload.visitor_id);
  const nonce = clean_(payload.pow_nonce);
  const digest = clean_(payload.pow_digest);
  const recomputed = sha256Hex_(visitorId + ':' + payload.started_at + ':' + nonce);
  if (!visitorId || !nonce || !digest) throw new Error('Proof-of-work missing.');
  if (digest !== recomputed || !digest.startsWith(powPrefix)) throw new Error('Proof-of-work invalid.');
}

function rateLimit_(visitorId, issue) {
  const cache = CacheService.getScriptCache();
  const visitorKey = 'visitor:' + sha256Hex_(visitorId || 'unknown').slice(0, 24);
  const issueKey = 'issue:' + sha256Hex_(issue).slice(0, 24);
  if (cache.get(visitorKey)) throw new Error('Slow down. Try again in a minute.');
  if (cache.get(issueKey)) throw new Error('Duplicate report detected.');
  cache.put(visitorKey, '1', 60);
  cache.put(issueKey, '1', 300);
}

function getProps_() {
  return PropertiesService.getScriptProperties().getProperties();
}

function getSheet_() {
  const props = getProps_();
  const ss = SpreadsheetApp.openById(props.SHEET_ID);
  const name = props.SHEET_NAME || DEFAULTS.SHEET_NAME;
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function initializeSheet_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]).setFontWeight('bold').setFontColor('#080705').setBackground('#f7e85a').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  [150,170,120,520,130,120,360,160,240,220,240,320,160].forEach(function(width, i) { sheet.setColumnWidth(i + 1, width); });
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), HEADERS.length).setWrap(true).setVerticalAlignment('top');
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['Open', 'Waiting', 'In Progress', 'Resolved', 'Ignored'], true).setAllowInvalid(false).build();
  sheet.getRange(2, 6, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);
  applyConditionalFormatting_(sheet);
}

function applyConditionalFormatting_(sheet) {
  const range = sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), HEADERS.length);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Emergency"').setBackground('#4a1015').setFontColor('#fff1f2').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="High"').setBackground('#3b2508').setFontColor('#fff7ed').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Normal"').setBackground('#13213f').setFontColor('#eff6ff').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Low"').setBackground('#10291d').setFontColor('#ecfdf5').setRanges([range]).build()
  ];
  sheet.setConditionalFormatRules(rules);
}

function styleRow_(sheet, row, severity) {
  const colors = { Emergency: ['#4a1015', '#fff1f2'], High: ['#3b2508', '#fff7ed'], Normal: ['#13213f', '#eff6ff'], Low: ['#10291d', '#ecfdf5'] };
  const c = colors[severity] || colors.Normal;
  sheet.getRange(row, 1, 1, HEADERS.length).setBackground(c[0]).setFontColor(c[1]).setWrap(true).setVerticalAlignment('top');
}

function parseIssue_(issue) {
  const t = issue.toLowerCase();
  let score = 0;
  const signals = [];
  const rules = [
    ['possible fire/electrical danger', 100, /\b(fire|smoke|burning|spark|sparking|shock|melted|hot plug|smells hot|overheating)\b/],
    ['possible scam/security issue', 75, /\b(scam|hacked|virus|malware|phishing|bank|password|stolen|fraud|locked out|account)\b/],
    ['internet/wifi outage', 45, /\b(internet|wifi|wi-fi|router|modem|network|offline|no connection|down)\b/],
    ['work or urgent blocker', 35, /\b(work|meeting|job|school|appointment|urgent|today|right now|asap)\b/],
    ['computer unusable', 35, /\b(won't turn on|will not turn on|won't start|will not start|black screen|blue screen|frozen|dead|crashing|crash)\b/],
    ['file/storage problem', 30, /\b(file|files|deleted|lost|backup|drive|storage|not saving)\b/],
    ['printer/scanner issue', 18, /\b(printer|printing|print|scanner|scanning|scan)\b/],
    ['slow/minor issue', 5, /\b(slow|laggy|annoying|weird|question|minor)\b/]
  ];
  rules.forEach(function(rule) { if (rule[2].test(t)) { score += rule[1]; signals.push(rule[0]); } });
  let severity = 'Low';
  if (score >= 100) severity = 'Emergency';
  else if (score >= 60) severity = 'High';
  else if (score >= 20) severity = 'Normal';
  if (!signals.length) signals.push('general issue');
  return { severity: severity, signals: signals, summary: issue.replace(/\s+/g, ' ').slice(0, 160), deviceGuess: guessDevice_(t) };
}

function guessDevice_(t) {
  const guesses = [
    ['Router / internet', /\b(router|modem|wifi|wi-fi|internet|network)\b/],
    ['Printer / scanner', /\b(printer|printing|scanner|scan)\b/],
    ['Computer', /\b(computer|pc|laptop|desktop|windows|mac|chromebook)\b/],
    ['Phone / tablet', /\b(phone|iphone|android|tablet|ipad)\b/],
    ['TV / streaming', /\b(tv|roku|fire stick|chromecast|netflix|hulu|youtube)\b/],
    ['Email / account', /\b(email|gmail|account|login|password)\b/]
  ];
  const found = guesses.find(function(row) { return row[1].test(t); });
  return found ? found[0] : 'Unknown';
}

function makeTicketId_(date) {
  return 'HOME-' + Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyMMdd-HHmm') + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function sha256Hex_(text) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return raw.map(function(b) { const v = b < 0 ? b + 256 : b; return ('0' + v.toString(16)).slice(-2); }).join('');
}

function clean_(value) { return String(value || '').trim().slice(0, 240); }
function cleanLong_(value) { return String(value || '').trim().replace(/\r\n/g, '\n').slice(0, 3000); }
function escapeHtml_(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
