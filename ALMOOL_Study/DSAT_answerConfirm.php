<?php

header("Content-type: text/html; charset=utf-8");
include_once 'DigitalSAT_common.php';
include_once 'DSAT_getBookInfo.php';

$customerAnswer = $_POST['answer'];

$examID = $_GET["examID"];
$examFile = $examFileList[$examID]["file"];
$bookIndex = $examFileList[$examID]["bookIndex"];
$chatDomain = (isset($_GET["chatDomain"])) ? $_GET["chatDomain"] : "SAT";

$examData = getExamContentsFromTexFile_new($examFile,true,["Contents","Answer","Solution","Concept"],[],[],["ConceptLabel","SolutionLabel"]);


$customerAnswer = json_decode($customerAnswer,true);
//$examData = json_decode($examData,true);

$examNum = count($examData);
$problemTotalCount = array();
$problemTotalCountStr = "";
//$customerAnswerArray = array();
//$hintData = array();
$examTitleArrString = "";


/*
foreach ($examData as $examTitle => $examContents)
{
    //$examTitle = $examContents["examTitle"];
    $problemTotalCount[$examTitle] = count($examContents);
    $hintData[$examTitle] = array();

    if($examTitleArrString == "")
        $examTitleArrString .= "'$examTitle'";
    else
        $examTitleArrString .= ",'$examTitle'";

    if($problemTotalCountStr == "")
        $problemTotalCountStr .= "$problemTotalCount[$examTitle]";
    else
        $problemTotalCountStr .= ",$problemTotalCount[$examTitle]";

    foreach ($examContents as $problemNum => $problemContents)
    {
        $hintNum = 0;

        $hintData[$examTitle][$problemNum] = array();

        foreach ($problemContents as $key => $value)
        {
            if(strpos($key,"Hint") !== false)
            {
                $hintData[$examTitle][$problemNum][$hintNum] = [$key,$value];
                $hintNum++;
            }
        }
    }
}
*/

$correctNum = array();
$correctness = array();

foreach ($customerAnswer as $examIndex => $answerList)
{
    $correctNum[$examIndex] = 0;
    $correctness[$examIndex] = array();
    for ($j=0;$j<count($examData[$examIndex]["problem"]);$j++)
    {
        //$customerAnswerArray[$i][$problemNum] = $problemContents["Answer"];
        //$examIndex = array_search()

        //if($answerList[$j] === $examData[$examIndex]["problem"][$j]["Answer"])
        //    $correctNum[$examIndex]++;














        $answer = $answerList[$j];
        $ansArray = array();
        $correctAnswer = $examData[$examIndex]["problem"][$j]["Answer"];

        if(strpos($correctAnswer,",") !== false)
        {
            $startPos = 0;
            while(1)
            {
                $endPos = strpos($correctAnswer,",",$startPos);
                if($endPos === false)
                {
                    array_push($ansArray,trim(substr($correctAnswer,$startPos)));
                    break;
                }

                array_push($ansArray,trim(substr($correctAnswer,$startPos,$endPos-$startPos)));
                $startPos = $endPos+1;
            }
        }
        else
        {
            array_push($ansArray,trim($correctAnswer));
        }

        if(array_search($answer,$ansArray) !== false)
            array_push($correctness[$examIndex],1);
        else
            array_push($correctness[$examIndex],0);

        if($correctness[$examIndex][$j] == 1)
            $correctNum[$examIndex]++;
    }
}

/*
for ($i=0;$i<count($customerAnswer);$i++)
{
    //$customerAnswerArray[$i] = array();
    $correctNum[$i] = 0;

    for ($j=0;$j<count($examData[$i]["problem"]);$j++)
    {
        //$customerAnswerArray[$i][$problemNum] = $problemContents["Answer"];
        //$examIndex = array_search()

        if($customerAnswer[$i][$j] === $examData[$i]["problem"][$j]["Answer"])
            $correctNum[$i]++;
    }
}
*/

//var_dump($customerAnswer);
//var_dump($correctNum);

