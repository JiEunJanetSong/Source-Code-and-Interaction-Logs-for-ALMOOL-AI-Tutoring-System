<?php
    include 'DigitalSAT_loginCommonHead.php';
    $db = initDB();
    $userID = $_SESSION['userID'];

    $stmt = $db->prepare("SELECT userID,name FROM UserInfo WHERE userID=:id");
    $stmt->bindValue(':id', $userID, SQLITE3_TEXT);
    $result = $stmt->execute();
    $userNameStr = "";

    if($row = $result->fetchArray())
    {
        $userName = $row[1];
        $userNameStr = "$userName 님";
    }
    else
    {
        $userNameStr = "로그인";
    }

    $db->close();
?>

<!DOCTYPE html>
<meta charset="utf-8">
<html data-theme="light">
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="style.css" rel="stylesheet">
</head>


<script>
function showUserInfo()
{
    let userInfo = "";

    userInfo += "<p>이름: <?= $userName ?></p>";

    document.getElementById("showData").innerHTML = userInfo;
}

let examNumber;
let examData;
let examResultData;

function getExamData()
{
    examNumber = 8;
    examData = Array(examNumber);
    examResultData = Array(examNumber);
}

function initExamData()
{
    getExamData();

    for(let i=0;i<examNumber;i++)
    {
        examData[i] = [false,"","",""]; // [유효 여부, 시험 제목, 시험 설명, 시험지 링크]
        examResultData[i] = [false,"",""]; // [응시 여부, 정답 리스트 문자열, 제출 정답 리스트 문자열]
    }

    examData[0] = [true,"Exam1","DigitalSAT_1","DigitalSAT_sample.html"];
    examResultData[i] = [false,"",""];
}

function showExamList()
{
    let examDataCode = "";

    for(let i=0;i<examNumber;i++)
    {
        if(examData[i][0] == true)
        {
            examDataCode += "<div class='card w-1/6 bg-accent text-accent-content'>";
            examDataCode += "<div class='card-body items-center text-center'>";
            examDataCode += "    <h2 class='card-title'>" + examData[i][1] + "</h2>";
            examDataCode += "    <p>" + examData[i][2] + "</p>";
            examDataCode += "    <div class='card-actions justify-end'>";
            examDataCode += "    <button type='button' class='btn btn-secondary' onclick=\"location.href='" + examData[i][3] + "';\">Start</button>";
            examDataCode += "    </div>";
            examDataCode += "</div>";
            examDataCode += "</div>";
        }
        else
        {
            examDataCode += "<div class='card w-1/6 bg-accent text-neutral-content'>";
            examDataCode += "    <div class='card-body items-center text-center'>";
            examDataCode += "      <h2 class='card-title'>Exam " + (i+1) + "</h2>";
            examDataCode += "      <p>Exam Not Ready</p>";
            examDataCode += "      <div class='card-actions justify-end'>";
            examDataCode += "        <button type='button' class='btn btn-neutral' style='cursor:not-allowed;'>Preparing</button>";
            examDataCode += "      </div>";
            examDataCode += "    </div>";
            examDataCode += "</div>";
        }
    }

    document.getElementById("showData").innerHTML = examDataCode;
}

