<?php

error_reporting( E_ALL );
ini_set( "display_errors", 1 );

$stringByteidx = 0;
$nextPosidx = 1;
$alphabet = ["a","b","c","d","e","f","g","h","i","k","j","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];

class stringByte
{
    public $str;
    public $length;

    function __construct($str,$length)
    {
        $this->str = $str;
        $this->length = $length;
    }
};

function removeComment($str,$upperBound)
{
    $isComment = False;

    for($i=0;$i<$upperBound;$i++)
    {
        if($str[$i] == '%')
        {
            $isComment = True;

            if($i>0)
            {
                if($str[$i-1] == '\\')
                    $isComment = False;
            }
        }
        else if($str[$i] == "\n")
            $isComment = False;

        if($isComment === True)
            $str[$i] = ' ';
    }

    $startPos = 0;
    $commentState = 0;
    $findStr = "\\begin";
    $commentStart = 0;
    $commentArea = array();

    while(1)
    {
        if($commentState == 0)
            $findStr = "\\begin";
        else if($commentState == 1)
            $findStr = "\\end";

        $pos = strpos($str,$findStr,$startPos);
        if($pos === False || $pos >= $upperBound)
            break;

        $env = findParameter($str,$pos+strlen($findStr),$upperBound);

        if($env[0]->str == "comment")
        {
            if($commentState == 0)
                $commentStart = $pos;
            else if($commentState == 1)
                array_push($commentArea,[$commentStart,$env[1]]);

            $commentState = ($commentState==0) ? 1 : 0;
        }
        
        $startPos = $env[1];
    }

    for($i=0;$i<count($commentArea);$i++)
    {
        for($j=$commentArea[$i][0];$j<$commentArea[$i][1];$j++)
        {
            $str[$j] = ' ';
        }
    }

    

    return $str;
}

function isspace($ch)
{
    $c = ord($ch);

    if($c >= 0x09 && $c <= 0x0d || $c == 0x20)
        return True;

    return False;
}

function isalpha($ch)
{
    $c = ord($ch);

    if( ($c >= 0x41 && $c <= 0x5A) || ($c >= 0x61 && $c <= 0x7A) )
        return True;

    return False;
}

function findNextSpace($str,$startPos,$upperBound)
{
    $pos = $startPos;

    for(;$pos<$upperBound;$pos++)
    {
        if(isspace($str[$pos]) === True)
            break;
    }

    return $pos;
}

function findNextNonSpace($str,$startPos,$upperBound)
{
    $pos = $startPos;

    for(;$pos<$upperBound;$pos++)
    {
        if(isspace($str[$pos]) === False)
            break;
    }

    return $pos;
}

function parseInput($contents)
{

}

// [인수,ans시작위치] 리턴
function parseObjAnswer($contents,$upperBound)
{
    $ans = strpos($contents,"\\ansFOURs");
    if($ans === False)
        return False;

    $isText = false;
    $pos = $ans+9;
    if($contents[$pos] == 'T')
    {
        $isText = true;
        $pos++;
    }

    $parameter = array();

    for($i=0;$i<4;$i++)
    {
        $par = findParameter($contents,$pos,$upperBound);
        $parameter[$i] = $par[0];
        
        if($isText === false)
            $parameter[$i]->str = "$" . $parameter[$i]->str . "$";

        $pos = $par[1];
    }

    while(isspace($contents[$ans-1])) $ans--;

    return [$parameter,$ans];
}

//key => [[val1,다음검색위치1], [val2,다음검색위치2], [val3,다음검색위치3], ...]
//res["키"][index][0] : stringByte
//res["키"][index][1] : 다음 검색위치
function parseSetValue($str,$lowerBound,$upperBound)
{
    $startPos = $lowerBound;
    $data = array();

    while(1)
    {
        $setValue = strpos($str,"\\SetValue",$startPos);
        if($setValue === False)
            break;

        $key = findParameter($str,$setValue+9,$upperBound);
        $value = findParameter($str,$key[1],$upperBound);

        //[문자열,다음검색위치]
        if(array_key_exists($key[0]->str,$data) === false)
            $data[$key[0]->str] = array();
        
        array_push($data[$key[0]->str],[$value[0],$value[1]]);

        $startPos = $value[1];
    }

    return $data;
}

/**[[문자열,길이],다음 검색 위치] 리턴*/
function findParameter($str,$startPos,$upperBound)
{
    $pos = findNextNonSpace($str,$startPos,$upperBound);

    if($str[$pos] == '{' && $str[$pos-1] != '\\')
    {
        $pos = findNextNonSpace($str,$pos+1,$upperBound);

        $start = $pos;
        $end = $pos;
        $parLev = 1;

        for($pos=$start;$pos<$upperBound;$pos++)
        {
            if($str[$pos] == '{' && $str[$pos-1] != '\\')
                $parLev++;
            else if($str[$pos] == '}' && $str[$pos-1] != '\\')
                $parLev--;

            if($parLev == 0)
                break;

            if(isspace($str[$pos]) === False)
                $end = $pos + 1;
        }
    }
    else
    {
        // 중괄호 생략된 경우 인수가 \로 시작하면 안 됨
        $start = $pos;
        $end = $pos+1;
    }
    
    return [new stringByte(substr($str,$start,$end-$start),$end-$start),$pos+1];
}

function getExamContentsFromFolder($fileNamePrefix)
{
    global $stringByteidx;
    global $nextPosidx;

    $questionNum = 1;
    $dataToSend = array();

    while(1)
    {
        $questionNumStr = ($questionNum<10) ? "0".$questionNum : $questionNum;
        $questionData = file_get_contents($fileNamePrefix . $questionNumStr . ".md");

        //echo $fileNamePrefix . $questionNumStr . ".md";

        if($questionData === false)
            break;

        $parseResult = parseSetValue($question,0,strlen($question));
        $dataToSend[$questionNum] = array();

        $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;

        /*
        $question = removeComment($questionData,strlen($questionData));
        $parseResult = parseSetValue($question,strlen($question));
        $objAnswerData = parseObjAnswer($parseResult["Contents"]->str,$parseResult["Contents"]->length);
        $dataToSend[$questionNum] = array();

        //객관식
        if($objAnswerData !== False)
        {
            $objAnswer = $objAnswerData[0];
            $parseResult["Contents"]->str = substr($parseResult["Contents"]->str,0,$objAnswerData[1]);
            $parseResult["Contents"]->length = $objAnswerData[1];

            $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;
            $dataToSend[$questionNum]["objAnswer"] = [$objAnswer[0]->str,$objAnswer[1]->str,$objAnswer[2]->str,$objAnswer[3]->str];
            $dataToSend[$questionNum]["type"] = "o";
        }
        //주관식
        else
        {
            $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;
            $dataToSend[$questionNum]["type"] = "s";
        }
        */
        
        $questionNum++;
    }

    return json_encode($dataToSend);
}

function getExamContentsFromTexFile($texFileName,$contentsType=["Contents"],$contentsTypeSubstr=[])
{
    global $stringByteidx;
    global $nextPosidx;

    $texFileData = file_get_contents($texFileName);
    if($texFileData === false)
        return;
    $texFileData = removeComment($texFileData,strlen($texFileData));
    $texFileDirectory = dirname($texFileName) . "/";


    $upperBound = 0;
    $beginDocument = strpos($texFileData,"\\begin{document}");
    $endDocument = strpos($texFileData,"\\end{document}");
    if($endDocument !== false)
       $upperBound = $endDocument;
    else
       $upperBound = strlen($texFileData);


    $examInfoParseResult = parseSetValue($texFileData,$beginDocument,$endDocument);
    $examTitleBound = array();
    $fileList = array();
    $fileList["non-title"] = array();
    array_push($examTitleBound,$beginDocument);
    for($i=0;$i<count($examInfoParseResult["examTitle"]);$i++)
    {
        $fileList[$examInfoParseResult["examTitle"][$i][$stringByteidx]->str] = array();
        array_push($examTitleBound,$examInfoParseResult["examTitle"][$i][$nextPosidx]);
    }
    array_push($examTitleBound,$endDocument);
    $examTitleBoundidx = 0;


    $startPos = ($beginDocument===false) ? 0 : $beginDocument;
    while(1)
    {
        $pos = strpos($texFileData,"\\input",$startPos);
        if($pos === False || $pos >= $upperBound)
            break;

        $examTitle = "non-title";
        for($i=1;$i<count($examTitleBound)-1;$i++)
        {
            if($pos >= $examTitleBound[$i] && $pos < $examTitleBound[$i+1])
            {
                $examTitle = $examInfoParseResult["examTitle"][$i-1][$stringByteidx]->str;
                break;
            }
        }

        $filename = findParameter($texFileData,$pos+6,$upperBound);
        if(strpos($filename[0]->str,".") === false)
            array_push($fileList[$examTitle],$texFileDirectory . $filename[0]->str . ".md");
        else
            array_push($fileList[$examTitle],$texFileDirectory . $filename[0]->str);
        $startPos = $filename[1];
    }

    

    $dataToSend = array();
    foreach ($fileList as $examTitle => $examFileList)
    {
        if(count($examFileList)>0)
        {
            $dataToSend[$examTitle] = array();
            $problemNum = 1;

            for($i=0;$i<count($examFileList);$i++)
            {
                $dataToSend[$examTitle][$problemNum] = array();

                $questionData = file_get_contents($examFileList[$i]);
                if($questionData === false)
                    continue;

                $question = removeComment($questionData,strlen($questionData));
                $parseResult = parseSetValue($question,0,strlen($question));

                $dataToSend[$examTitle][$problemNum]["filePath"] = $examFileList[$i];

                for($j=0;$j<count($contentsType);$j++)
                {
                    if(isset($parseResult[$contentsType[$j]]))
                        $dataToSend[$examTitle][$problemNum][$contentsType[$j]] = $parseResult[$contentsType[$j]][0][$stringByteidx]->str;
                    else
                        $dataToSend[$examTitle][$problemNum][$contentsType[$j]] = "";
                }

                for($j=0;$j<count($contentsTypeSubstr);$j++)
                {
                    foreach ($parseResult as $key => $value)
                    {
                        if(strpos($key,$contentsTypeSubstr[$j]) !== false)
                        {
                            if(array_key_exists($key,$dataToSend[$examTitle][$problemNum]) === false)
                            {
                                $dataToSend[$examTitle][$problemNum][$key] = $value[0][$stringByteidx]->str;
                            }
                        }
                    }
                }
                
                $problemNum++;
            }
        }
    }

    for($i=0;$i<count($fileList);$i++)
    {
        /*
        $questionNum = $i+1;

        $questionData = file_get_contents($fileList[$i]);
        if($questionData === false)
            continue;

        for($j=0;$j<count($fileList[$i]);$j++)
        {

        }

        
        $question = removeComment($questionData,strlen($questionData));
        $parseResult = parseSetValue($question);
        $dataToSend[$questionNum] = array();
        $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;
        */ 
        
        /*
        $question = removeComment($questionData,strlen($questionData));
        $parseResult = parseSetValue($question)[0];
        $objAnswerData = parseObjAnswer($parseResult["Contents"]->str,$parseResult["Contents"]->length);
        $dataToSend[$questionNum] = array();

        //객관식
        if($objAnswerData !== False)
        {
            $objAnswer = $objAnswerData[0];
            $parseResult["Contents"]->str = substr($parseResult["Contents"]->str,0,$objAnswerData[1]);
            $parseResult["Contents"]->length = $objAnswerData[1];

            $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;
            $dataToSend[$questionNum]["objAnswer"] = [$objAnswer[0]->str,$objAnswer[1]->str,$objAnswer[2]->str,$objAnswer[3]->str];
            $dataToSend[$questionNum]["type"] = "o";
        }
        //주관식
        else
        {
            $dataToSend[$questionNum]["Contents"] = $parseResult["Contents"]->str;
            $dataToSend[$questionNum]["type"] = "s";
        }
        */

        //echo $dataToSend[$questionNum]["Contents"] . "<br>\n";
    }

    return $dataToSend;
}



//$examInfoAtAll: set-value가 시험지 전체에 적용
//$examInfoByExam: set-value가 시험(Module) 단위로 적용
//$examInfoByProblem: set-value가 개별 문항 단위로 적용, 현재 구현 x
//module 구분 기준 : \SetValue{examTitle}{...}
function getExamContentsFromTexFile_new($texFileName,$updateFolderIndex=false,$contentsType=["Contents"],$contentsTypeSubstr=[],$examInfoAtAll=[],$examInfoByExam=[]/*,$examInfoByProblem=[]*/)
{
    global $stringByteidx;
    global $nextPosidx;

    $texFileData = file_get_contents($texFileName);
    if($texFileData === false)
        return;
    $texFileData = removeComment($texFileData,strlen($texFileData));
    $texFileDirectory = dirname($texFileName);


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
    $examTitle = "non-title";
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
            $value = $setvalueArray[$i][1];

            if($key === "examTitle")
            {
                array_push($dataToSend,array());
                $examNum++;

                $examTitle = $value;

                $dataToSend[$examNum-1]["examTitle"] = $examTitle;
                $dataToSend[$examNum-1]["problem"] = [];

                $problemNum = 0;
            }
        }

        if($examNum>0)
        {
            $nowTexFileName = $texFileDirectory . "/" . $filename;
            $questionData = file_get_contents($nowTexFileName);
            if($questionData === false)
                continue;

            array_push($dataToSend[$examNum-1]["problem"], array());
            $problemNum++;

            $question = removeComment($questionData,strlen($questionData));
            $parseResult = parseSetValue($question,0,strlen($question));

            $nowSubFolder = dirname($filename);
            if(array_key_exists($nowSubFolder,$folderInfoByFolderName) === false)
            {
                //$newIndex = count(array_keys($folderInfoByFolderName));
                $newIndex = md5($nowSubFolder);
                $folderInfoByIndex[$newIndex] = $nowSubFolder;
                $folderInfoByFolderName[$nowSubFolder] = $newIndex;
                $folderInfoWrite = true;
            }

            $dataToSend[$examNum-1]["problem"][$problemNum-1]["folderIndex"] = $folderInfoByFolderName[$nowSubFolder];
            $dataToSend[$examNum-1]["problem"][$problemNum-1]["problemName"] = basename($filename,".tex");
            $dataToSend[$examNum-1]["problem"][$problemNum-1]["filePath"] = $filename;
            $dataToSend[$examNum-1]["problem"][$problemNum-1]["value"] = array();

            for($j=0;$j<count($contentsType);$j++)
            {
                if(isset($parseResult[$contentsType[$j]]))
                    $dataToSend[$examNum-1]["problem"][$problemNum-1][$contentsType[$j]] = $parseResult[$contentsType[$j]][0][$stringByteidx]->str;
                else
                    $dataToSend[$examNum-1]["problem"][$problemNum-1][$contentsType[$j]] = "";
            }

            for($j=0;$j<count($contentsTypeSubstr);$j++)
            {
                foreach ($parseResult as $key => $value)
                {
                    if(strpos($key,$contentsTypeSubstr[$j]) !== false)
                    {
                        if(array_key_exists($key,$dataToSend[$examNum-1]["problem"][$problemNum-1]) === false)
                        {
                            $dataToSend[$examNum-1]["problem"][$problemNum-1][$key] = $value[0][$stringByteidx]->str;
                        }
                    }
                }
            }
            
        }

        for($i=$prevSetvalueStart;$i<$setvalueidx;$i++)
        {
            $key = $setvalueArray[$i][0];
            $value = $setvalueArray[$i][1];

            if($key !== "examTitle" && $key != "" && $examNum>0 && $problemNum>0)
            {
                $dataToSend[$examNum-1]["problem"][$problemNum-1]["value"][$key] = $value;
            }
        }
    }
    
    if($folderInfoWrite)
    {
        file_put_contents("folderInfoByFolderName.json",json_encode($folderInfoByFolderName));
        file_put_contents("folderInfoByIndex.json",json_encode($folderInfoByIndex));
    }

    return $dataToSend;
}