?>
<!DOCTYPE html>
<meta charset="utf-8">
<html data-theme="light">
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" defer></script>

    <script>let scriptType = "Solution";</script>
    <!--<script src="DigitalSAT_sample_new.js"></script>-->

    <script src="common.js"></script>
    <script src="DSAT_chat.js"></script>
    <script src="ikpsParse.js"></script>
    <script src="ikpsParseStyle.js"></script>
    <script>
        MathJax = {
            tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']]
            },
            svg: {
            fontCache: 'global'
            },
            processEnvironments: true
        };
        let SetValue = {};

        examData = <?= json_encode($examData) ?>;

        let examID = "<?= $examID ?>";
        let bookIndex = "<?= $bookIndex ?>";
        let examList = [<?= $examTitleArrString ?>];
        let problemTotalCount = [<?= $problemTotalCountStr ?>];
        let customerAnswer = <?= json_encode($customerAnswer) ?>;
        let correctNum = <?= json_encode($correctNum) ?>;
    </script>
    <script>
        let mailContent = ''
        window.onload = function(){
            mailContent = '';
<?php
foreach ($customerAnswer as $examIndex => $answerList)
{
    $examTitle = $examData[$examIndex]["examTitle"];

?>
            mailContent += `<div><h2 style="text-align:center;">Result: <?= $examTitle ?></h2>

<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:50px;">
<table style="width:20%;text-align:center;">
<colgroup>
    <col style="width: 200px;">
    <col style="width: 200px;">
</colgroup>
<thead>
<tr>
    <th id="subject">
        Number of Questions
    </th>
    <th id="value">
        Correct Answers
    </th>
</tr>
</thead>
<tbody>
<tr>
    <th>
        <?= count($examData[$examIndex]["problem"]) ?>
    </th>
    <th>
        <?= $correctNum[$examIndex] ?>
    </th>
</tr>
</tbody>
</table></div>

<h2 style="text-align:center;">Answer Details</h2>

<table style="width:55%;margin-left:auto;margin-right:auto;text-align:center;">
<colgroup>
    <col width="75px">
    <col width="150px">
    <col width="150px">
    <col width="75px">
</colgroup>
<thead>
<tr>
    <th id="subject">
        Question Number
    </th>
    <th id="subject">
        Correct Answer
    </th>
    <th id="value">
        Your Answer
    </th>
    <th id="value">
        Correctness
    </th>
</tr>
</thead>
<tbody>
<?php
    for ($j=0;$j<count($answerList);$j++)
    {
        //as $problemNum =>
        $answer = $answerList[$j];
        $ansArray = array();
        $correctAnswer = $examData[$examIndex]["problem"][$j]["Answer"];

        if(strpos($correctAnswer,",") !== false)
        {
            $startPos = 0;
            while(1)
            {
                $endPos = strpos($correctAnswer,",",$startPos);
                if($endPos === false)
                {
                    array_push($ansArray,trim(substr($correctAnswer,$startPos)));
                    break;
                }

                array_push($ansArray,trim(substr($correctAnswer,$startPos,$endPos-$startPos)));
                $startPos = $endPos+1;
            }
        }
        else
        {
            array_push($ansArray,$correctAnswer);
        }
        
        echo "<tr class='hover'>\n";
        echo "<td>\n";
        echo ($j+1);
        echo "</td>\n";
        echo "<td>\n";
        echo $correctAnswer;
        echo "</td>\n";
        
        if(array_search($answer,$ansArray) !== false)
            echo "<td style='color:blue;'>\n";
        else
            echo "<td style='color:red;'>\n";
        echo $answer;
        echo "</td>\n";
        
        if(array_search($answer,$ansArray) !== false)
            echo "<td style='color:blue;'>O\n";
        else
            echo "<td style='color:red;'>X\n";
        echo "</td>\n";
        echo "</tr>\n";
    }
?>
</tbody>
</table>
<hr style="margin-top:30px;margin-bottom:30px;">`;
<?php
}
?>
            sendResultMail_temp('admin@example.com',mailContent,1);
        }
    </script>
    <script src="DSAT_answerConfirm.js"></script>

    <link href="style.css" rel="stylesheet">
    <link href="newSAT.css" rel="stylesheet">
    <link href="IKPSParse.css" rel="stylesheet">
    <link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Lato' rel='stylesheet'>
    <script src="https://kit.fontawesome.com/55edf3a829.js" crossorigin="anonymous"></script>
</head>

<body>