function showResultList()
{
    let resultDataCode = "";

    for(let i=0;i<examNumber;i++)
    {
        if(examData[i][0] == true)
        {
            if(examResultData[i][0] == true)
            {
                resultDataCode += "<div class='card w-1/6 bg-accent text-accent-content'>";
                resultDataCode += "<div class='card-body items-center text-center'>";
                resultDataCode += "    <h2 class='card-title'>" + examData[i][1] + "</h2>";
                resultDataCode += "    <p>" + examData[i][2] + "</p>";
                resultDataCode += "    <div class='card-actions justify-end'>";
                resultDataCode += "    <button type='button' class='btn btn-secondary' onclick=\"location.href='" + examData[i][3] + "';\">Show Result</button>";
                resultDataCode += "    </div>";
                resultDataCode += "</div>";
                resultDataCode += "</div>";
            }
            else
            {
                resultDataCode += "<div class='card w-1/6 bg-accent text-neutral-content'>";
                resultDataCode += "    <div class='card-body items-center text-center'>";
                resultDataCode += "    <h2 class='card-title'>" + examData[i][1] + "</h2>";
                resultDataCode += "      <p>Show result after the exam</p>";
                resultDataCode += "      <div class='card-actions justify-end'>";
                resultDataCode += "        <button type='button' class='btn btn-neutral' style='cursor:not-allowed;'>Not Applied</button>";
                resultDataCode += "      </div>";
                resultDataCode += "    </div>";
                resultDataCode += "</div>";
            }
            
        }
        else
        {
            resultDataCode += "<div class='card w-1/6 bg-accent text-neutral-content'>";
            resultDataCode += "    <div class='card-body items-center text-center'>";
            resultDataCode += "      <h2 class='card-title'>Exam " + (i+1) + "</h2>";
            resultDataCode += "      <p>Exam Not Ready</p>";
            resultDataCode += "      <div class='card-actions justify-end'>";
            resultDataCode += "        <button type='button' class='btn btn-neutral' style='cursor:not-allowed;'>Preparing</button>";
            resultDataCode += "      </div>";
            resultDataCode += "    </div>";
            resultDataCode += "</div>";
        }
    }

    document.getElementById("showData").innerHTML = resultDataCode;
}

$(document).ready( function () {

    initExamData();
    showExamList();

});

</script>

<body class="text-2xl">


<div class="flex flex-row justify-center" style="background-color: #00ffff;height: 50px; padding: 6px 0;">
    <div class="basis-auto text-center" style="background-color: none; cursor: pointer;" onclick="location.href='https://naver.com';">
        Digital SAT
    </div>
</div>

<div class="flex flex-row">
    <div class="basis-1/6 text-center" style="background-color: none; height:500px;">
        <p class="align-middle" style="height:50px; padding: 8px 0;">
            <?= $userName ?> 님
        </p>
        <p class="hover:bg-sky-300 align-middle" style="cursor: pointer; height:50px; padding: 8px 0;" onclick="showUserInfo();">
            내 정보
        </p>
        <p class="hover:bg-sky-300 align-middle" style="cursor: pointer; height:50px; padding: 8px 0;" onclick="showExamList();">
            시험 선택
        </p>
        <p class="hover:bg-sky-300 align-middle" style="cursor: pointer; height:50px; padding: 8px 0;" onclick="showResultList();">
            결과 보기
        </p>
    </div>
    <div class="basis-3/4 text-center" style="background-color: none;padding: 30px 5%;">
        <div class="grid grid-cols-3 gap-10" id="showData">
            
        </div>
    </div>
</div>

</html>

































