"use strict";
//import * as TeXParser from './common';
let chatLog = {};
function parseIKPS(str, upperBound = str.length) {
    let data = Array();
    for (const key in searchList) {
        let startPos = 0;
        while (1) {
            let parseResult = parseParameter(searchList, key, str, startPos, upperBound);
            if (parseResult["endPos"] >= 0)
                data.push(parseResult);
            else if (parseResult["endPos"] == -1)
                break;
            else if (parseResult["endPos"] == -2) {
                startPos = parseResult["startPos"] + key.length;
                continue;
            }
            startPos = parseResult["endPos"];
        }
    }
    data.sort(function (a, b) {
        return a["startPos"] - b["startPos"];
    });
    return data;
}
function preserveParameter(data) {
    let result = data["functionName"];
    if (data['optionalParameterType'] == 1)
        result += `[${data["optionalParameter"]["##originalString##"]}]`;
    for (let i = 0; i < data['parameter'].length; i++)
        result += `{${data['parameter'][i]}}`;
    if (data['optionalParameterType'] == 2)
        result += `[${data["optionalParameter"]["##originalString##"]}]`;
    return result;
}
function processParameter(data, changeString, baseURL = "", isURLParameter = []) {
    let result = changeString;
    //result = result.replace(/</g,'(__openPar__)');
    //result = result.replace(/>/g,'(__closePar__)');
    if (data['optionalParameterType'] == 0 || data['optionalParameterType'] == 2) {
        for (let i = 0; i < data['parameter'].length; i++) {
            const regEx = new RegExp(`#${i + 1}`, 'g');
            let par = (data['parameter'][i] != undefined && data['parameter'][i] != null) ? data['parameter'][i] : "";
            if (isURLParameter.length > 0 && isURLParameter[i] == true)
                result = result.replace(regEx, `${baseURL}/${par}`);
            else
                result = result.replace(regEx, par);
        }
        if (data['optionalParameterType'] == 2) {
            let lastIndex = data['parameter'].length;
            const regEx = new RegExp(`#${lastIndex + 1}`, 'g');
            let optionalPar = (data["optionalParameter"]["##originalString##"] != undefined && data["optionalParameter"]["##originalString##"] != null) ? data["optionalParameter"]["##originalString##"] : "";
            if (isURLParameter.length > lastIndex && isURLParameter[lastIndex] == true)
                result = result.replace(regEx, `${baseURL}/${optionalPar}`);
            else
                result = result.replace(regEx, optionalPar);
            for (const key in data["optionalParameter"]) {
                if (key != "##originalString##" && key != "") {
                    const regEx2 = new RegExp(`!!#${key}#!!`, 'g');
                    result = result.replace(regEx2, data["optionalParameter"][key]);
                }
            }
        }
    }
    else if (data['optionalParameterType'] == 1) {
        let optionalPar = (data["optionalParameter"]["##originalString##"] != undefined && data["optionalParameter"]["##originalString##"] != null) ? data["optionalParameter"]["##originalString##"] : "";
        if (isURLParameter.length > 0 && isURLParameter[0] == true)
            result = result.replace(/#1/g, `${baseURL}/${optionalPar}`);
        else
            result = result.replace(/#1/g, optionalPar);
        for (let i = 0; i < data['parameter'].length; i++) {
            const regEx = new RegExp(`#${i + 2}`, 'g');
            let par = (data['parameter'][i] != undefined && data['parameter'][i] != null) ? data['parameter'][i] : "";
            if (isURLParameter.length > 0 && isURLParameter[i + 1] == true)
                result = result.replace(regEx, `${baseURL}/${par}`);
            else
                result = result.replace(regEx, par);
        }
        for (const key in data["optionalParameter"]) {
            if (key != "##originalString##" && key != "") {
                const regEx2 = new RegExp(`!!#${key}#!!`, 'g');
                result = result.replace(regEx2, data["optionalParameter"][key]);
            }
        }
    }
    return result;
}
function processCurlyBracket(str) {
    let result = str;
    let posList = Array();
    let startPos = 0;
    while (1) {
        startPos = str.indexOf("$", startPos);
        if (startPos == -1)
            break;
        if ((startPos > 0 && str[startPos - 1] != '\\') || startPos == 0)
            posList.push(startPos);
        startPos += 1;
    }
    startPos = 0;
    while (1) {
        startPos = str.indexOf("\\begin{align*}", startPos);
        if (startPos == -1)
            break;
        posList.push(startPos);
        startPos += 10;
    }
    startPos = 0;
    while (1) {
        startPos = str.indexOf("\\end{align*}", startPos);
        if (startPos == -1)
            break;
        posList.push(startPos);
        startPos += 10;
    }
    startPos = 0;
    while (1) {
        startPos = str.indexOf("\\begin{alignat*}", startPos);
        if (startPos == -1)
            break;
        posList.push(startPos);
        startPos += 10;
    }
    startPos = 0;
    while (1) {
        startPos = str.indexOf("\\end{alignat*}", startPos);
        if (startPos == -1)
            break;
        posList.push(startPos);
        startPos += 10;
    }
    posList.sort(function (a, b) {
        return parseInt(a) - parseInt(b);
    });
    return result;
}
function getParagraphList(str) {
    let startPos = 0;
    let searchPos = 0;
    let result = [];
    //console.log(str);
    while (1) {
        let newLinePos = str.indexOf('\n', searchPos);
        let nextPos = -1;
        let splitParagraph = false;
        if (newLinePos == -1)
            break;
        let i = 0;
        for (i = newLinePos + 1; i < str.length && isspace(str[i]) == true; i++) {
            if (isNewLine(str[i])) {
                splitParagraph = true;
            }
        }
        if (splitParagraph) {
            let resultString = str.substring(startPos, i).trim();
            if (resultString != '')
                result.push(resultString);
            startPos = i;
        }
        searchPos = i;
    }
    let resultString = str.substring(startPos, str.length).trim();
    if (resultString != '')
        result.push(resultString);
    return result;
}
/**
 수식은 $까지 포함한 범위를 리턴
 */
function parseMathRange(str) {
    //mode: 0=평문, 1=인라인 수식, 2=display 수식
    let mode = 0;
    let startPos = 0;
    let result = [];
    for (let i = 0; i < str.length; i++) {
        if (mode == 0) {
            if (str.startsWith("$", i)) {
                if (str[i - 1] != '\\') {
                    result.push({ type: 'plainText', start: startPos, end: i });
                    startPos = i;
                    if (str[i + 1] == '$') {
                        mode = 2;
                    }
                    else {
                        mode = 1;
                    }
                }
            }
            else if (str.startsWith("\\begin{align*}", i)) {
                result.push({ type: 'plainText', start: startPos, end: i });
                startPos = i;
                mode = 2;
                i += 13;
            }
            else if (str.startsWith("\\begin{alignat*}", i)) {
                result.push({ type: 'plainText', start: startPos, end: i });
                startPos = i;
                mode = 2;
                i += 15;
            }
        }
        else if (mode == 1) {
            if (str.startsWith("$", i)) {
                if (str[i - 1] != '\\') {
                    result.push({ type: 'inlineMath', start: startPos, end: i + 1 });
                    startPos = i + 1;
                    mode = 0;
                }
            }
            /*
            else if(str.startsWith("\\text",i))
            {
              let parameter = findParameter(str,i+5,str.length,false,false);
              let parameterStartPos = str.indexOf(parameter[0],startPos);
      
              result.push({type:'inlineMath',start:startPos,end:parameterStartPos});
              startPos = parameterStartPos;
              
              let nestedResult = parseMathRange(parameter[0]);
              for(let j=0;j<nestedResult.length;j++)
              {
                nestedResult[j]['start'] += parameterStartPos;
                nestedResult[j]['end'] += parameterStartPos;
                result.push(nestedResult[j]);
              }
      
              startPos = parameterStartPos + parameter[0].length;
              i = parameter[1]-1;
            }
            */
        }
        else if (mode == 2) {
            if (str.startsWith("$$", i)) {
                if (str[i - 1] != '\\') {
                    result.push({ type: 'displayMath', start: startPos, end: i + 2 });
                    startPos = i + 2;
                    mode = 0;
                    i += 1;
                }
            }
            else if (str.startsWith("\\end{align*}", i)) {
                result.push({ type: 'displayMath', start: startPos, end: i + 12 });
                startPos = i + 12;
                mode = 0;
                i += 11;
            }
            else if (str.startsWith("\\end{alignat*}", i)) {
                result.push({ type: 'displayMath', start: startPos, end: i + 12 });
                startPos = i + 14;
                mode = 0;
                i += 13;
            }
            /*
            else if(str.startsWith("\\text",i))
            {
              let parameter = findParameter(str,i+5,str.length,false,false);
              let parameterStartPos = str.indexOf(parameter[0],startPos);
      
              result.push({type:'displayMath',start:startPos,end:parameterStartPos});
              startPos = parameterStartPos;
              
              let nestedResult = parseMathRange(parameter[0]);
              for(let j=0;j<nestedResult.length;j++)
              {
                nestedResult[j]['start'] += parameterStartPos;
                nestedResult[j]['end'] += parameterStartPos;
                result.push(nestedResult[j]);
              }
      
              startPos = parameterStartPos + parameter[0].length;
              i = parameter[1]-1;
            }
            */
        }
    }
    if (mode == 0) {
        result.push({ type: 'plainText', start: startPos, end: str.length });
    }
    return result;
}
let enumerateState = [];
let enumInfo = {};
let enumString = [];
//str에 enumItemCode가 포함되어 있는 경우에 한하여 작동, [변환 결과,\item의 변환 결과를 리턴]
function processItem(str, enumItemCode, enumInfo, enumIndex, enumChangeArray = enumerateChangeValueWithLabel) {
    let result = str;
    if (result.indexOf(enumItemCode) != -1) {
        let hasLabel = (Object.keys(enumInfo).indexOf("label") != -1);
        let enumItemResult = (hasLabel) ? enumInfo["label"] : enumInfo["##originalString##"];
        if (enumItemResult.endsWith(" ") == false)
            enumItemResult += " ";
        for (const key in enumChangeArray) {
            if (enumItemResult.indexOf(key) != -1) {
                enumItemResult = enumItemResult.replace(key, enumChangeArray[key][enumIndex]);
                //console.log(`${key} -> ${enumChangeArray[key][enumIndex]}`);
                break;
            }
        }
        result = result.replace(enumItemCode, " ").replace(/^\s*/, `${enumItemResult} `);
        result = processIKPSGrammer(result, "", false, false);
        return { processResult: result, itemResult: enumItemResult };
    }
    else {
        return { processResult: result, itemResult: "" };
    }
}
//[state,본문,\item 변환 결과]를 리턴
function parseEnumerate(str, enumStartCode = "!@@EnumStart@!@", enumEndCode = "!@@EnumEnd@@!", enumItemCode = "!@@ENUMITEM@@!", convertItemCode = true, env = "enumerate") {
    let result = str;
    let state = -1;
    let itemStr = "";
    let enumStartPos = result.indexOf(enumStartCode);
    if (enumStartPos != -1) {
        state = 0;
        let enumInfoStart = enumStartPos + enumStartCode.length;
        let enumInfoEnd = result.indexOf("@@!");
        //enumInfo = result.substring(enumInfoStart,enumInfoEnd);
        if (enumInfoStart < enumInfoEnd)
            enumInfo = parseCommaParameter(result.substring(enumInfoStart, enumInfoEnd));
        else
            enumInfo = { "##originalString##": "" };
        let hasLabel = false;
        /*
        if(enumInfo.indexOf("label") != -1)
        {
          let labelStart = enumInfo.indexOf("{")+1;
          let labelEnd = enumInfo.lastIndexOf("}");
    
          enumInfo = enumInfo.substring(labelStart,labelEnd);
          enumInfo = enumInfo.replace(/{/g,"");
          enumInfo = enumInfo.replace(/}/g,"");
          //enumInfo = enumInfo.replace(/\* /g,"");
    
          //hasLabel = true;
        //}
        */
        if (Object.keys(enumInfo).indexOf("label") != -1) {
            enumInfo["label"] = enumInfo["label"].replace(/\{/g, "");
            enumInfo["label"] = enumInfo["label"].replace(/\}/g, "");
            enumInfo["label"] = enumInfo["label"].replace(/\*/g, "");
            hasLabel = true;
        }
        result = "";
        //enumerateState.push(["enumerate",enumInfo,0,hasLabel]);
        enumerateState.push({ type: env, enumInfo: enumInfo, enumIndex: 0, hasLabel: hasLabel });
    }
    let enumPos = result.indexOf(enumItemCode);
    if (enumPos != -1) {
        state = 1;
        let enumIndex = enumerateState[enumerateState.length - 1]["enumIndex"];
        let hasLabel = enumerateState[enumerateState.length - 1]["hasLabel"];
        let enumInfo = enumerateState[enumerateState.length - 1]["enumInfo"];
        let processItemResult = processItem(result, enumItemCode, enumInfo, enumIndex, (hasLabel) ? enumerateChangeValueWithLabel : enumerateChangeValue);
        if (convertItemCode == true)
            result = processItemResult["processResult"];
        if (processItemResult["itemResult"] != "") {
            enumerateState[enumerateState.length - 1]["enumIndex"] = enumIndex + 1;
            itemStr = processItemResult["itemResult"];
        }
        //enumerateState[enumerateState.length-1]["lastItemResult"] = processItemResult["itemResult"];
        if (convertItemCode == true) {
            /*
            let enumItemResult = enumInfo;
            if(enumItemResult.endsWith(" ") == false)
              enumItemResult += " ";
            let enumIndex = enumerateState[enumerateState.length-1][2];
        
            for(const key in enumerateChangeValue)
            {
              enumItemResult = enumItemResult.replace(key,enumerateChangeValue[key][enumIndex]);
            }
            itemStr = enumItemResult;
        
            result = result.replace(enumItemCode," ").replace(/^\s, `${enumItemResult} `);
            enumerateState[enumerateState.length-1][2] = enumIndex+1;
            */
        }
    }
    let enumEndPos = result.indexOf(enumEndCode);
    if (enumEndPos != -1) {
        state = 2;
        enumerateState.pop();
        if (enumerateState.length > 0)
            enumInfo = enumerateState[enumerateState.length - 1]["enumInfo"];
        else
            enumInfo = {};
        result = "";
    }
    return { state: state, processResult: result, itemResult: itemStr };
}
//[state,본문,\item 포함 여부]
function processEnumerate(str) {
    let result = "";
    console.log(str);
    let enumResult = parseEnumerate(str, "!@@EnumStart@!@", "!@@EnumEnd@@!", "!@@ENUMITEM@@!", false);
    if (enumResult["state"] == 0) {
        result = `${prevEnumerate}`;
    }
    // itemResult:\item의 최종 결과,  processResult:\item을 !@@ENUMITEM@@!으로 변환한 결과
    else if (enumResult["state"] == 1) {
        let prevCode = "";
        let nextCode = "";
        for (let i = 0; i < enumerateState.length - 1; i++) {
            let enumType = enumerateState[i]["type"];
            //if(enumType != "enumerate")
            //  continue;
            prevCode += environmentTag[enumType]["prev"];
            nextCode += environmentTag[enumType]["next"];
        }
        let randomID = makeRandomID();
        let processedContents = enumResult["processResult"].replace("!@@ENUMITEM@@!", "");
        result = `${prevCode}<div class="texEnum_paragraph chatData" id="${randomID}">
              <div class="texEnum_enumItem">${enumResult["itemResult"]}</div>
              <div class="texEnum_Contents">${processedContents}</div>
          </div>${nextCode}`;
        chatLog[randomID] = processedContents;
    }
    else if (enumResult["state"] == 2) {
        result = `${nextEnumerate}`;
    }
    else {
        if (enumerateState.length > 0 && enumerateState[enumerateState.length - 1]["type"] == "enumerate") {
            let prevCode = "";
            let nextCode = "";
            for (let i = 0; i < enumerateState.length; i++) {
                let enumType = enumerateState[i]["type"];
                //if(enumType != "enumerate")
                //  continue;
                prevCode += environmentTag[enumType]["prev"];
                nextCode += environmentTag[enumType]["next"];
            }
            let randomID = makeRandomID();
            result = `${prevCode}<div class="chatData" id="${randomID}">${str}</div>${nextCode}`;
            chatLog[randomID] = str;
            enumResult["state"] = 1;
        }
        else
            result = str;
    }
    return { state: enumResult["state"], processResult: result, itemResult: enumResult["itemResult"] };
}
function processItemize(str) {
    let result = "";
    let enumResult = parseEnumerate(str, "!@@ItemizeStart@@!", "!@@ItemizeEnd@@!", "!@@ITEMIZEITEM@@!", false, "itemize");
    if (enumResult["state"] == 0) {
        result = `${prevEnumerate}`;
    }
    // itemResult:\item의 최종 결과,  processResult:\item을 !@@ENUMITEM@@!으로 변환한 결과
    else if (enumResult["state"] == 1) {
        let prevCode = "";
        let nextCode = "";
        for (let i = 0; i < enumerateState.length - 1; i++) {
            let enumType = enumerateState[i]["type"];
            //if(enumType != "itemize")
            //  continue;
            prevCode += environmentTag[enumType]["prev"];
            nextCode += environmentTag[enumType]["next"];
        }
        let randomID = makeRandomID();
        let processedContents = enumResult["processResult"].replace("!@@ITEMIZEITEM@@!", "");
        result = `${prevCode}<div class="texEnum_paragraph chatData" id="${randomID}">
              <div class="texEnum_enumItem"><ul><li></li></ul></div>
              <div class="texEnum_Contents">${processedContents}</div>
          </div>${nextCode}`;
        chatLog[randomID] = processedContents;
    }
    else if (enumResult["state"] == 2) {
        result = `${nextEnumerate}`;
    }
    else {
        if (enumerateState.length > 0 && enumerateState[enumerateState.length - 1]["type"] == "itemize") {
            let prevCode = "";
            let nextCode = "";
            for (let i = 0; i < enumerateState.length; i++) {
                let enumType = enumerateState[i]["type"];
                //if(enumType != "itemize")
                //  continue;
                prevCode += environmentTag[enumType]["prev"];
                nextCode += environmentTag[enumType]["next"];
            }
            let randomID = makeRandomID();
            result = `${prevCode}<div class="chatData" id="${randomID}">${str}</div>${nextCode}`;
            chatLog[randomID] = str;
            enumResult["state"] = 1;
        }
        else
            result = str;
    }
    return { state: enumResult["state"], processResult: result, itemResult: enumResult["itemResult"] };
}
//[state,본문,\item 포함 여부]
function processSelection(str) {
    let result = "";
    let enumResult = parseEnumerate(str, "!@@SelectionStart@!@", "!@@SelectionEnd@@!", "!@@SELECTIONITEM@@!", false);
    //console.log("selectionResult:",enumResult);
    if (enumResult["state"] == 0) {
        result = `${prevSelection}`;
    }
    else if (enumResult["state"] == 1) {
        let prevCode = "";
        let nextCode = "";
        for (let i = 0; i < enumerateState.length - 1; i++) {
            prevCode += `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
      </div><div class="texEnum_Contents">`;
            nextCode += `</div></div>`;
        }
        result = `${prevCode}<div class="texEnum_paragraph">
              <div class="texEnum_enumItem">${enumResult["itemResult"]}</div>
              <div class="texEnum_Contents">${enumResult["processResult"].replace("!@@ENUMITEM@@!", "")}</div>
          </div>${nextCode}`;
        result = enumResult["processResult"].replace("!@@SELECTIONITEM@@!", "").replace(/^\s*/, ``);
    }
    else if (enumResult["state"] == 2) {
        result = `${nextSelection}`;
    }
    else {
        result = str;
    }
    return { state: enumResult["state"], processResult: result, itemResult: enumResult["itemResult"] };
}
function processCondition(str) {
    let result = "";
    let enumResult = parseEnumerate(str, "!@@ConditionStart@!@", "!@@ConditionEnd@@!", "!@@CONDITIONITEM@@!", true);
    //console.log("conditionResult:",enumResult);
    if (enumResult["state"] == 0) {
        result = `${prevCondition}`;
    }
    else if (enumResult["state"] == 1) {
        result = enumResult["processResult"];
    }
    else if (enumResult["state"] == 2) {
        result = `${nextCondition}`;
    }
    else {
        result = str;
    }
    return { state: enumResult["state"], processResult: result, itemResult: enumResult["itemResult"] };
}
function processJustbox(str, justboxStartCode = "!@@JustboxStart@@!", justboxEndCode = "!@@JustboxEnd@@!") {
    let result = str;
    let state = -1;
    let justboxStartPos = result.indexOf(justboxStartCode);
    if (justboxStartPos != -1) {
        state = 0;
        result = prevJustbox;
    }
    let justboxEndPos = result.indexOf(justboxEndCode);
    if (justboxEndPos != -1) {
        state = 2;
        result = nextJustbox;
    }
    return { state: state, processResult: result };
}
let subsolCounter = 0;
let subsubsolCounter = 0;
function processSubsol(str, subsolStartCode = "!@@SubsolStart@!@", subsolEndCode = "!@@SubsolEnd@@!", subsubsolStartCode = "!@@SubsubsolStart@!@", subsubsolEndCode = "!@@SubsubsolEnd@@!") {
    let result = str;
    let state = -1;
    let subsolStartPos = result.indexOf(subsolStartCode);
    if (subsolStartPos != -1) {
        state = 0;
        ++subsolCounter;
        let subsolTitleStart = subsolStartPos + subsolStartCode.length;
        let subsolTitleEnd = result.indexOf("@@!");
        let subsolTitle = result.substring(subsolTitleStart, subsolTitleEnd);
        result = `풀이 ${subsolCounter}) ${processIKPSGrammer(subsolTitle, "", false, false)}`;
    }
    let subsolEndPos = result.indexOf(subsolEndCode);
    if (subsolEndPos != -1) {
        state = 2;
        subsubsolCounter = 0;
        result = "";
    }
    let subsubsolStartPos = result.indexOf(subsubsolStartCode);
    if (subsubsolStartPos != -1) {
        state = 0;
        ++subsubsolCounter;
        let subsubsolTitleStart = subsubsolStartPos + subsubsolStartCode.length;
        let subsubsolTitleEnd = result.indexOf("@@!");
        let subsubsolTitle = result.substring(subsubsolTitleStart, subsubsolTitleEnd);
        result = `(풀이 ${subsolCounter}-${subsubsolCounter}) ${processIKPSGrammer(subsubsolTitle, "", false, false)}`;
    }
    let subsubsolEndPos = result.indexOf(subsubsolEndCode);
    if (subsubsolEndPos != -1) {
        state = 2;
        result = "";
    }
    return { state: state, processResult: result };
}
function processTableRow(str, colSeperator = "&") {
    let result = [];
    let parLev = 0;
    let beginDepth = 0;
    let startPos = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] == '{' && (i == 0 || str[i - 1] != '\\')) {
            ++parLev;
        }
        if (str[i] == '}' && (i == 0 || str[i - 1] != '\\')) {
            --parLev;
        }
        if (str.startsWith("\\begin", i) == true)
            ++beginDepth;
        else if (str.startsWith("\\end", i) == true)
            --beginDepth;
        if (parLev == 0 && beginDepth == 0 && str.startsWith(colSeperator, i) == true) {
            result.push(str.substring(startPos, i).trim());
            startPos = i + colSeperator.length;
        }
    }
    result.push(str.substring(startPos).replace(/#/g, "").trim());
    return result;
}
let nowTableData = [];
let nowTableDepth = 0;
let nowRowNum = [];
function processTable(str, tableStartCode = "!@@TableStart@@!", tableEndCode = "!@@TableEnd@@!", tableRowStartCode = "!@@TableNewRow@@!", colSeperator = "&") {
    let result = str;
    let state = -1;
    let maxWidth = 23429;
    let tableStartPos = result.indexOf(tableStartCode);
    if (tableStartPos != -1) {
        state = 0;
        ++nowTableDepth;
        let tableInfoStart = tableStartPos + tableStartCode.length;
        let tableInfoEnd = result.indexOf("@@!", tableInfoStart);
        nowTableData.push([]);
        nowTableData[nowTableDepth - 1].push([result.substring(tableInfoStart, tableInfoEnd)]);
        nowRowNum.push(0);
        result = ``;
    }
    let tableRowStartPos = result.indexOf(tableRowStartCode);
    if (tableRowStartPos != -1) {
        state = 1;
        ++nowRowNum[nowTableDepth - 1];
        result = ``;
    }
    let tableEndPos = result.indexOf(tableEndCode);
    if (tableEndPos != -1) {
        state = 2;
        --nowTableDepth;
        let colNum = nowTableData[nowTableDepth][1].length;
        let rowNum = nowTableData[nowTableDepth].length - 1;
        let tableWidth = (colNum > 1) ? Math.round(maxWidth * 0.9) : maxWidth;
        let tableInfoStr = nowTableData[nowTableDepth][0][0];
        let infoArray = [];
        for (let i = 0; i < tableInfoStr.length; i++) {
            //알파벳이 나왔을 때
            if (isalpha(tableInfoStr[i])) {
                let firstNonSpace = findNextNonSpace(tableInfoStr, i + 1);
                if (firstNonSpace == -1)
                    break;
                //알파벳 다음 문자가 [일 때
                if (tableInfoStr[firstNonSpace] == '[') {
                    let parEnd = tableInfoStr.indexOf("]", firstNonSpace);
                    infoArray.push(tableInfoStr.substring(firstNonSpace + 1, parEnd));
                    i = parEnd;
                }
                else {
                    infoArray.push("1");
                    i = firstNonSpace;
                }
            }
        }
        for (let i = infoArray.length; i < colNum; i++)
            infoArray.push("1");
        for (let i = 0; i < infoArray.length; i++) {
            let matchResult = infoArray[i].match(/([0-9]+[\.]{0,1}[0-9]*)|([0-9]*[\.]{0,1}[0-9]+)/g);
            if (matchResult == null)
                infoArray[i] = 1;
            else
                infoArray[i] = parseFloat(matchResult[0]);
        }
        let colWidthRatioSum = 0;
        for (let i = 0; i < infoArray.length; i++)
            colWidthRatioSum += infoArray[i];
        for (let i = 0; i < infoArray.length; i++)
            infoArray[i] /= colWidthRatioSum;
        //console.log(infoArray);
        //let tableData = `${prevTable
        //  .replace("##columnNum##",colNum)
        //  .replace("##rowNum##",rowNum)
        // .replace("##tableWidth##",tableWidth)}`;
        let tableData = `<table><colgroup>`;
        for (let i = 0; i < infoArray.length; i++) {
            let nowWidthPercent = Math.floor(infoArray[i] * 100);
            tableData += `<col style="width: ${nowWidthPercent}%;">`;
        }
        tableData += `</colgroup>`;
        let maxColNum = 0;
        for (let i = 1; i < nowTableData[nowTableDepth].length; i++) {
            if (maxColNum < nowTableData[nowTableDepth][i].length)
                maxColNum = nowTableData[nowTableDepth][i].length;
        }
        let rowSpanInfo = Array(maxColNum);
        for (let i = 0; i < maxColNum; i++)
            rowSpanInfo[i] = 0;
        for (let i = 1; i < nowTableData[nowTableDepth].length; i++) {
            tableData += `<tr>`;
            let nowColNum = 0;
            for (let j = 0; j < nowTableData[nowTableDepth][i].length; j++) {
                let contents = "";
                if (nowTableData[nowTableDepth][i][j].match(/^[\x01-\x7f]*$/g) != null && nowTableData[nowTableDepth][i][j] != "")
                    contents += `${nowTableData[nowTableDepth][i][j]}`;
                else
                    contents += `${nowTableData[nowTableDepth][i][j]}`;
                let rowspan = 1;
                let colspan = 1;
                let spanStr = "";
                let multiRowStart = contents.indexOf("!@@MultiRow@!@");
                let multiColumnStart = contents.indexOf("!@@MultiColumn@!@");
                if (multiRowStart != -1) {
                    let par1Start = multiRowStart + 14;
                    let par1End = contents.indexOf("@!@", par1Start);
                    let par3Start = par1End + 3;
                    let par3End = contents.indexOf("@@!", par3Start);
                    rowspan = parseInt(contents.substring(par1Start, par1End).trim());
                    contents = contents.substring(par3Start, par3End);
                    spanStr += ` rowspan="${rowspan}"`;
                }
                if (multiColumnStart != -1) {
                    let par1Start = multiColumnStart + 17;
                    let par1End = contents.indexOf("@!@", par1Start);
                    let par3Start = par1End + 3;
                    let par3End = contents.indexOf("@@!", par3Start);
                    colspan = parseInt(contents.substring(par1Start, par1End).trim());
                    contents = contents.substring(par3Start, par3End);
                    spanStr += ` colspan="${colspan}"`;
                }
                if (rowSpanInfo[nowColNum] == 0) {
                    if (i == 1)
                        tableData += `<th${spanStr}>${contents}</th>`;
                    else
                        tableData += `<td${spanStr}>${contents}</td>`;
                }
                else {
                    for (let k = 0; k < colspan; k++)
                        --rowSpanInfo[nowColNum + k];
                }
                for (let k = 0; k < colspan; k++) {
                    rowSpanInfo[nowColNum + k] += (rowspan - 1);
                }
                nowColNum += colspan;
            }
            tableData += `</tr>`;
        }
        tableData += `</table>`;
        //console.log(tableData);
        nowTableData.pop();
        nowRowNum.pop();
        result = tableData;
    }
    if (nowTableDepth > 0 && state == -1) {
        state = 1;
        nowTableData[nowTableDepth - 1].push(processTableRow(str, colSeperator));
        result = ``;
    }
    return { state: state, processResult: result };
}
function processPlainText(str) {
    let result = str;
    //result = result.replace(/!@@UnderlineStart@@!/g,"<u>");
    //result = result.replace(/!@@UnderlineEnd@@!/g,"</u>");
    //result = result.replace(/!@@NewLine@@!/g,"<br/>");
    for (let i = 0; i < plainTextConvert.length; i++) {
        result = result.replace(plainTextConvert[i][0], plainTextConvert[i][1]);
    }
    return result;
}
function processMathText(str) {
    let result = str;
    //result = result.replace(/!@@UnderlineStart@@!/g,"\\underline{");
    //result = result.replace(/!@@UnderlineEnd@@!/g,"}");
    //result = result.replace(/!@@NewLine@@!/g,"\\\\");
    //result = result.replace(/&lt;/g,'\\lt ');
    //result = result.replace(/&gt;/g,'\\gt ');
    for (let i = 0; i < mathTextConvert.length; i++) {
        result = result.replace(mathTextConvert[i][0], mathTextConvert[i][1]);
    }
    return result;
}
function preprocessLaTeXContents(str) {
    let result = str;
    result = result.replace(/</g, '&lt; ');
    result = result.replace(/>/g, '&gt; ');
    return result;
}
function postprocessLaTeXContents(str) {
    let paragraphList = getParagraphList(str);
    let postprocessedString = "";
    for (let i = 0; i < paragraphList.length; i++) {
        let paragraphResult = "";
        let enumerateInfo = processEnumerate(paragraphList[i]);
        paragraphList[i] = enumerateInfo["processResult"];
        let itemizeInfo = processItemize(paragraphList[i]);
        paragraphList[i] = itemizeInfo["processResult"];
        /*
        let selectionInfo = processSelection(paragraphList[i]);paragraphList[i] = selectionInfo["processResult"];
        let conditionInfo = processCondition(paragraphList[i]);paragraphList[i] = conditionInfo["processResult"];
        let justboxInfo = processJustbox(paragraphList[i]);paragraphList[i] = justboxInfo["processResult"];
        */
        let tableInfo = processTable(paragraphList[i]);
        paragraphList[i] = tableInfo["processResult"];
        /*let subsolInfo = processSubsol(paragraphList[i]);paragraphList[i] = subsolInfo["processResult"];*/
        let enumerateState = enumerateInfo["state"];
        let itemizeState = itemizeInfo["state"];
        /*let selectionState = selectionInfo["state"];
        let conditionState = conditionInfo["state"];
        let justboxState = justboxInfo["state"];*/
        let tableState = tableInfo["state"];
        /*
        
        if(printFirstParagraph == false && paragraphSolution[j].match(/^\s*$/g) == null)
          printFirstParagraph = true;
    
        if(printFirstParagraph == false)
          continue;
    
    
        if(selectionState == 0)
          paragraphResult += prevParagraph['gndTable'];
        else if(selectionState == 1)
          paragraphResult += prevParagraph['gndItem'].replace("!@@GND@@!",selectionInfo[2].trim());
        else if(selectionState == 2)
          paragraphResult += "";
    
        else if(conditionState == 0)
          paragraphResult += prevParagraph['ganadaTable'];
        else if(conditionState == 1)
          paragraphResult += prevParagraph['ganadaItem'];
        else if(conditionState == 2)
          paragraphResult += "";
    
        else if(justboxState == 0)
          paragraphResult += prevParagraph['justbox'];
        else if(justboxState == 2)
          paragraphResult += "";
    
        else if(tableState == 0)
          paragraphResult += prevParagraph['center'];
        else if(tableState == 1 || tableState == 2)
          paragraphResult += "";
        
        else
        {
          if(isCenter)
            paragraphResult += prevParagraph['center'];
          else
            paragraphResult += prevParagraph['Solution'];
        }
    
    
        let parsedPosArray = parseMathRange(paragraphSolution[j]);
        //console.log("parsedPosArray = ",parsedPosArray);
    
        if((enumerateState != 0 && enumerateState != 2)
          && (selectionState != 0 && selectionState != 2)
          && (conditionState != 0 && conditionState != 2)
          && (justboxState != 0 && justboxState != 2)
          && (tableState < 0 || tableState > 2))
        {
          
        }
        */
        /*
        if(enumerateState == -1 && itemizeState == -1 && tableState == -1)
        {
          if(paragraphList[i].trim() != "<hr/>")
          {
            let randomID = makeRandomID();
            chatLog[randomID] = paragraphList[i];
    
            if((paragraphList[i].startsWith("!@@") == true && paragraphList[i].endsWith("@@!") == true) || (paragraphList[i].startsWith("!!#") == true && paragraphList[i].endsWith("#!!") == true))
              paragraphList[i] = paragraphList[i];
            else
              paragraphList[i] = `<div class="chatData" id="${randomID}">${paragraphList[i]}</div>`;
          }
        }
    
    
        let nowStr = paragraphList[i];
        let contentsParsed = parseMathRange(nowStr);
        let processedParagraph = "";
    
        for(let j=0;j<contentsParsed.length;j++)
        {
          let nowString = nowStr.substring(contentsParsed[j]['start'],contentsParsed[j]['end']);
          if(nowString.match(/^\s*$/g))
            continue;
    
          if(contentsParsed[j]['type'] == 'plainText')
            processedParagraph += processPlainText(nowString);
          else
            processedParagraph += processMathText(nowString);
        }
    
        if(i>0)
          postprocessedString += `\n\n${processedParagraph}`;
        else
          postprocessedString += processedParagraph;
        */
        let nowStr = paragraphList[i];
        let contentsParsed = parseMathRange(nowStr);
        let processedParagraph = [""];
        let processedParagraphNum = 1;
        for (let j = 0; j < contentsParsed.length; j++) {
            let nowString = nowStr.substring(contentsParsed[j]['start'], contentsParsed[j]['end']);
            if (nowString.match(/^\s*$/g))
                continue;
            if (contentsParsed[j]['type'] == 'plainText') {
                let lineBreakPos = nowString.indexOf("\\\\");
                let startPos = 0;
                while (lineBreakPos != -1) {
                    processedParagraph[processedParagraphNum - 1] += processPlainText(nowString.substring(startPos, lineBreakPos));
                    processedParagraph.push("");
                    ++processedParagraphNum;
                    startPos = lineBreakPos + 2;
                    lineBreakPos = nowString.indexOf("\\\\", startPos);
                }
                processedParagraph[processedParagraphNum - 1] += processPlainText(nowString.substring(startPos));
            }
            else
                processedParagraph[processedParagraphNum - 1] += processMathText(nowString);
        }
        let processedParagraphAll = "";
        if (enumerateState == -1 && itemizeState == -1 && tableState == -1) {
            for (let j = 0; j < processedParagraph.length; j++) {
                if (processedParagraph[j].trim() != "<hr/>") {
                    let randomID = makeRandomID();
                    chatLog[randomID] = processedParagraph[j];
                    if ((processedParagraph[j].startsWith("!@@") == true && processedParagraph[j].endsWith("@@!") == true) || (processedParagraph[j].startsWith("!!#") == true && processedParagraph[j].endsWith("#!!") == true))
                        processedParagraphAll += processedParagraph[j];
                    else
                        processedParagraphAll += `<div class="chatData" id="${randomID}">${processedParagraph[j]}</div>`;
                }
            }
        }
        else {
            for (let j = 0; j < processedParagraph.length; j++) {
                processedParagraphAll += processedParagraph[j];
            }
        }
        if (i > 0)
            postprocessedString += `\n\n${processedParagraphAll}`;
        else
            postprocessedString += processedParagraphAll;
    }
    return postprocessedString;
}
function processIKPSGrammer(str, baseURL = "", preprocess = true, postprocess = true, paragraphDivID = false) {
    let preprocessedString = (preprocess) ? preprocessLaTeXContents(str) : str;
    let result = "";
    let changeStartPos = 0;
    let changeEndPos = 0;
    //console.log("now string:",str);
    //let bracketProcessedStr = processCurlyBracket(nowString);
    //let data = parseIKPS(bracketProcessedStr);
    let data = parseIKPS(preprocessedString);
    let environment = ['default'];
    //console.log("data:",data);
    for (let k = 0; k < data.length; k++) {
        if (data[k]["startPos"] < changeStartPos)
            continue;
        let functionName = data[k]["functionName"];
        changeEndPos = data[k]["startPos"];
        let prevEnv = "default";
        if (functionName == "\\begin")
            environment.push(data[k]["parameter"][0]);
        else if (functionName == "\\end")
            prevEnv = environment.pop();
        result += preprocessedString.substring(changeStartPos, changeEndPos);
        let nowEnv = environment[environment.length - 1];
        if (Object.keys(searchList[functionName]['changeInEnv']).indexOf(nowEnv) == -1)
            nowEnv = 'default';
        if (functionName == "\\begin" || functionName == "\\end") {
            let idx = (functionName == "\\begin") ? 0 : 1;
            let env = data[k]["parameter"][0];
            if (Object.keys(envParameterNumList).indexOf(env) == -1)
                env = 'default';
            if (envParameterNumList[env]['changeTo'][idx] == 'preserve')
                result += preserveParameter(data[k]);
            else
                result += processParameter(data[k], envParameterNumList[env]['changeTo'][idx], baseURL);
        }
        else if (searchList[functionName]['changeInEnv'][nowEnv] == 'preserve') {
            result += preserveParameter(data[k]);
        }
        else
            result += processIKPSGrammer(processParameter(data[k], searchList[functionName]['changeInEnv'][nowEnv], baseURL, searchList[functionName]['isURLParameter']), baseURL, false, false);
        changeStartPos = data[k]["endPos"];
    }
    result += preprocessedString.substring(changeStartPos);
    if (postprocess)
        result = postprocessLaTeXContents(result);
    return result;
}
const makeRandomID = () => {
    return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
