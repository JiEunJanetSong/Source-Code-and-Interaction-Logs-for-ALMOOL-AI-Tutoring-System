"use strict";
let defaultEnvParameterNumList = {
    "default": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["preserve", "preserve"]
    }
};
let defaultSearchList = {
    "\\begin": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "preserve" },
        isURLParameter: [false]
    },
    "\\end": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "preserve" },
        isURLParameter: [false]
    },
    "\\SetValue": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "preserve" },
        isURLParameter: [false, false]
    }
};
function isspace(ch) {
    let c = ch.charCodeAt(0);
    if (c >= 0x09 && c <= 0x0d || c == 0x20)
        return true;
    return false;
}
function isNewLine(c) {
    return (c == '\n');
}
function isalpha(ch) {
    let c = ch.charCodeAt(0);
    if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A))
        return true;
    return false;
}
function findNextSpace(str, startPos, upperBound) {
    let pos = startPos;
    for (; pos < upperBound; pos++) {
        if (isspace(str[pos]) === true)
            break;
    }
    return pos;
}
function findNextNonSpace(str, startPos, upperBound = str.length) {
    let pos = startPos;
    for (; pos < upperBound; pos++) {
        if (isspace(str[pos]) === false)
            break;
    }
    return pos;
}
/**[[문자열,길이],다음 검색 위치] 리턴*/
function findParameter(searchList, str, startPos, upperBound = str.length, isOptional = false, isTrim = true) {
    let openPar = (isOptional) ? '[' : '{';
    let closePar = (isOptional) ? ']' : '}';
    let pos = findNextNonSpace(str, startPos, upperBound);
    let start = pos;
    let end = pos;
    if (isOptional && str[pos] != openPar)
        return ["", startPos];
    if (str[pos] == openPar && (pos == 0 || str[pos - 1] != '\\' || (pos > 1 && str[pos - 1] == '\\' && str[pos - 2] == '\\'))) {
        if (isTrim)
            pos = findNextNonSpace(str, pos + 1, upperBound);
        else
            pos++;
        start = pos;
        end = pos;
        let parLev = 1;
        for (pos = start; pos < upperBound; pos++) {
            if (str[pos] == openPar && (str[pos - 1] != '\\' || (str[pos - 1] == '\\' && str[pos - 2] == '\\')))
                parLev++;
            else if (str[pos] == closePar && (str[pos - 1] != '\\' || (str[pos - 1] == '\\' && str[pos - 2] == '\\')))
                parLev--;
            if (parLev == 0)
                break;
            if ((isTrim == true && isspace(str[pos]) == false) || isTrim == false)
                end = pos + 1;
        }
    }
    else {
        // 중괄호 생략된 경우 인수가 \로 시작하는 경우
        if (str[pos] == '\\') {
            let functionName = "";
            for (const key in searchList) {
                if (str.indexOf(key, pos) == pos) {
                    functionName = key;
                    break;
                }
            }
            if (functionName != "") {
                let parseParameterResult = parseParameter(searchList, functionName, str, pos, str.length);
                return [str.substring(pos, parseParameterResult["endPos"]), parseParameterResult["endPos"]];
            }
        }
        else {
            // 중괄호 생략된 경우 인수가 \로 시작하지 않는 경우
            start = pos;
            end = pos + 1;
        }
    }
    return [str.substring(start, end), pos + 1];
}
// abc=def,bvr=esv,scale=0.5 와 같은 문자열에서 key-value 쌍을 찾음
function parseCommaParameter(str) {
    let parLev1 = 0;
    let parLev2 = 0;
    let result = {};
    let startPos = 0;
    let valueStartPos = 0;
    let key = "";
    let value = "";
    result["##originalString##"] = str;
    for (let pos = 0; pos < str.length; pos++) {
        if (str[pos] == '{' && str[pos - 1] != '\\')
            parLev1++;
        else if (str[pos] == '}' && str[pos - 1] != '\\')
            parLev1--;
        else if (str[pos] == '[' && str[pos - 1] != '\\')
            parLev2++;
        else if (str[pos] == ']' && str[pos - 1] != '\\')
            parLev2--;
        if (parLev1 == 0 && parLev2 == 0) {
            if (str[pos] == '=' && key == "") {
                key = str.substring(startPos, pos).trim();
                valueStartPos = pos + 1;
            }
            else if (str[pos] == ',' || pos == str.length - 1) {
                if (str[pos] != ',')
                    value = str.substring(valueStartPos, pos + 1).trim();
                else
                    value = str.substring(valueStartPos, pos).trim();
                //if(value != "")
                result[key] = value;
                startPos = pos + 1;
                valueStartPos = startPos;
                key = "";
                value = "";
            }
        }
    }
    if (key != "" && Object.keys(result).indexOf(key) == -1)
        result[key] = str.substring(valueStartPos).trim();
    return result;
}
//function parseParameter(functionName:string,parameterNum:number,contents:string,startPos:number,upperBound:number=contents.length,optionalParType:number=0)
function parseParameter(searchList, functionName, contents, startPos, upperBound = contents.length) {
    let parameterNum = searchList[functionName]["parameterNum"];
    let optionalParType = searchList[functionName]["optionalParameterType"];
    let pos = contents.indexOf(functionName, startPos);
    if (pos == -1)
        return { "startPos": pos, "endPos": -1 };
    else if (isalpha(contents[pos + functionName.length]) == true)
        return { "startPos": pos, "endPos": -2 };
    let result = Array();
    result["startPos"] = pos;
    result["functionName"] = functionName;
    result["parameter"] = [];
    //result["optionalParameter"] = [];
    result["optionalParameter"] = {};
    result["optionalParameterType"] = optionalParType;
    pos += functionName.length;
    let firstNonSpace = findNextNonSpace(contents, pos, upperBound);
    if (contents[firstNonSpace] == '*')
        pos = firstNonSpace + 1;
    let parNum = parameterNum;
    let parType = optionalParType;
    if (functionName == "\\begin") {
        let envData = findParameter(searchList, contents, pos, upperBound, false);
        let nowEnv = envData[0];
        pos = envData[1];
        result["parameter"].push(nowEnv);
        if (Object.keys(envParameterNumList).indexOf(nowEnv) != -1) {
            parNum = envParameterNumList[nowEnv]['parameterNum'] - 1;
            parType = envParameterNumList[nowEnv]['optionalParameterType'];
        }
        else {
            parNum = envParameterNumList['default']['parameterNum'] - 1;
            parType = envParameterNumList['default']['optionalParameterType'];
        }
        result["optionalParameterType"] = parType;
    }
    else if (functionName == "\\end") {
        parNum = 1;
        parType = 0;
    }
    if (parType == 1) {
        let optionalParameterData = findParameter(searchList, contents, pos, upperBound, true);
        let optionalParameter = optionalParameterData[0];
        pos = optionalParameterData[1];
        //if(optionalParameter != "")
        result["optionalParameter"] = parseCommaParameter(optionalParameter);
    }
    for (let j = 0; j < parNum; j++) {
        let parameterData = findParameter(searchList, contents, pos, upperBound, false);
        let parameter = parameterData[0];
        pos = parameterData[1];
        result["parameter"].push(parameter);
    }
    if (parType == 2) {
        let optionalParameterData = findParameter(searchList, contents, pos, upperBound, true);
        let optionalParameter = optionalParameterData[0];
        pos = optionalParameterData[1];
        //if(optionalParameter != "")
        result["optionalParameter"] = parseCommaParameter(optionalParameter);
    }
    result["endPos"] = pos;
    return result;
}
//{isspace,isalpha,findNextSpace,findNextNonSpace,findParameter,parseParameter}
