
<?php

header("Content-type: text/html; charset=utf-8");
include_once 'DigitalSAT_common.php';
include_once 'DSAT_getBookInfo.php';

if(isset($_GET["examID"]) === false)
{
    echo "call error";
    return;
}

$subjAnswerType = isset($_GET["mathquill"]) ? "mathquill" : "plain";
$subjAnswerType = isset($_GET["mathfield"]) ? "mathfield" : $subjAnswerType;

$examID = $_GET["examID"];
$bookIndex = $examFileList[$examID]["bookIndex"];
$examFile = $examFileList[$examID]["file"];
$texFileFolder = dirname($examFileList[$examID]["file"]);

if(file_exists($examFile) === false)
{
    echo $_GET["examID"] . " not found";
    return;
}

//$lastSlashPos = strrpos($examID,"/");
//if($lastSlashPos !== false)
//    $examIDFolder = substr($examID,0,$lastSlashPos);


?><!DOCTYPE html>
<meta charset="utf-8">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<html data-theme="light">
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>

    <script src="https://cdn.jsdelivr.net/npm/markdown-it@14.0.0/dist/markdown-it.min.js"></script>
    <script src="common.js"></script>
    <script src="DSAT_chat.js"></script>
    <script src="ikpsParseStyle.js"></script>
    <script src="ikpsParse.js"></script>
    <script src="DSAT_new.js"></script>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Lato' rel='stylesheet'>
    <script src="https://kit.fontawesome.com/55edf3a829.js" crossorigin="anonymous"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/mathlive"></script>

    <link rel="stylesheet" href="mathquill/mathquill.css"/>
    <script src="mathquill/mathquill.js"></script>
    <script>
    var MQ = MathQuill.getInterface(2);
    </script>

    <script>
        let examDataReq = "DSAT_parseTex";
        function afterLoadExam()
        {
            
        }

        let subjAnswerType = "<?= $subjAnswerType ?>";
        //let subjAnswerType = "mathquill";

        let nowExamIndex = -2;
        let nowProblemIndex = -1;
        let examID = "<?= $examID ?>";
        //let texFileName = "<?= $examID ?>";
        let texFileFolder = "<?= $texFileFolder ?>";
        let bookIndex = "<?= $bookIndex ?>";
        let scriptType="Problem";
        let changeDefaultValue = {
            SolutionSwitch:"0"
        }
        let showSubjectAnswerInput = true;
        let chatDomain = "SAT";
    </script>
    

    <!--<script type="module">
        import common from './DSAT_new.js';
        window.module = common; // window에 원하는 객체를 추가하고 거기에 모듈을 담는다.
    </script>-->

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="style.css" rel="stylesheet">
    <link href="DSAT.css" rel="stylesheet">
    <link href="IKPSParse.css" rel="stylesheet">
    <title>AlMool</title>
</head>

<body>

<form id="answerForm" name="answerForm"></form>
<div id="calculatorPos"></div>

<dialog id="referenceDialog" class="modal">
<form method="dialog" id="referenceImage" class="modal-box w-9/12 max-w-5xl">
    <img src="reference_papua.png">
</form>
<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
</dialog>

<div class="titleBar">
    <div class="examInfo">
        <div class="examInfo title" id="examInfo">
            examInfo
        </div>
        <div class="examInfo explanation" id="examSmallInfo">
            examInfo
        </div>
    </div>

    

    <div class="timer">
        <div class="timerTime" id="timerTime">
            
        </div>
        <div class="timerHide">
            <!--Timer-->
        </div>
    </div>

    <div class="tools">
        <div class="toolBox" id="showAnnotator" style="display:none;">
            <div class="toolIcon">
                <img src="icons/calculator.png" style="height:35px;">
            </div>
            <div class="toolTitle" id="annotateLabel">
                Annotate
            </div>
        </div>
        <div class="toolBox" id="showCalculator" style="display:none;">
            <div class="toolIcon">
                <img src="icons/calculator.png" style="height:35px;">
            </div>
            <div class="toolTitle" id="calculatorLabel">
                Calculator
            </div>
        </div>
        <div class="toolBox" id="showReference" style="display:none;">
            <div class="toolIcon">
                <img src="icons/reference.png" style="height:35px;">
            </div>
            <div class="toolTitle" id="referenceLabel">
                Reference
            </div>
        </div>
        <!--<div class="toolBox" onclick="showMore();">
            <div class="toolIcon">
                ...
            </div>
            <div class="toolTitle">
                More
            </div>-->
        </div>
    </div>
</div>

<div id="moreListPos"></div>

<div class="examContentsBox" id="examContentsBox">
    <div class="examContentsNotice" id="examContentsNotice"></div>
    <div class="examContentsResize" id="examContentsResize">
        <div class="examContentsResizeBar" id="examContentsResizeBar"></div>
    </div>
    <div class="examContents" id="examContents">
        

        <div class="problemTitle">
            <div class="problemNumber" id="problemNumber">1</div>
            <div class="problemMark" id="problemMark">mark for review</div>
            <div class="problemEmpty"></div>
            <div class="problemEraseAnswer" id="problemEraseAnswer"> </div>
        </div>
        <div class="problemContents">
            <div class="problemMainText" id="problemMainText"></div>

            <div id="problemAnswerForm">

                
            <div class="problemAnswerSubj">
                <input type="text" class="problemAnswerSubjInput" id="problemAnswerSubjInput" onkeypress="processAnswerInput(event)" oninput="syncAnswer(this,1);"></input>
            </div>
            <div class="problemAnswerSubj">
                <div class="problemAnswerSubjReview" style="justify-content: right;">Your Answer: </div>
                <div class="problemAnswerSubjReview" style="justify-content: left;" id="problemSubjAnswer"></div>
            </div>
            
            
            
            <div class="problemAnswerObj" id="ABorder">
                <div class="problemAnswerObjKind" id="AKind">A</div>
                <div class="problemAnswerObjContents" id="AContents">A</div>
            </div>
            <div class="problemAnswerObj" id="BBorder">
                <div class="problemAnswerObjKind" id="BKind">B</div>
                <div class="problemAnswerObjContents" id="BContents">B</div>
            </div>
            <div class="problemAnswerObj" id="CBorder">
                <div class="problemAnswerObjKind" id="CKind">C</div>
                <div class="problemAnswerObjContents" id="CContents">C</div>
            </div>
            <div class="problemAnswerObj" id="DBorder">
                <div class="problemAnswerObjKind" id="DKind">D</div>
                <div class="problemAnswerObjContents" id="DContents">D</div>
            </div>

            
            
            
            </div>
        </div>

    </div>
</div>

<div id="answerListPos"></div>

<div class="moveModulePopup" id="moveModule"></div>

<div class="footerBar">
    <div class="footerInfo" style="cursor:pointer;" onclick="showMoveModule();">
        Research Team
    </div>
    <div class="answerList" id="answerList">
        Ready
    </div>
    <div class="moveProblemSet">
        <div class="moveProblem" id="moveBack">
            Back
        </div>
        <div class="moveProblem" id="moveNext">
            Next
        </div>
    </div>
</div>

</html>