<?php
error_reporting( E_ALL );
ini_set( "display_errors", 1 );
header("Access-Control-Allow-Origin: http://localhost:5001");
header("Access-Control-Allow-Headers: content-type");

$req = file_get_contents("php://input");
$post_data = json_decode($req);

$action = json_encode($post_data->action);
$userID = $post_data->userID;

if(strlen($userID)<10 && strlen($action)<10)
    return;

$db = new SQLite3(__DIR__ . '/data/almool_study.db');

$now = new DateTime();
$nowStr = date('Y-m-d H:i:s');

$stmt = $db->prepare("INSERT INTO UserLog VALUES(:userID, :action, :nowStr)");
$stmt->bindValue(':userID', $userID, SQLITE3_TEXT);
$stmt->bindValue(':action', $action, SQLITE3_TEXT);
$stmt->bindValue(':nowStr', $nowStr, SQLITE3_TEXT);
$stmt->execute();

$db->close();

?>