<?php
    include 'loginCommonHead.php';

    $loginErrorMessage = "";
    $type = "0";
    $personName = "";

    if (isset($_POST['type']))
    {
        $type = $_POST['type'];
        
        //로그아웃 버튼을 누른 경우
        if($type == "1")
        {
            session_destroy();
            $isLogin = FALSE;
            $type = "0";
        }
        //비밀번호 재설정인 경우
        else if($type == "2")
        {
            //재설정 페이지에서 재설정 버튼을 누른 경우
            if(isset($_POST['username']))
            {
                $conn = initDB();

                $username = $_POST['username'];
                $prevPWD = $_POST['prevPW'];
                $newPW1 = $_POST['newPW1'];
                $newPW2 = $_POST['newPW2'];

                if($newPW1 != $newPW2)
                {
                    $loginErrorMessage = "새 비밀번호가 일치하지 않습니다.";
                }
                else
                {
                    $db = initDB();
                    $stmt = $db->prepare("SELECT personID,PWD FROM PersonList WHERE personID=:id");
                    $stmt->bindValue(':id', $username, SQLITE3_TEXT);
                    $searchResult = $stmt->execute();
                    $updateSuccess = FALSE;

                    if($searchedValue = $searchResult->fetchArray())
                    {
                        if($searchedValue[1] == md5($prevPWD))
                        {
                            $stmt2 = $db->prepare("UPDATE PersonList SET PWD=:pw WHERE personID=:id");
                            $stmt2->bindValue(':pw', md5($newPW1), SQLITE3_TEXT);
                            $stmt2->bindValue(':id', $username, SQLITE3_TEXT);
                            if($stmt2->execute())
                            {
                                if($db->changes() != 0)
                                    $updateSuccess = TRUE;
                            }
                        }
                    }
                    $db->close();

                    if($updateSuccess == TRUE)
                    {
                        session_destroy();
                        $isLogin = FALSE;
                        $loginErrorMessage = "변경된 비밀번호로 다시 로그인 하십시오.";
                        $type = "0";
                    }
                    else
                    {
                        $loginErrorMessage = "아이디 혹은 비밀번호를 확인해주세요.";
                    }
                }
            }
        }
    }
    //로그인 버튼을 눌러 로그인을 시도한 경우
    else if(isset($_POST['username']))
    {
        $db = initDB();

        $username = $_POST['username'];
        $password = $_POST['password'];

        $stmt = $db->prepare("SELECT * FROM PersonList WHERE personID=:id");
        $stmt->bindValue(':id', $username, SQLITE3_TEXT);
        $searchResult = $stmt->execute();

        if($searchedValue = $searchResult->fetchArray())
        {
            if($searchedValue[2] == md5($password))
            {
                $_SESSION['personID'] = $searchedValue[0];
                $_SESSION['name'] = $searchedValue[1];
                $isLogin = TRUE;
            }
            else
            {
                $loginErrorMessage = "아이디 혹은 비밀번호를 확인해주세요.";
            }
        }
        else
        {
            $loginErrorMessage = "아이디 혹은 비밀번호를 확인해주세요.";
        }
    }
?>
<!doctype html>
<html lang="ko">
    <head>
        <meta charset="utf-8">
        <title><?php
            if ( $isLogin )
                echo "도서관 도서 검색";
            else
            {
                if($type == "0")
                    echo "로그인";
                else if($type == "2")
                    echo "비밀번호 재설정";
            }
        ?></title>
    </head>
    <body>
        <?php
            if ( $isLogin )
            {
                $fp = fopen("SDBookBarcode/loginSuccessContents.html", "r") or die("파일 읽기 오류");
                $personName = $_SESSION['name'];

                echo "<script>\nlet personID=\"" . $_SESSION['personID'] . "\";\n</script>\n";
                while( !feof($fp) )
                {
                    $str = fgets($fp);
                    echo str_replace("<b>123321</b>","<b>" . $personName. "</b>",$str);
                }
            }
            else
            {
                if($type == "0")
                {
        ?>
        <h1>로그인</h1>
        <form action="/" method="POST">
            <input type="text" name="username" placeholder="Username">
            <input type="password" name="password" placeholder="Password">
            <button>로그인</button>
        </form>
        <form action="/" method="POST">
            <button>비밀번호 재설정</button>
            <input type="hidden" name="type" value="2">
        </form>
        <?php
                    echo $loginErrorMessage;
                }
                else if($type == "2")
                {
        ?>
        <h1>비밀번호 재설정</h1>
        <form action="/" method="POST" style="display: inline;">
            <div style="width:200px;">아이디</div>
            <input type="text" name="username"><br>
            <div style="width:200px;">현재 비밀번호</div>
            <input type="password" name="prevPW"><br>
            <div style="width:200px;">새 비밀번호</div>
            <input type="password" name="newPW1"><br>
            <div style="width:200px;">비밀번호 확인</div>
            <input type="password" name="newPW2"><br>
            <button style="margin-top:10px;margin-bottom:10px;">재설정</button>
            <input type="hidden" name="type" value="2">
        </form>
        <form action="/" method="POST" style="display: inline;">
            <button style="margin-top:10px;margin-bottom:10px;">이전으로</button>
        </form><br>
        <?php
                    echo $loginErrorMessage;
                }
            }
        ?>
    </body>
</html>