const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("./database.db");

let sql = `SELECT * from news_articles;`;

db.all(sql, (err, rows) => {
    if (err) {
        console.log(err);
    }
    console.log(rows);
});

// app.get("/mp", (req, res) => {

//     let sql = `show tables`;

//     db.all(sql, (err, rows) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         console.log(rows);
//     });
// //   const mpSql = `
// //     SELECT
// //       id,
// //       isRajyaSabhaMember,
// //       mpsno,
// //       fullName,
// //       constituency,
// //       partyFname,
// //       partySname,
// //       dateOfBirth,
// //       qualificationName,
// //       education,
// //       ProfessionName
// //     FROM mp
// //     ORDER BY id
// //   `;

// //   const positionSql = `
// //     SELECT id, mp_id, period, position
// //     FROM mp_position
// //     ORDER BY mp_id, id
// //   `;

// //   db.all(mpSql, (err, mps) => {
// //     if (err) {
// //       return res.status(500).json({ error: err.message });
// //     }

// //     db.all(positionSql, (posErr, positions) => {
// //       if (posErr) {
// //         return res.status(500).json({ error: posErr.message });
// //       }

// //       const positionsByMpId = positions.reduce((acc, row) => {
// //         if (!acc[row.mp_id]) acc[row.mp_id] = [];
// //         acc[row.mp_id].push({
// //           id: row.id,
// //           period: row.period,
// //           position: row.position,
// //         });
// //         return acc;
// //       }, {});

// //       const result = mps.map((mp) => ({
// //         ...mp,
// //         isRajyaSabhaMember: Boolean(mp.isRajyaSabhaMember),
// //         position: positionsByMpId[mp.id] ?? [],
// //       }));

// //       res.json(result);
// //     });
// //   });
// });

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });
