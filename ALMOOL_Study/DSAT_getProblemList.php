<?php

error_reporting( E_ALL );
ini_set( "display_errors", 1 );
header("Access-Control-Allow-Origin: http://localhost:5001");

include_once 'DigitalSAT_common.php';
include_once 'DSAT_getBookInfo.php';

$examID = $_GET["examID"];
$examFile = $examFileList[$examID]["file"];

echo json_encode(getExamListFromTexFile($examFile));

?>