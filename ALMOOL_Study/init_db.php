<?php
// Initialize SQLite database for ALMOOL_Study
$dbPath = __DIR__ . '/data/almool_study.db';

if (file_exists($dbPath)) {
    echo "Database already exists. Delete it first to re-initialize.\n";
    exit(1);
}

$db = new SQLite3($dbPath);

$db->exec("CREATE TABLE UserInfo (
    userID TEXT PRIMARY KEY,
    userPW TEXT DEFAULT '',
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    signedDate TEXT DEFAULT ''
)");

// Test user (password: 'test123' with prefix/suffix hash)
$PWPrefix = '#!_Z*@';
$PWSuffix = '*^%=^%';
$testPW = hash('sha3-256', $PWPrefix . 'test123' . $PWSuffix);

$stmt = $db->prepare("INSERT INTO UserInfo (userID, userPW, name, email, signedDate) VALUES (:id, :pw, :name, :email, :date)");
$stmt->bindValue(':id', 'test', SQLITE3_TEXT);
$stmt->bindValue(':pw', $testPW, SQLITE3_TEXT);
$stmt->bindValue(':name', 'Test User', SQLITE3_TEXT);
$stmt->bindValue(':email', 'test@test.com', SQLITE3_TEXT);
$stmt->bindValue(':date', date('Y-m-d H:i:s'), SQLITE3_TEXT);
$stmt->execute();

$db->close();
echo "Database initialized at $dbPath\n";
echo "Test user: test / test123\n";
?>
