<?php
$certPrefix = "T(#EIJR3ehu";
$certSuffix = "Y)I(#@EFRN";


//통파일을 알아야 하는 경우 : 시험 전체의 데이터가 필요할 때
$examFileList = file_get_contents("examFileList.json");
$examFileList = json_decode($examFileList,true);



$problemTypeTitle = ["E","M"];


function getExamListFromTexFile($texFileName)
{
    global $stringByteidx;
    global $nextPosidx;

    $texFileData = file_get_contents($texFileName);
    if($texFileData === false)
        return;
    $texFileData = removeComment($texFileData,strlen($texFileData));


    $folderInfoWrite = false;
    //index로 폴더 접근
    $folderInfoByIndex = file_get_contents("folderInfoByIndex.json");
    if($folderInfoByIndex !== false)
        $folderInfoByIndex = json_decode($folderInfoByIndex,true);
    else
        $folderInfoByIndex = array();

    //폴더 명으로 index 얻기
    $folderInfoByFolderName = file_get_contents("folderInfoByFolderName.json");
    if($folderInfoByFolderName !== false)
        $folderInfoByFolderName = json_decode($folderInfoByFolderName,true);
    else
        $folderInfoByFolderName = array();


    $upperBound = 0;
    $beginDocument = strpos($texFileData,"\\begin{document}");
    $endDocument = strpos($texFileData,"\\end{document}");
    if($endDocument !== false)
       $upperBound = $endDocument;
    else
       $upperBound = strlen($texFileData);


    $examInfoParseResult = parseSetValue($texFileData,$beginDocument,$endDocument);
    

    //[key,value,다음검색위치]
    $setvalueArray = [];
    array_push($setvalueArray,["","",0]);
    foreach ($examInfoParseResult as $key => $valueArray)
    {
        for($i=0;$i<count($valueArray);$i++)
        {
            array_push($setvalueArray,[$key,$valueArray[$i][$stringByteidx]->str,$valueArray[$i][$nextPosidx]]);
        }
    }
    array_push($setvalueArray,["","",$endDocument]);

    
    usort($setvalueArray,function($a,$b){
        return $a[2]-$b[2];
    });
    


    $setvalueidx = 0;
    $startPos = ($beginDocument===false) ? 0 : $beginDocument;
    $examNum = 0;
    $problemNum = 0;
    $dataToSend = [];
    
    while(1)
    {
        $pos = strpos($texFileData,"\\input",$startPos);
        if($pos === False || $pos >= $upperBound)
            break;

        $filenameData = findParameter($texFileData,$pos+6,$upperBound);
        $filename = $filenameData[0]->str;
        $startPos = $filenameData[1];

        $prevSetvalueStart = $setvalueidx;
        while($pos >= $setvalueArray[$setvalueidx][2] && $setvalueidx<count($setvalueArray))
            $setvalueidx++;
        
        
        for($i=$prevSetvalueStart;$i<$setvalueidx;$i++)
        {
            $key = $setvalueArray[$i][0];

            if($key === "examTitle")
            {
                array_push($dataToSend,array());
                $examNum++;
                $problemNum = 0;
            }
        }

        if($examNum>0)
        {
            //array_push($dataToSend[$examNum-1], array());
            $nowSubFolder = dirname($filename);
            $newIndex = md5($nowSubFolder);

            if(array_key_exists($nowSubFolder,$folderInfoByFolderName) === false)
            {
                $folderInfoByIndex[$newIndex] = $nowSubFolder;
                $folderInfoByFolderName[$nowSubFolder] = $newIndex;
                $folderInfoWrite = true;
            }

            array_push($dataToSend[$examNum-1],"$newIndex:".basename($filename,".tex"));
            //$dataToSend[$examNum-1][$problemNum-1] = ;
        }
    }
    
    if($folderInfoWrite)
    {
        file_put_contents("folderInfoByFolderName.json",json_encode($folderInfoByFolderName));
        file_put_contents("folderInfoByIndex.json",json_encode($folderInfoByIndex));
    }

    return $dataToSend;
}
?>