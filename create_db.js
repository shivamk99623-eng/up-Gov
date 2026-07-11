#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

const dataDir = path.join(__dirname, 'data');
const outDir = path.join(__dirname, 'database');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const dbPath = path.join(outDir, 'data.db');
const db = new Database(dbPath);

/** Primary multi-sheet workbook (Constituency / Legislative / MLA / MP). */
const EXERCISE_XLSX = 'UP Constituency Data Exercise.xlsx';
/** Legacy assembly list — supplies district + assembly_code for merge. */
const LEGISLATIVE_LOOKUP_XLSX = 'UP_Legislative Assembly.xlsx';
/** Legacy single-sheet constituency file — skipped once EXERCISE_XLSX is present. */
const LEGACY_CONSTITUENCY_XLS = 'UP Constituency Data Exercise(Sheet1).xls';

const ASSEMBLY_NAME_ALIASES = {
  sikandepur: 'Sikanderpur',
  chhanvey: 'Chhanbey',
  kunderki: 'Kundarki',
  bishwavnathganj: 'Vishwanath Ganj',
  karchana: 'Karachhana',
  'bareilly cantt': 'Bareilly Cantt.',
};

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^\d+/, 't');
}

function inferType(values) {
  let hasFloat = false;
  let hasInt = false;
  let hasBool = false;
  let hasText = false;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'boolean') { hasBool = true; continue; }
    if (typeof v === 'number') {
      if (!Number.isInteger(v)) hasFloat = true; else hasInt = true;
      continue;
    }
    hasText = true;
  }
  if (hasText) return 'TEXT';
  if (hasFloat) return 'REAL';
  if (hasInt) return 'INTEGER';
  if (hasBool) return 'INTEGER';
  return 'TEXT';
}

function createTableFromRows(tableName, rows) {
  if (!rows || rows.length === 0) return;
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  if (exists) {
    console.log(`Table ${tableName} already exists`);
    return true;
  }
  const cols = new Set();
  rows.forEach(r => Object.keys(r || {}).forEach(k => cols.add(k)));
  const colList = Array.from(cols);
  const samples = {};
  colList.forEach(c => samples[c] = rows.map(r => (r && r[c] !== undefined) ? r[c] : null));
  const colDefs = colList.map(c => `"${c}" ${inferType(samples[c])}`);
  const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs.join(', ')})`;
  db.prepare(createSQL).run();

  const placeholders = colList.map(_ => '?').join(', ');
  const insertSQL = `INSERT INTO "${tableName}" (${colList.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
  const insertStmt = db.prepare(insertSQL);

  const insertMany = db.transaction((items) => {
    for (const it of items) {
      const vals = colList.map(c => {
        const v = it[c];
        if (v === undefined) return null;
        if (typeof v === 'object' && v !== null) return JSON.stringify(v);
        return v;
      });
      insertStmt.run(vals);
    }
  });
  insertMany(rows);
}

function replaceTableFromRows(tableName, rows) {
  db.prepare(`DROP TABLE IF EXISTS "${tableName}"`).run();
  createTableFromRows(tableName, rows);
}

function processJsonFile(filePath) {
  const name = path.basename(filePath, path.extname(filePath));
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (e) { console.error('Invalid JSON:', filePath); return; }
  if (!Array.isArray(data)) data = [data];
  const tableName = sanitizeName(name);
  createTableFromRows(tableName, data);
  console.log(`Imported JSON -> ${tableName}`);
}

function processXlsxFile(filePath) {
  const name = path.basename(filePath, path.extname(filePath));
  const workbook = XLSX.readFile(filePath);
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (!rows || rows.length === 0) return;
    const tableName = sanitizeName(`${name}_${sheetName}`);
    createTableFromRows(tableName, rows);
    console.log(`Imported XLSX -> ${tableName}`);
  });
}

function cellValue(row, idx) {
  let val = row[idx];
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    val = val.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
    return val || null;
  }
  return val;
}

function isNaCell(val) {
  if (val === null || val === undefined) return true;
  const s = String(val).trim().toUpperCase();
  return !s || s === 'NA' || s === '-' || s === 'N/A';
}

function normalizeMatchKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s*\((sc|st|general)\)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

