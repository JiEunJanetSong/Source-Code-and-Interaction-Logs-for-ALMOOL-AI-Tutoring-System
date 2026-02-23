<?php
//통파일로부터 시험 정보를 읽어옴
//error_reporting( E_ALL );
//ini_set( "display_errors", 1 );

include_once 'DigitalSAT_common.php';
include_once 'DSAT_getBookInfo.php';



$examID = $_GET["examID"];
$examFile = $examFileList[$examID]["file"];

//$bookIndex = (int)$_GET["bookIndex"];
//$imageFolder = $bookInfo[$bookIndex]["imageFolder"];
//$dataToSend = getExamContentsFromTexFile_new($_GET["prefix"],["Contents","Solution","Concept","Solution3","Answer"]);
//$dataToSend = getExamContentsFromTexFile_new($_GET["prefix"],["Contents","Solution","Concept","Solution3","Answer"],[],[],["ConceptSwitch","ConceptLabel","SolutionSwitch","SolutionLabel"]);
$dataToSend = getExamContentsFromTexFile_new($examFile,true,["Contents","Solution","Concept","Solution3","Answer"],[],[],["ConceptSwitch","ConceptLabel","SolutionSwitch","SolutionLabel"]);

//if($bookIndex == 1300 || $bookIndex == 1301)
//    $imageFolder = "";

echo json_encode($dataToSend);

    /*
if(isset($_GET["isRaw"]))
{
    foreach ($dataToSend as $examTitle => $problem) {
        foreach ($problem as $problemNum => $problemData) {
            foreach ($problemData as $key => $value) {
                $dataToSend[$examTitle][$problemNum][$key] = preg_replace("/src=\"/","src=\"https://researchteam.ai/chatgpt-math/$imageFolder/",$dataToSend[$examTitle][$problemNum][$key]);
            }
        }
    }
}
else
{
    foreach ($dataToSend as $examTitle => $problem) {
        foreach ($problem as $problemNum => $problemData) {
            foreach ($problemData as $key => $value) {
                $dataToSend[$examTitle][$problemNum][$key] = preg_replace("/src=\"/","src=\"https://researchteam.ai/chatgpt-math/$imageFolder/",$dataToSend[$examTitle][$problemNum][$key]);
                $dataToSend[$examTitle][$problemNum][$key] = preg_replace("/alt=\"[^\"]*\"/","",$dataToSend[$examTitle][$problemNum][$key]);
            }
        }
    }
}
    

echo json_encode($dataToSend);
*/

?>