const { runQuery } = require('./database');

async function seed() {
    console.log("Seeding Database...");

    // Add default drivers
    await runQuery(`INSERT INTO drivers (name) VALUES ('John Smith')`);
    await runQuery(`INSERT INTO drivers (name) VALUES ('Alice Johnson')`);
    await runQuery(`INSERT INTO drivers (name) VALUES ('Bob Miller')`);

    // Add UI Config Flags (Feature Flags)
    // Driver & Trip are enabled by default (from database.js)
    // Let's add the Marshal & App configs too
    await runQuery(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_app', 'false')`);
    await runQuery(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_marshal', 'false')`);

    console.log("Seeding complete. You can now start the server.");
    process.exit(0);
}

// Give DB a microsecond to connect because of our simple sync implementation
setTimeout(seed, 500);