<style>
    body {
        font-size: 20px;
    }

    
</style>

<dialog id="problemReviewDialog" class="modal">
    
    <form method="dialog" class="modal-box w-11/12 max-w-5xl h-3/4">
        <div class="py-4" id="problemReviewTitle">Table</div>
        <div class="py-4 overflow-auto" id="problemReview">MainText</div>
        <div class="py-4 h-3/4 overflow-auto" id="problemReviewHint">Solution</div>
    </form>
    <form method="dialog" class="modal-backdrop">
        <button onclick="closeButton();">close</button>
    </form>
</dialog>


<div style="text-align:center;padding-top:40px;">
    <button class='btn btn-primary' type='button' style='background-color:var(--ALMOOL-color-00);text-transform:none;border:none;font-size:large;' onclick="sendResultMail_temp(prompt('결과를 전송받을 이메일을 입력하십시오.','contact@researchteam.ai'),mailContent,0);">Receive the Results by Mail</button>
    <button class='btn btn-primary' type='button' style='backround-clolor:var(--ALMOOL-color-01);text-transform:none;border:none;font-size:large;' onclick=location.href="http://localhost:8080/DSAT_test.php?examID=<?= $examID ?>"><i class="fa-solid fa-house"></i></a>
</div>


<?php 

//for ($i=0;$i<count($examData);$i++)
foreach ($customerAnswer as $examIndex => $answerList)
{
    $examTitle = $examData[$examIndex]["examTitle"];
?>

<div style="text-align:center;">

<h2 style="margin-top:50px;">Result: <?= $examTitle ?></h2>

<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:50px;">
<table class="table w-96" style="width:20%;text-align:center;">
<colgroup>
    <col style="width: 200px;">
    <col style="width: 200px;">
</colgroup>
<thead>
<tr>
    <th id="subject">
        Number of Questions
    </th>
    <th id="value">
        Correct Answers
    </th>
</tr>
</thead>
<tbody>
<tr>
    <th>
        <?= count($examData[$examIndex]["problem"]) ?>
    </th>
    <th>
        <?= $correctNum[$examIndex] ?>
    </th>
</tr>
</tbody>
</table>


</div>
<br>
</div>

<div style="text-align:center;padding-bottom:40px;">

<h2>Answer Details</h2>

<table class="table w-96" style="width:55%;margin-left:auto;margin-right:auto;text-align:center;">
<colgroup>
    <col width="75px">
    <col width="150px">
    <col width="150px">
    <col width="75px">
    <col width="100px">
    <col width="200px">
</colgroup>
<thead>
<tr>
    <th id="subject">
        Question Number
    </th>
    <th id="subject">
        Correct Answer
    </th>
    <th id="value">
        Your Answer
    </th>
    <th id="value">
        Correctness
    </th>
    <th id="value">
        Review
    </th>
    <th id="aksToTutor">
        Ask Almool
    </th>
</tr>
</thead>
<tbody>
<?php
    for ($j=0;$j<count($answerList);$j++)
    {
        //$problemID = $examData[$examIndex]["problem"][$j]["filePath"];
        $problemID = $examData[$examIndex]["problem"][$j]["folderIndex"] . ":" . $examData[$examIndex]["problem"][$j]["problemName"];
        $answer = $answerList[$j];
        $correctAnswer = $examData[$examIndex]["problem"][$j]["Answer"];
        //as $problemNum =>

        /*
        $answer = $answerList[$j];
        $ansArray = array();
        $correctAnswer = $examData[$examIndex]["problem"][$j]["Answer"];
        

        if(strpos($correctAnswer,",") !== false)
        {
            $startPos = 0;
            while(1)
            {
                $endPos = strpos($correctAnswer,",",$startPos);
                if($endPos === false)
                {
                    array_push($ansArray,trim(substr($correctAnswer,$startPos)));
                    break;
                }

                array_push($ansArray,trim(substr($correctAnswer,$startPos,$endPos-$startPos)));
                $startPos = $endPos+1;
            }
        }
        else
        {
            array_push($ansArray,$correctAnswer);
        }
        */
        
        echo "<tr class='hover'>\n";
        echo "<th>\n";
        echo ($j+1);
        echo "</th>\n";
        echo "<th>\n";
        echo $correctAnswer;
        echo "</th>\n";
        //if(strcmp($examContents[$problemNum]["Answer"], $answer) == 0)
        //if(array_search($answer,$ansArray) !== false)
        if($correctness[$examIndex][$j] == 1)
            echo "<th id='rightValue'>\n";
        else
            echo "<th id='errorValue'>\n";
        echo $answer;
        echo "</th>\n";
        //if(strcmp($examContents[$problemNum]["Answer"], $answer) == 0)
        //if(array_search($answer,$ansArray) !== false)
        if($correctness[$examIndex][$j] == 1)
            echo "<th id='rightValue'>O\n";
        else
            echo "<th id='errorValue'>X\n";
        echo "</th>\n";
        echo "<th><button class='btn btn-primary' style='background-color:var(--ALMOOL-color-01);text-transform:none;border:none;font-size:large;' type='button' onclick='showReview($examIndex,$j)'>Review</button></th>\n";

        

        //echo "<th><button class='btn btn-success' type='button' onclick=\"askToTutor(problemList['$examTitle'][$problemNum].mainText,problemList['$examTitle'][$problemNum].objAnswer,examData['$examTitle'][$problemNum]['Answer'],examData['$examTitle'][$problemNum]['Solution']);\">Ask To Tutor</button></th>\n";
        //echo "<td><button class='btn btn-success' type='button' style='background-color:var(--ALMOOL-color-02);text-transform:none;border:none;font-size:large;' onclick=\"askToTutor('$bookIndex','$problemID');\">Ask To Tutor</button></td>\n";
        echo "<td><div class='problemAskToTutor' onclick=\"askToTutor('$examID','$bookIndex','$problemID','$chatDomain');\"><i class=\"fa-regular fa-comments\" aria-hidden=\"true\"></i></div></td>\n";
        echo "</tr>\n";
    }

    /*
    for($j=0;$j<count($customerAnswer[$i]);$j++)
    {
        //as $problemNum =>
        $answer = $customerAnswer[$i][$j];
        $ansArray = array();
        $correctAnswer = $examData[$i]["problem"][$j]["Answer"];
        
        $problemID = $examData[$i]["problem"][$j]["filePath"];

        if(strpos($correctAnswer,",") !== false)
        {
            $startPos = 0;
            while(1)
            {
                $endPos = strpos($correctAnswer,",",$startPos);
                if($endPos === false)
                {
                    array_push($ansArray,trim(substr($correctAnswer,$startPos)));
                    break;
                }

                array_push($ansArray,trim(substr($correctAnswer,$startPos,$endPos-$startPos)));
                $startPos = $endPos+1;
            }
        }
        else
        {
            array_push($ansArray,$correctAnswer);
        }
        
        echo "<tr class='hover'>\n";
        echo "<th>\n";
        echo ($j+1);
        echo "</th>\n";
        echo "<th>\n";
        echo $correctAnswer;
        echo "</th>\n";
        //if(strcmp($examContents[$problemNum]["Answer"], $answer) == 0)
        if(array_search($answer,$ansArray) !== false)
            echo "<th id='rightValue'>\n";
        else
            echo "<th id='errorValue'>\n";
        echo $answer;
        echo "</th>\n";
        //if(strcmp($examContents[$problemNum]["Answer"], $answer) == 0)
        if(array_search($answer,$ansArray) !== false)
            echo "<th id='rightValue'>O\n";
        else
            echo "<th id='errorValue'>X\n";
        echo "</th>\n";
        echo "<th><button class='btn btn-primary' type='button' onclick='showReview($i,$j)'>Review</button></th>\n";

        

        //echo "<th><button class='btn btn-success' type='button' onclick=\"askToTutor(problemList['$examTitle'][$problemNum].mainText,problemList['$examTitle'][$problemNum].objAnswer,examData['$examTitle'][$problemNum]['Answer'],examData['$examTitle'][$problemNum]['Solution']);\">Ask To Tutor</button></th>\n";
        echo "<th><button class='btn btn-success' type='button' onclick=\"askToTutor('$bookIndex','$problemID');\">Ask To Tutor</button></th>\n";
        echo "</tr>\n";
    }
    */
?>
</tbody>
</table>
</div>

<?php
}
?>

</body>
</html>
