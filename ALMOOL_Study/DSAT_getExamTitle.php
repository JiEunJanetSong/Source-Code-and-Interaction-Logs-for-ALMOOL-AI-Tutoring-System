<?php
header("Access-Control-Allow-Origin: http://localhost:5001");
header("Access-Control-Allow-Headers: content-type");

$examInfo = file_get_contents("examFileList.json");
$examInfo = json_decode($examInfo,true);

$examID = addslashes($_GET["examID"]);
echo $examInfo[$examID]["title"];

?>