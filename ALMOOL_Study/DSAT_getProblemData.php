<?php
//개별 파일로부터 문항 정보를 읽어옴
error_reporting( E_ALL );
ini_set( "display_errors", 1 );
header("Access-Control-Allow-Origin: http://localhost:5001");

include_once 'common.php';
include_once 'DigitalSAT_common.php';
include_once 'DSAT_getBookInfo.php';

/*
$bookIndex = (int)$_GET["bookIndex"];
$page = (int)$_GET["page"];
$problemNum = (int)$_GET["problemNumber"];
$problemType = (int)$_GET["problemType"];

$bookName = $bookIndexTitle[$bookIndex];
$pageStr = sprintf('%03d',$page);

$problemID = "DB/Book/$bookName/$pageStr" . "_" . (($problemType!=-1) ? $problemTypeTitle[$problemType] : "") . (($problemType!=-1) ? $problemNum : sprintf('%02d',$problemNum)) . ".md";
$dataToSend[$i] = getContentsFromSingleTexFile($problemID,["Contents"],["Solution"]);
*/

//index로 폴더 접근
$folderInfoByIndex = file_get_contents("folderInfoByIndex.json");
$folderInfoByIndex = json_decode($folderInfoByIndex,true);

//폴더 명으로 index 얻기
$folderInfoByFolderName = file_get_contents("folderInfoByFolderName.json");
$folderInfoByFolderName = json_decode($folderInfoByFolderName,true);



$bookIndex = (int)$_GET["bookIndex"];

$problemID = $_GET["problemID"];
$colonPos = strpos($problemID,":");
$file = "";
$bookFolder = "";

if(isset($_GET["examID"]))
{
    $examID = $_GET["examID"];
    $examFile = $examFileList[$examID]["file"];
    $bookFolder = dirname($examFile);
}
else if(isset($_GET["examFolder"]))
{
    $bookFolder = $_GET["examFolder"];
}
else if(isset($_GET["bookIndex"]))
{
    $bookIndex = (int)$_GET["bookIndex"];
    $bookFolder = sendHTTPSPost("http://localhost:5001/bookInfo/$bookIndex");
}


if($colonPos === false)
{
    $file = "$bookFolder/$problemID";
}
else
{
    $folderIndex = substr($problemID,0,$colonPos);
    $problemName = substr($problemID,$colonPos+1);

    $subFolder = $folderInfoByIndex[$folderIndex];

    $file = "$bookFolder/$subFolder/$problemName";
}

$ext = ".tex";

if(strstr($file,$ext) === false)
    $file .= $ext;

if(file_exists($file) === false)
{
    echo "($file) file not found";
    if(strstr($file,$ext) === false)
        $file .= $ext;
}

if(file_exists($file) === false)
{
    echo "($file) file not found";
    return;
}

/*
if(isset($_GET["problemNum"]))
{
    $problemNum = $_GET["problemNum"];
    $problemID = "DB/Book/$bookFolder/$pageStr" . "_" . "$problemNum.md";
}
else
{
    $problemID = "DB/Book/$bookFolder/$problemID.md";
}
*/

$dataToSend = getContentsFromSingleTexFile($file,["Contents","Solution","GPTSolution","Rubric","AltText"]);
$dataToSend["ImageFilePath"] = "$bookFolder";
if($bookIndex == 1300 || $bookIndex == 1301 || $bookIndex == 1302)
{
    $dataToSend["ImageFilePath"] = "";
    $bookFolder = "";
}
        
if(isset($_GET["isRaw"]))
{
    foreach ($dataToSend as $key => $value) {
        $dataToSend[$key] = preg_replace("/src=\"/","src=\"http://localhost:8080/$bookFolder/",$dataToSend[$key]);
    }
}
else
{
    foreach ($dataToSend as $key => $value) {
        $dataToSend[$key] = preg_replace("/src=\"/","src=\"http://localhost:8080/$bookFolder/",$dataToSend[$key]);
        $dataToSend[$key] = preg_replace("/alt=\"[^\"]*\"/","",$dataToSend[$key]);

        /*
        $startPos = 0;
        while(1)
        {
            $imageStartPos = strpos($dataToSend[$key],"<img",$startPos);
            if($imageStartPos == -1)
                break;

            $imageEndPos = strpos($dataToSend[$key],">",$imageStartPos);
            if($imageEndPos == -1)
                break;

            if($dataToSend[$key][$imageEndPos-1] != "/")
                $dataToSend[$key] = substr_replace($dataToSend[$key],"/",$imageEndPos,0);

            $startPos = $imageEndPos;
        }
        */
    }
}

$dataToSend[$key] = preg_replace("/``/","\"",$dataToSend[$key]);
$dataToSend[$key] = preg_replace("/`/","\'",$dataToSend[$key]);

echo json_encode($dataToSend);


?>