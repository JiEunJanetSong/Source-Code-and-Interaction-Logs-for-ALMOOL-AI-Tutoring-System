
<?php

header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5001");
header("Access-Control-Allow-Headers: content-type");

include_once 'DigitalSAT_common.php';

$req = file_get_contents("php://input");
$post_data = json_decode($req,true);

$data = $post_data["data"];
$filename = $post_data["filename"]; 

$slashPos = strpos($data,"/");
$semicolonPos = strpos($data,";");
$commaPos = strpos($data,",");

$ext = substr($data,$slashPos+1,$semicolonPos-$slashPos-1);
$imageData64 = substr($data,$commaPos+1);
$imageData = base64_decode($imageData64);

file_put_contents("img/$filename.$ext",$imageData);
echo json_encode(array("status" => "success"));

?>