function partyBlock(row, startCol) {
  return {
    jiladhyaksha: cellValue(row, startCol),
    mahanagar: cellValue(row, startCol + 1),
    mandal: cellValue(row, startCol + 2),
    jilapratinidhi: cellValue(row, startCol + 3),
    boothadhyaksha: cellValue(row, startCol + 4),
  };
}

/**
 * Normalized election block shared by constituency + legislative sheets.
 * layout:
 *  - 'pc' / 'ac_default': name, party, candidates, caste, winVotes, runnerName, runnerParty, runnerVotes, margin, totalVotes, exitPoll
 *  - 'ac_2022': name, party, candidates, totalVotes, caste, winVotes, runnerName, runnerParty, runnerVotes, margin, exitPoll
 */
function electionBlock(row, startCol, layout = 'pc') {
  if (layout === 'ac_2022') {
    return {
      winner_name: cellValue(row, startCol),
      winner_party: cellValue(row, startCol + 1),
      total_candidates: cellValue(row, startCol + 2),
      total_votes_polled: cellValue(row, startCol + 3),
      winning_candidate_caste: cellValue(row, startCol + 4),
      winning_candidate_votes: cellValue(row, startCol + 5),
      runner_up_name: cellValue(row, startCol + 6),
      runner_up_party: cellValue(row, startCol + 7),
      runner_up_votes: cellValue(row, startCol + 8),
      winning_margin: cellValue(row, startCol + 9),
      exit_poll_results: cellValue(row, startCol + 10),
    };
  }

  return {
    winner_name: cellValue(row, startCol),
    winner_party: cellValue(row, startCol + 1),
    total_candidates: cellValue(row, startCol + 2),
    winning_candidate_caste: cellValue(row, startCol + 3),
    winning_candidate_votes: cellValue(row, startCol + 4),
    runner_up_name: cellValue(row, startCol + 5),
    runner_up_party: cellValue(row, startCol + 6),
    runner_up_votes: cellValue(row, startCol + 7),
    winning_margin: cellValue(row, startCol + 8),
    total_votes_polled: cellValue(row, startCol + 9),
    exit_poll_results: cellValue(row, startCol + 10),
  };
}

function personElectionResult(row, startCol) {
  const party = cellValue(row, startCol);
  const winLose = cellValue(row, startCol + 1);
  const margin = cellValue(row, startCol + 2);
  if (isNaCell(party) && isNaCell(winLose) && isNaCell(margin)) {
    return null;
  }
  return {
    party: isNaCell(party) ? null : party,
    win_lose: isNaCell(winLose) ? null : winLose,
    margin: isNaCell(margin) ? null : margin,
  };
}

function demographicsTriple(row, startCol) {
  return {
    most_populated: cellValue(row, startCol),
    second_majority: cellValue(row, startCol + 1),
    rest: cellValue(row, startCol + 2),
  };
}

function collectSegments(row, startCol, endCol) {
  const segments = [];
  for (let i = startCol; i <= endCol; i++) {
    const seg = cellValue(row, i);
    if (seg && !isNaCell(seg)) segments.push(seg);
  }
  return segments;
}

function loadExerciseWorkbook() {
  const filePath = path.join(dataDir, EXERCISE_XLSX);
  if (!fs.existsSync(filePath)) {
    console.warn('Exercise XLSX not found:', filePath);
    return null;
  }
  return XLSX.readFile(filePath);
}

function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn('Sheet not found:', sheetName);
    return [];
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });
}

function loadLegacyLegislativeLookup() {
  const filePath = path.join(dataDir, LEGISLATIVE_LOOKUP_XLSX);
  const byExact = new Map();
  const byNorm = new Map();
  if (!fs.existsSync(filePath)) {
    console.warn('Legacy legislative XLSX not found (district/code merge skipped):', filePath);
    return { byExact, byNorm };
  }

  const workbook = XLSX.readFile(filePath);
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null });
  for (const row of rawRows) {
    if (row.Assembly == null || String(row.Assembly).trim() === '') continue;
    const assembly = String(row.Assembly).trim();
    const meta = {
      district: row.Distrit ?? null,
      assembly_code: row.__EMPTY ?? null,
      reservation: row.Reservation ?? null,
    };
    byExact.set(assembly.toLowerCase(), meta);
    byNorm.set(normalizeMatchKey(assembly), meta);
  }
  return { byExact, byNorm };
}

function resolveLegacyAssemblyMeta(assemblyName, lookup) {
  if (!assemblyName) return null;
  const lower = assemblyName.toLowerCase();
  if (lookup.byExact.has(lower)) return lookup.byExact.get(lower);

  const alias = ASSEMBLY_NAME_ALIASES[lower] || ASSEMBLY_NAME_ALIASES[normalizeMatchKey(assemblyName)];
  if (alias) {
    const aliasLower = alias.toLowerCase();
    if (lookup.byExact.has(aliasLower)) return lookup.byExact.get(aliasLower);
    const aliasNorm = normalizeMatchKey(alias);
    if (lookup.byNorm.has(aliasNorm)) return lookup.byNorm.get(aliasNorm);
  }

  const norm = normalizeMatchKey(assemblyName);
  if (lookup.byNorm.has(norm)) return lookup.byNorm.get(norm);
  return null;
}

function rowToConstituencyRecord(row) {
  return {
    sr_no: cellValue(row, 0),
    person_allotted_to: cellValue(row, 1),
    constituency_name: cellValue(row, 2),
    reservation_status: cellValue(row, 3),
    assembly_segments: JSON.stringify(collectSegments(row, 4, 13)),
    total_population: cellValue(row, 14),
    caste: JSON.stringify(demographicsTriple(row, 15)),
    election_2024: JSON.stringify(electionBlock(row, 18, 'pc')),
    election_2019: JSON.stringify(electionBlock(row, 29, 'pc')),
    election_2014: JSON.stringify(electionBlock(row, 40, 'pc')),
    election_2009: JSON.stringify(electionBlock(row, 51, 'pc')),
    election_2004: JSON.stringify(electionBlock(row, 62, 'pc')),
    party_organization: JSON.stringify({
      bjp: partyBlock(row, 73),
      sp: partyBlock(row, 78),
      bsp: partyBlock(row, 83),
      inc: partyBlock(row, 88),
    }),
  };
}

function rowToLegislativeRecord(row, legacyLookup) {
  const assembly = cellValue(row, 2);
  const legacy = resolveLegacyAssemblyMeta(assembly, legacyLookup);
  return {
    sr_no: cellValue(row, 0),
    person_allotted_to: cellValue(row, 1),
    assembly,
    reservation: cellValue(row, 3) ?? legacy?.reservation ?? null,
    district: legacy?.district ?? null,
    assembly_code: legacy?.assembly_code ?? null,
    total_population: cellValue(row, 4),
    religion: JSON.stringify(demographicsTriple(row, 5)),
    caste: JSON.stringify(demographicsTriple(row, 8)),
    election_2022: JSON.stringify(electionBlock(row, 11, 'ac_2022')),
    election_2017: JSON.stringify(electionBlock(row, 22, 'ac_default')),
    election_2012: JSON.stringify(electionBlock(row, 33, 'ac_default')),
    election_2007: JSON.stringify(electionBlock(row, 44, 'ac_default')),
    election_2002: JSON.stringify(electionBlock(row, 55, 'ac_default')),
    party_organization: JSON.stringify({
      bjp: partyBlock(row, 66),
      sp: partyBlock(row, 71),
      bsp: partyBlock(row, 76),
      inc: partyBlock(row, 81),
    }),
  };
}

function rowToMlaRecord(row) {
  return {
    sr_no: cellValue(row, 0),
    person_allotted_to: cellValue(row, 1),
    mla_name: cellValue(row, 2),
    caste: cellValue(row, 3),
    election_2022: JSON.stringify(personElectionResult(row, 4)),
    election_2017: JSON.stringify(personElectionResult(row, 7)),
    election_2012: JSON.stringify(personElectionResult(row, 10)),
    election_2007: JSON.stringify(personElectionResult(row, 13)),
    election_2002: JSON.stringify(personElectionResult(row, 16)),
  };
}

function rowToMpRecord(row) {
  return {
    sr_no: cellValue(row, 0),
    person_allotted_to: cellValue(row, 1),
    mp_name: cellValue(row, 2),
    caste: cellValue(row, 3),
    election_2024: JSON.stringify(personElectionResult(row, 4)),
    election_2019: JSON.stringify(personElectionResult(row, 7)),
    election_2014: JSON.stringify(personElectionResult(row, 10)),
    election_2009: JSON.stringify(personElectionResult(row, 13)),
    election_2004: JSON.stringify(personElectionResult(row, 16)),
  };
}

