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
  // stop if table exists
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

const CONSTITUENCY_XLS = 'UP Constituency Data Exercise(Sheet1).xls';

function cellValue(row, idx) {
  let val = row[idx];
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    val = val.trim();
    return val || null;
  }
  return val;
}

function rowToConstituencyRecord(row) {
  const assemblySegments = [];
  for (let i = 4; i <= 15; i++) {
    const seg = cellValue(row, i);
    if (seg) assemblySegments.push(seg);
  }

  function electionBlock(startCol) {
    return {
      winner_name: cellValue(row, startCol),
      winner_party: cellValue(row, startCol + 1),
      total_candidates: cellValue(row, startCol + 2),
      total_votes_polled: cellValue(row, startCol + 3),
      exit_poll_results: cellValue(row, startCol + 4),
    };
  }

  function partyBlock(startCol) {
    return {
      jiladhyaksha: cellValue(row, startCol),
      mahanagar: cellValue(row, startCol + 1),
      mandal: cellValue(row, startCol + 2),
      jilapratinidhi: cellValue(row, startCol + 3),
      boothadhyaksha: cellValue(row, startCol + 4),
    };
  }

  return {
    sr_no: cellValue(row, 0),
    person_allotted_to: cellValue(row, 1),
    constituency_name: cellValue(row, 2),
    reservation_status: cellValue(row, 3),
    assembly_segments: JSON.stringify(assemblySegments),
    total_population: cellValue(row, 16),
    caste: JSON.stringify({
      most_populated: cellValue(row, 17),
      second_majority: cellValue(row, 18),
      rest: cellValue(row, 19),
    }),
    election_2024: JSON.stringify(electionBlock(20)),
    election_2019: JSON.stringify(electionBlock(25)),
    election_2014: JSON.stringify(electionBlock(30)),
    election_2009: JSON.stringify(electionBlock(35)),
    election_2004: JSON.stringify(electionBlock(40)),
    party_organization: JSON.stringify({
      bjp: partyBlock(45),
      sp: partyBlock(50),
      bsp: partyBlock(55),
      inc: partyBlock(60),
    }),
  };
}

function createConstituencyTable() {
  const filePath = path.join(dataDir, CONSTITUENCY_XLS);
  if (!fs.existsSync(filePath)) {
    console.warn('Constituency XLS not found:', filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });
  const rows = rawRows
    .slice(3)
    .filter((row) => row[2] != null && String(row[2]).trim() !== '')
    .map(rowToConstituencyRecord);

  db.prepare('DROP TABLE IF EXISTS constituency').run();
  createTableFromRows('constituency', rows);
  console.log(`Imported constituency table (${rows.length} rows) from ${CONSTITUENCY_XLS}`);
}

