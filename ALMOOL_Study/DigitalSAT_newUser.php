<?php
    include 'DigitalSAT_loginCommonHead.php';
    $db = initDB();

    $userID = (isset($_POST['userID'])) ? $_POST['userID'] : "";
    $userPW = (isset($_POST['userPW'])) ? $_POST['userPW'] : "";
    $email = (isset($_POST['email'])) ? $_POST['email'] : "";
    $name = (isset($_POST['name'])) ? $_POST['name'] : "";

    $stmt = $db->prepare("SELECT * FROM UserInfo WHERE userID=:id");
    $stmt->bindValue(':id', $userID, SQLITE3_TEXT);
    $result = $stmt->execute();

    if(!$result->fetchArray())
    {
        $now = new DateTime();
        $nowStr = date('Y-m-d H:i:s');

        $stmt = $db->prepare("INSERT INTO UserInfo (userID, userPW, email, name, signedDate) VALUES(:id, :pw, :email, :name, :date)");
        $stmt->bindValue(':id', $userID, SQLITE3_TEXT);
        $stmt->bindValue(':pw', $userPW, SQLITE3_TEXT);
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':date', $nowStr, SQLITE3_TEXT);
        $stmt->execute();
        echo "$name 님, 회원 가입을 축하드립니다.";
    }
    else
    {
        echo "$userID 는 이미 가입하였습니다.";
    }

    $db->close();
?>
