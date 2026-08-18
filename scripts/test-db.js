const { Pool } = require("pg");

const pool = new Pool({  connectionString: process.env.DATABASE_URL });

pool.query("SELECT NOW() AS now", (err, res) => {
    if (err) {
        console.error("Connection failed:", err.message);
    } else {
        console.log("Connected! Database time is", res.rows[0].now);
    }
    pool.end();
});