function createConstituencyTable(workbook) {
  const rawRows = sheetRows(workbook, 'Constituency Data');
  const rows = rawRows
    .slice(3)
    .filter((row) => row[2] != null && String(row[2]).trim() !== '')
    .map(rowToConstituencyRecord);

  replaceTableFromRows('constituency', rows);
  console.log(`Imported constituency table (${rows.length} rows) from ${EXERCISE_XLSX} / Constituency Data`);
}

function createUpLegislativeTable(workbook) {
  const legacyLookup = loadLegacyLegislativeLookup();
  const rawRows = sheetRows(workbook, 'Legislative Assembly Data');
  const rows = rawRows
    .slice(3)
    .filter((row) => {
      const name = row[2];
      if (name == null || String(name).trim() === '') return false;
      // Skip corrupted rows where a number landed in the Assembly Name column
      if (/^\d+(\.\d+)?$/.test(String(name).trim())) return false;
      return true;
    })
    .map((row) => rowToLegislativeRecord(row, legacyLookup));

  const withDistrict = rows.filter((r) => r.district).length;
  replaceTableFromRows('Up_legislative', rows);
  console.log(
    `Imported Up_legislative table (${rows.length} rows, ${withDistrict} with district/code merge) from ${EXERCISE_XLSX} + ${LEGISLATIVE_LOOKUP_XLSX}`,
  );
}

function createMlaDataTable(workbook) {
  const rawRows = sheetRows(workbook, 'MLA Data');
  const rows = rawRows
    .slice(2)
    .filter((row) => row[2] != null && String(row[2]).trim() !== '')
    .map(rowToMlaRecord);

  replaceTableFromRows('mla_data', rows);
  console.log(`Imported mla_data table (${rows.length} rows) from ${EXERCISE_XLSX} / MLA Data`);
}

function createMpLokSabhaDataTable(workbook) {
  const rawRows = sheetRows(workbook, 'MP(Lok Sabha) Data');
  const rows = rawRows
    .slice(2)
    .filter((row) => row[2] != null && String(row[2]).trim() !== '')
    .map(rowToMpRecord);

  replaceTableFromRows('mp_lok_sabha_data', rows);
  console.log(`Imported mp_lok_sabha_data table (${rows.length} rows) from ${EXERCISE_XLSX} / MP(Lok Sabha) Data`);
}

