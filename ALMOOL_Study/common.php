<?php

function sendHTTPSPost($targetURL,$dataArray=[],$headerArray=[])
{
    $post_field_string = http_build_query($dataArray,'','&');
    $ch = curl_init();                              // curl 초기화

    curl_setopt($ch,CURLOPT_URL,$targetURL);                // url 지정하기
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);       // 요청결과를 문자열로 반환
    curl_setopt($ch,CURLOPT_HTTPHEADER,$headerArray);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,10);       // connection timeout : 10초
    curl_setopt($ch,CURLOPT_SSL_VERIFYPEER,false);        // 원격 서버의 인증서가 유효한지 검사 여부
    curl_setopt($ch,CURLOPT_POSTFIELDS,$post_field_string);   // POST DATA
    curl_setopt($ch,CURLOPT_POST,true);               // POST 전송 여부

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

function sendHTTPSPost_JSON($targetURL,$dataJSON='',$headerArray=[])
{
    $ch = curl_init();                              // curl 초기화

    curl_setopt($ch,CURLOPT_URL,$targetURL);                // url 지정하기
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);       // 요청결과를 문자열로 반환
    curl_setopt($ch,CURLOPT_HTTPHEADER,$headerArray);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,10);       // connection timeout : 10초
    curl_setopt($ch,CURLOPT_SSL_VERIFYPEER,false);        // 원격 서버의 인증서가 유효한지 검사 여부
    curl_setopt($ch,CURLOPT_POSTFIELDS,$dataJSON);   // POST DATA
    curl_setopt($ch,CURLOPT_POST,true);               // POST 전송 여부

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

?>