function main() {
  function createMP_MLA_ConstituencyTable() {
    const files = fs.readdirSync(dataDir);
    for (const f of files) {
      const full = path.join(dataDir, f);
      const stat = fs.statSync(full);
      if (!stat.isFile()) continue;
      if (f === CONSTITUENCY_XLS) continue;
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



  // // create four news tables with dummy data
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

    // helper to create table and insert rows
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

    //   // sample rows
    //   const sampleDistricts = ['District A', 'District B'];
    //   const sampleConstituencies = ['Constituency 1'];

    // createTable('news_print', ['"Publication" TEXT', '"Edition" TEXT'], [
    //   {
    //     Heading: 'Print: Sample headline 1',
    //     newsId: 'print-1',
    //     Summary: 'Summary for print 1',
    //     CreatedAt: new Date().toISOString(),
    //     CCM: 'ccm1',
    //     Content: 'Full content of print 1',
    //     Language: 'Hindi',
    //     Sentiment: 'Neutral',
    //     Authors: 'Reporter A',
    //     District: sampleDistricts,
    //     Constituency: sampleConstituencies,
    //     MLA: ['MLA A'],
    //     Loksabha_MP: ['MP A'],
    //     Rajyasabha_MP: ['RS A'],
    //     Publication: 'Daily Times',
    //     Edition: 'Morning'
    //   },
    //   {
    //     Heading: 'Print: Sample headline 2',
    //     newsId: 'print-2',
    //     Summary: 'Summary for print 2',
    //     CreatedAt: new Date().toISOString(),
    //     CCM: 'ccm2',
    //     Content: 'Full content of print 2',
    //     Language: 'English',
    //     Sentiment: 'Positive',
    //     Authors: 'Reporter B',
    //     District: ['District C'],
    //     Constituency: ['Constituency 2'],
    //     MLA: ['MLA B'],
    //     Loksabha_MP: ['MP B'],
    //     Rajyasabha_MP: ['RS B'],
    //     Publication: 'Evening News',
    //     Edition: 'Evening'
    //   }
    // ]);

    // createTable('news_online', ['"website" TEXT', '"link" TEXT'], [
    //   {
    //     Heading: 'Online: Sample headline 1',
    //     newsId: 'online-1',
    //     Summary: 'Online summary 1',
    //     CreatedAt: new Date().toISOString(),
    //     CCM: 'ccm-o1',
    //     Content: 'Online content 1',
    //     Language: 'Hindi',
    //     Sentiment: 'Negative',
    //     Authors: 'Author O',
    //     District: sampleDistricts,
    //     Constituency: sampleConstituencies,
    //     MLA: ['MLA X'],
    //     Loksabha_MP: ['MP X'],
    //     Rajyasabha_MP: ['RS X'],
    //     website: 'Aaj Tak',
    //     link: 'https://example.com'
    //   }
    // ]);

    // createTable('news_x', ['"handles" TEXT', '"link" TEXT'], [
    //   {
    //     Heading: 'X: Sample headline',
    //     newsId: 'x-1',
    //     Summary: 'X summary',
    //     CreatedAt: new Date().toISOString(),
    //     CCM: 'ccm-x',
    //     Content: 'X post content',
    //     Language: 'English',
    //     Sentiment: 'Neutral',
    //     Authors: 'UserX',
    //     District: ["District X"],
    //     Constituency: ["Constituency X"],
    //     MLA: ['MLA X'],
    //     Loksabha_MP: ['MP X'],
    //     Rajyasabha_MP: ['RS X'],
    //     handles: '@example',
    //     link: 'https://example.com'
    //   }
    // ]);

    // createTable('news_youtube', ['"channel" TEXT', '"duration" TEXT', '"link" TEXT'], [
    //   {
    //     Heading: 'YouTube: Sample video',
    //     newsId: 'yt-1',
    //     Summary: 'Video summary',
    //     CreatedAt: new Date().toISOString(),
    //     Content: 'Video description',
    //     Language: 'Hindi',
    //     Sentiment: 'Positive',
    //     District: ["District X"],
    //     Constituency: ["Constituency X"],
    //     MLA: ['MLA X'],
    //     Loksabha_MP: ['MP X'],
    //     Rajyasabha_MP: ['RS X'],
    //     channel: 'NewsChannel',
    //     duration: '12:34',
    //     link: 'https://example.com'
    //   }
    // ]);


    // try {
    //   createDummyNewsTables();
    //   console.log('Inserted dummy news tables.');
    // } catch (e) {
    //   console.error('Failed creating dummy tables:', e.message);
    // }
  }

  // create districts table from GeoJSON and update news rows' District column
  function createDistrictsTable() {
    const geoPath = path.join(__dirname, 'public', 'geo', 'up-districts.geojson');
    if (!fs.existsSync(geoPath)) { console.warn('GeoJSON not found:', geoPath); return; }
    let gdata;
    // stop if table exists
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

  // function updateNewsDistricts() {
  //   const tables = ['news_print','news_online','news_x','news_youtube'];
  //   const findStmt = db.prepare('SELECT dt_code,district FROM districts WHERE lower(district)=lower(?) LIMIT 1');
  //   for (const t of tables) {
  //     const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
  //     if (!exists) continue;
  //     const rows = db.prepare(`SELECT rowid, District FROM "${t}"`).all();
  //     const update = db.prepare(`UPDATE "${t}" SET "District" = ? WHERE rowid = ?`);
  //     const tx = db.transaction((items) => {
  //       for (const r of items) {
  //         let d = r.District;
  //         if (!d) continue;
  //         try { d = JSON.parse(d); } catch (e) { /* keep as-is */ }
  //         if (!Array.isArray(d)) d = [d];
  //         const out = [];
  //         for (const name of d) {
  //           if (!name) continue;
  //           const m = findStmt.get(String(name));
  //           if (m) out.push({ dt_code: m.dt_code, district: m.district });
  //           else out.push({ district: name });
  //         }
  //         update.run(JSON.stringify(out), r.rowid);
  //       }
  //     });
  //     tx(rows);
  //     console.log('Updated Districts for', t);
  //   }
  // }

  // merge Loksabha, Rajya and MLA members into `representatives` table
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
        // best-effort name/constituency/party extraction
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
    createConstituencyTable();
    createDistrictsTable();
    // createDummyNewsTables();
    createMP_MLA_ConstituencyTable();
    console.log('Constituency, districts and representatives created/updated.');
  } catch (e) {
    console.error('Failed constituency/district/rep processing:', e.message);
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