function main() {
  const SKIP_FILES = new Set([
    EXERCISE_XLSX,
    LEGISLATIVE_LOOKUP_XLSX,
    LEGACY_CONSTITUENCY_XLS,
  ]);

  function createMP_MLA_ConstituencyTable() {
    const files = fs.readdirSync(dataDir);
    for (const f of files) {
      const full = path.join(dataDir, f);
      const stat = fs.statSync(full);
      if (!stat.isFile()) continue;
      if (SKIP_FILES.has(f)) continue;
      const ext = path.extname(f).toLowerCase();
      try {
        if (ext === '.json') processJsonFile(full);
        else if (ext === '.xlsx' || ext === '.xls' || ext === '.xlsm') processXlsxFile(full);
        else console.log('Skipping unsupported file:', f);
      } catch (err) {
        console.error('Failed processing', f, err.message);
      }
    }
  }

  function createDummyNewsTables() {
    const commonCols = [
      '"Heading" TEXT',
      '"newsId" TEXT UNIQUE',
      '"Summary" TEXT',
      '"CreatedAt" TEXT',
      '"CCM" TEXT',
      '"Content" TEXT',
      '"Language" TEXT',
      '"Sentiment" TEXT',
      '"Authors" TEXT',
      '"District" TEXT',
      '"Constituency" TEXT',
      '"MLA" TEXT',
      '"Loksabha_MP" TEXT',
      '"Rajyasabha_MP" TEXT'
    ];

    function createTable(name, extraCols, rows) {
      const cols = commonCols.concat(extraCols || []);
      const createSQL = `CREATE TABLE IF NOT EXISTS "${name}" (${cols.join(', ')})`;
      db.prepare(createSQL).run();
      if (!rows || rows.length === 0) return;
      const colNames = cols.map(c => c.split(' ')[0]);
      const placeholders = colNames.map(_ => '?').join(', ');
      const insertSQL = `INSERT OR IGNORE INTO "${name}" (${colNames.join(', ')}) VALUES (${placeholders})`;
      const insert = db.prepare(insertSQL);
      const tx = db.transaction((items) => {
        for (const it of items) {
          const vals = colNames.map(cn => {
            const key = cn.replace(/\"/g, '');
            let v = it[key];
            if (v === undefined) return null;
            if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
            return v;
          });
          insert.run(vals);
        }
      });
      tx(rows);
    }

    void createTable;
  }

  function createDistrictsTable() {
    const geoPath = path.join(__dirname, 'public', 'geo', 'up-districts.geojson');
    if (!fs.existsSync(geoPath)) { console.warn('GeoJSON not found:', geoPath); return; }
    let gdata;
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get('districts');
    if (exists) {
      console.log('Districts table already exists');
      return;
    }
    try { gdata = JSON.parse(fs.readFileSync(geoPath, 'utf8')); } catch (e) { console.error('Invalid GeoJSON', e.message); return; }
    if (!Array.isArray(gdata.features)) return;
    db.prepare(`CREATE TABLE IF NOT EXISTS districts (
      dt_code TEXT,
      district TEXT,
      st_code TEXT,
      year TEXT,
      st_nm TEXT,
      geometry TEXT,
      properties TEXT
    )`).run();

    const insert = db.prepare('INSERT INTO districts (dt_code, district, st_code, year, st_nm, geometry, properties) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const tx = db.transaction((features) => {
      for (const f of features) {
        const p = f.properties || {};
        insert.run(p.dt_code || null, p.district || p.DISTRICT || null, p.st_code || null, p.year || null, p.st_nm || null, JSON.stringify(f.geometry || null), JSON.stringify(p));
      }
    });
    tx(gdata.features);
    console.log('Inserted', gdata.features.length, 'districts');
  }

  function createRepresentativesTable() {
    const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.json'));
    db.prepare(`CREATE TABLE IF NOT EXISTS representatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      chamber TEXT,
      constituency TEXT,
      party TEXT,
      bio TEXT
    )`).run();

    const insert = db.prepare('INSERT INTO representatives (name, chamber, constituency, party, bio) VALUES (?, ?, ?, ?, ?)');
    const tx = db.transaction((items) => {
      for (const it of items) insert.run(it.name || null, it.chamber || null, it.constituency || null, it.party || null, JSON.stringify(it.raw || {}));
    });

    const collected = [];
    for (const f of files) {
      const full = path.join(dataDir, f);
      let raw;
      try { raw = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) { console.warn('Skipping invalid JSON', f); continue; }
      let arr = Array.isArray(raw) ? raw : [raw];
      let chamber = 'other';
      const lf = f.toLowerCase();
      if (lf.includes('lok')) chamber = 'loksabha';
      else if (lf.includes('rajya')) chamber = 'rajyasabha';
      else if (lf.includes('mla')) chamber = 'mla';

      for (const rec of arr) {
        const name = rec.name || rec.Name || rec.member_name || rec.full_name || rec['Member Name'] || rec['memberName'] || null;
        const constituency = rec.constituency || rec.constituency_name || rec['Constituency'] || rec['constituencyName'] || null;
        const party = rec.party || rec.Party || rec['Political Party'] || null;
        collected.push({ name, chamber, constituency, party, raw: rec });
      }
    }
    tx(collected);
    console.log('Inserted', collected.length, 'representatives');
  }

  try {
    const workbook = loadExerciseWorkbook();
    if (workbook) {
      createConstituencyTable(workbook);
      createUpLegislativeTable(workbook);
      createMlaDataTable(workbook);
      createMpLokSabhaDataTable(workbook);
    } else {
      console.warn('Skipping exercise workbook imports — file missing');
    }
    createDistrictsTable();
    // Media tables (news_*) are intentionally not touched.
    createMP_MLA_ConstituencyTable();
    console.log('Constituency, legislative, MLA/MP, districts and bio tables created/updated (media tables untouched).');
  } catch (e) {
    console.error('Failed constituency/district/rep processing:', e.message);
    console.error(e.stack);
  }

  try {
    const { createIndexes } = require('./create_indexes');
    createIndexes(db);
  } catch (e) {
    console.error('Failed creating indexes:', e.message);
  }

  db.close();
  console.log('Done. SQLite DB created at', dbPath);
}

main();