function getFileList($filename,$ext)
{
    global $alphabet;
    $subProblem = false;
    $fileList = array();

    if(file_exists($filename . $ext))
    {
        $fileList[0] = $filename . $ext;
    }
    else
    {
        $length = 0;
        while(1)
        {
            $nextFileSuffix = $alphabet[$length];
            $nextFileName = $filename . "-$nextFileSuffix" . $ext;

            if(file_exists($nextFileName))
                $fileList[$length] = $nextFileName;
            else
                break;

            $length++;
            $subProblem = true;
        }
    }

    return [$subProblem,$fileList];
}

function getContentsFromSingleTexFile($texFileName,$contentsType=["Contents"],$contentsTypeSubstr=[])
{
    global $stringByteidx;
    global $nextPosidx;

    $questionData = file_get_contents($texFileName);
    if($questionData === false)
        return;

    $question = removeComment($questionData,strlen($questionData));
    $parseResult = parseSetValue($question,0,strlen($question));

    for($j=0;$j<count($contentsType);$j++)
    {
        if(array_key_exists($contentsType[$j],$parseResult) !== false)
            $dataToSend[$contentsType[$j]] = $parseResult[$contentsType[$j]][0][$stringByteidx]->str;
        else
            $dataToSend[$contentsType[$j]] = "";
    }

    for($j=0;$j<count($contentsTypeSubstr);$j++)
    {
        foreach ($parseResult as $key => $value)
        {
            if(strpos($key,$contentsTypeSubstr[$j]) !== false)
            {
                if(array_key_exists($key,$dataToSend) === false)
                {
                    $dataToSend[$key] = $value[0][$stringByteidx]->str;
                }
            }
        }
    }

    return $dataToSend;
}
?>