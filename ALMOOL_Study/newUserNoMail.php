<?php

error_reporting( E_ALL );
ini_set( "display_errors", 1 );

header("Access-Control-Allow-Origin: http://localhost:5001");
header("Access-Control-Allow-Headers: content-type");

$PWPrefix = '@#+-*$ITtujnK#$JbI@#_)#@IIFJ)#KK^(CJEM<W4h983u)';
$PWSuffix = ')$JFNELKFM%LK&M#$(F)$JEMMFKGKT]]n3-*vdhe83#!~';

$req = file_get_contents("php://input");
$post_data = json_decode($req);

$userID = $post_data->userID;
$userPW = hash("sha3-256",$PWPrefix . $post_data->userPW . $PWSuffix);
$email = $post_data->email;
$joinDate = date('Y-m-d H:i:s');
$joinState = hash("sha3-256","40)_()dcntjTD:-$userID-$userPW-$email-$joinDate-fnb23@!D##1");

$db = new SQLite3(__DIR__ . '/data/almool_study.db');

$stmt = $db->prepare("SELECT * FROM UserInfo WHERE ID=:id");
$stmt->bindValue(':id', $userID, SQLITE3_TEXT);
$result = $stmt->execute();

if($result->fetchArray())
{
    echo "error";
    $db->close();
    return;
}

$stmt = $db->prepare("INSERT INTO UserInfo (ID,PW,nowCount,maxCount,email,joinDate,joinState,userType) VALUES(:id,:pw,0,50,:email,:joinDate,'success','none')");
$stmt->bindValue(':id', $userID, SQLITE3_TEXT);
$stmt->bindValue(':pw', $userPW, SQLITE3_TEXT);
$stmt->bindValue(':email', $email, SQLITE3_TEXT);
$stmt->bindValue(':joinDate', $joinDate, SQLITE3_TEXT);
$stmt->execute();

$db->close();
echo "success";

?>
