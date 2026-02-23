<?php
error_reporting( E_ALL );
ini_set( "display_errors", 1 );

    include 'DigitalSAT_loginCommonHead.php';

    $post = json_decode(file_get_contents('php://input'));

    if($isLogined == false && isset($post->ID) && isset($post->PW))
    {
        $db = initDB();

        $userPW = hash("sha3-256",$PWPrefix . $post->PW . $PWSuffix);

        $stmt = $db->prepare("SELECT userID,name FROM UserInfo WHERE userID=:id AND userPW=:pw LIMIT 1");
        $stmt->bindValue(':id', $post->ID, SQLITE3_TEXT);
        $stmt->bindValue(':pw', $userPW, SQLITE3_TEXT);
        $result = $stmt->execute();

        if($row = $result->fetchArray())
        {
            $_SESSION["userID"] = $post->ID;
            echo "success";
        }
        else
        {
            echo "failed1";
        }

        $db->close();
    }
    else
    {
        echo "failed2";
    }
?>
