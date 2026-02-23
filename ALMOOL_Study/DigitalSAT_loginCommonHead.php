<?php

session_start();
$isLogined = false;

if(isset($_SESSION['userID']))
{
    $isLogined = true;
}

$PWPrefix="#!_Z*@";
$PWSuffix="*^%=^%";

function initDB()
{
    $db = new SQLite3(__DIR__ . '/data/almool_study.db');
    $db->busyTimeout(5000);
    return $db;
}
?>
