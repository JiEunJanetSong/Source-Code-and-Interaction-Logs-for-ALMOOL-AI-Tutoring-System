//import { baseURL,processIKPSGrammer } from "./ikpsParse.js";
//import MathJax from 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';

const markdown = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
  });

let nowBookIndex = -1;
let SetValue = {};
let defaultValue = {
    ConceptSwitch:"0",
    ConceptLabel:"Concept",
    SolutionSwitch:"1",
    SolutionLabel:"Solution",
    NoticeSwitch:"1",
    ReferenceSwitch:"1",
    ReferenceLabel:"Reference",
    CalculatorSwitch:"1",
    CalculatorLabel:"Calculator",
};
let timerID = -1;
  
MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: {
      fontCache: 'global'
    },
    processEnvironments: true
};

markdown.options.html = true;
markdown.options.quotes = "'";

let uid = "";
const uuid = () => {
    return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(
      /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
};

function renderMarkdown(str)
{
    let result = markdown.render(str);
    let startPos = 0;

    while(1)
    {
        startPos = result.indexOf("<img",startPos);
        if(startPos == -1)
            break;

        let endTagPos = result.indexOf(">",startPos+4);
        result = `${result.substring(0,startPos)}<div class='imgDiv'>${result.substring(startPos,endTagPos+1)}</div>${result.substring(endTagPos+1)}`;
        startPos = endTagPos+1;
    }

    return result;
}

class stringByte
{
    constructor(str,length)
    {
        this.str = str;
        this.length = length;
    }
};

//data: array
async function saveLog(data)
{
    let sendData = JSON.stringify({userID:uid,action:data});
    //console.log("sendData:",data);

    const httpData = new XMLHttpRequest();
    httpData.open('POST',`DigitalPapua_SaveLog.php`,false);
    httpData.setRequestHeader('content-type', 'application/json');

    httpData.onreadystatechange = function()
    {
    if (this.readyState == 4 && this.status == 200) {
        //console.log("response:",httpData.responseText);
    }
    }

    httpData.send(sendData);
    //console.log(httpData.responseText);
    return httpData.responseText;
}

let examRawData;


let nowObjAnswer = -1;
let desmosCalculator = false;
let mouseDragStartX = -1;
let mouseDragStartY = -1;
let documentRect = -1;
let documentWidth = -1;
let resizerWidth = -1;


let maxExamNumber = -1;
let showAnswerDialog = false;
let takeExam = Array();
let customerAnswer = Array(16);
let subjAnswer = Array(64);
let problemMarked = Array(64);
let answerArr = ["A","B","C","D","E"];
let startTime;
let isReview = false;
let isMoreShowing = false;


let problemNum = 25;
let problemPath = "";
let markedColor = "#ffcccc";
let unmarkedColor = "#ccccff";
let examContents2 = "";
let mouseX = -1;
let mouseY = -1;
let calculatorBarInitialPosX = -1;
let calculatorBarInitialPosY = -1;
let calculatorInitialPosX = -1;
let calculatorInitialPosY = -1;
let calculatorWidth = -1;
let calculatorHeight = -1;



/*
*/

function parseObjAnswer(contents,upperBound)
{
    let ans = contents.indexOf("\\ansFOURs");
    if(ans == -1)
        return false;

    let isText = false;
    let pos = ans+9;
    if(contents[pos] == 'T')
    {
        isText = true;
        pos++;
    }

    let parameter = Array();

    for(i=0;i<4;i++)
    {
        let par = findParameter(contents,pos,upperBound);
        parameter[i] = par[0];
        
        if(isText === false)
            parameter[i].str = "$" + parameter[i].str + "$";

        pos = par[1];
    }

    while(isspace(contents[ans-1])) ans--;

    return [parameter,ans];
}

function parseExamContents(contents,upperBound)
{

}


function processTexCode(texCode)
{

}

function processAnswerInput(event)
{
    console.log(event.keyCode);
    if((event.keyCode >= 45 && event.keyCode <= 57))
    {
        let equation = document.getElementById("problemAnswerSubjInput").value;

        if(event.keyCode == 45)
        {
            if(equation.length > 0 || equation.indexOf("-") != -1)
                event.preventDefault();
        }
        else if(equation.indexOf(".") != -1 && event.keyCode == 46)
            event.preventDefault();
        else if(equation.indexOf("/") != -1 && event.keyCode == 47)
            event.preventDefault();
    }
    else
        event.preventDefault();
}

function getProblemMarkCode(marked)
{
    if(marked)
        return `<font color=red><i class="fa-solid fa-bookmark"></i></font>`;
    else
        return `<i class="fa-regular fa-bookmark"></i>`;
}


function mouseDownResizer(event)
{
    mouseDragStartX = event.clientX;
    mouseDragStartY = event.clientY;
    document.addEventListener('mousemove',mouseMoveResizer);
    document.addEventListener('mouseup',mouseUpResizer);

    documentRect = document.body.getBoundingClientRect();
    documentWidth = documentRect.right - documentRect.left;

    let resizerRect = document.getElementById("examContentsResize").getBoundingClientRect();
    resizerWidth = resizerRect.right - resizerRect.left;

    //window.addEventListener('mousemove', mouseMoveResizer);
    //window.addEventListener('mouseup', mouseUpResizer);
    window.addEventListener('mouseleave', mouseUpResizer); // New addition
}

function mouseMoveResizer(event)
{
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    document.body.style.cursor = 'ew-resize';
    
    document.getElementById("examContents1").style.userSelect = 'none';
    document.getElementById("examContents1").style.pointerEvents = 'none';
    
    document.getElementById("examContents2").style.userSelect = 'none';
    document.getElementById("examContents2").style.pointerEvents = 'none';

    let leftWidth = Math.max(mouseX - 0.5*resizerWidth,100);
    let rightWidth = Math.max(documentWidth - leftWidth - resizerWidth,100);
    
    document.getElementById("examContents1").style.width = leftWidth + 'px';
    document.getElementById("examContents2").style.width = rightWidth + 'px';

    document.body.classList.add('resizing'); // Add a class that sets cursor: ew-resize
}

function mouseUpResizer(event)
{
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    document.getElementById("examContentsResize").style.removeProperty('cursor');
    document.body.style.removeProperty('cursor');

    document.getElementById("examContents1").style.removeProperty('user-select');
    document.getElementById("examContents1").style.removeProperty('pointer-events');

    document.getElementById("examContents2").style.removeProperty('user-select');
    document.getElementById("examContents2").style.removeProperty('pointer-events');

    document.removeEventListener('mousemove',mouseMoveResizer);
    document.removeEventListener('mouseup',mouseUpResizer);
    window.removeEventListener('mouseleave', mouseUpResizer); // New addition

    document.body.classList.remove('resizing'); // Remove the class that sets cursor: ew-resize
}


function resizeCalculator(event)
{
    if(document.getElementById("calculatorDiv").style.width == "")
    {
        document.getElementById("calculatorDivResize").textContent = "Collapse";
        document.getElementById("calculatorDivBar").style.width = "85%";
        document.getElementById("calculatorDiv").style.width = "85%";
    }
    else
    {
        document.getElementById("calculatorDivResize").textContent = "Expand";
        document.getElementById("calculatorDivBar").style.width = "";
        document.getElementById("calculatorDiv").style.width = "";
    }
    
}

function mouseDownCalculator(event)
{
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.addEventListener('mousemove',mouseMoveCalculator);
    document.addEventListener('mouseup',mouseUpCalculator);

    mouseDragStartX = mouseX;
    mouseDragStartY = mouseY;
    calculatorBarInitialPosX = document.getElementById("calculatorDivBar").getBoundingClientRect().left;
    calculatorBarInitialPosY = document.getElementById("calculatorDivBar").getBoundingClientRect().top;
    calculatorInitialPosX = document.getElementById("calculatorDiv").getBoundingClientRect().left;
    calculatorInitialPosY = document.getElementById("calculatorDiv").getBoundingClientRect().top;

    documentRect = document.body.getBoundingClientRect();
    calculatorWidth = document.getElementById("calculatorDiv").getBoundingClientRect().right - document.getElementById("calculatorDiv").getBoundingClientRect().left;
    calculatorHeight = document.getElementById("calculatorDiv").getBoundingClientRect().bottom - document.getElementById("calculatorDivBar").getBoundingClientRect().top;
}

function mouseMoveCalculator(event)
{
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    if(desmosCalculator)
    {
        let bar = document.getElementById("calculatorDivBar");
        let calculator = document.getElementById("calculatorDiv");

        let barLeft = Math.max((calculatorBarInitialPosX + mouseX - mouseDragStartX),0);
        let barTop = Math.max((calculatorBarInitialPosY + mouseY - mouseDragStartY),0);

        if(barLeft + calculatorWidth > window.innerWidth)
            barLeft = window.innerWidth - calculatorWidth;
        if(barTop + calculatorHeight > window.innerHeight)
            barTop = window.innerHeight -  calculatorHeight;

        let calcLeft = barLeft;
        let calcTop = barTop + (calculatorInitialPosY - calculatorBarInitialPosY);
        
        document.getElementById("calculatorDivBar").style.left = barLeft + 'px';
        document.getElementById("calculatorDivBar").style.top = barTop + 'px';

        document.getElementById("calculatorDiv").style.left = calcLeft + 'px';
        document.getElementById("calculatorDiv").style.top = calcTop + 'px';
    }
}

function mouseUpCalculator(event)
{
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    document.removeEventListener('mousemove',mouseMoveCalculator);
    document.removeEventListener('mouseup',mouseUpCalculator);
}

function showCalculator()
{
    if(desmosCalculator)
    {
        saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Close Calculator`});
        document.getElementById("calculatorPos").innerHTML = "";

        desmosCalculator.destroy();
        desmosCalculator = false;

        document.removeEventListener('mousemove',mouseMoveCalculator);
        document.removeEventListener('mouseup',mouseUpCalculator);
    }
    else
    {
        saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Show Calculator`});

        document.getElementById("calculatorPos").innerHTML =
        `<div class="calculatorDivBar" id="calculatorDivBar">
        <div class="calculatorDivDrag" id="calculatorDivDrag" draggable="true"></div>
        <div class="calculatorDivResize" id="calculatorDivResize">Expand</div>
        <div class="closeButton" id="closeButton"><i class="fa fa-window-close" aria-hidden="true"></i></div>
        </div>
        <div class="calculatorDiv" id="calculatorDiv"></div>`;

        let elt = document.getElementById('calculatorDiv');
        desmosCalculator = Desmos.GraphingCalculator(elt);

        document.getElementById("calculatorDivDrag").ondragstart = function(){return false;};
        document.getElementById("calculatorDivResize").addEventListener('mousedown',resizeCalculator);
        document.getElementById("calculatorDivDrag").addEventListener('mousedown',mouseDownCalculator);
        document.getElementById("closeButton").addEventListener('mousedown', showCalculator);
    }
    
    //document.getElementById("customerAnswer").addEventListener('keypress',event => processAnswerInput(event));
    //window.open("DigitalSAT_desmos.html", "a", "width=1030, height=730, left=100, top=50");
}


function showAnswerList(divID,boxSize)
{
    

    if(showAnswerDialog)
    {
        saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Close Answer List`});
        document.getElementById(divID).innerHTML = "";
        showAnswerDialog = false;
    }
    else
    {
        if(divID == "answerListPos" && isReview == true)
            return;

        saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Show Answer List`});
        let answerListCode = `<div class="answerListExplain"></div>`;

        //for(let i=0;i<Math.floor((examData.problemNum[nowExamIndex]-1)/10)+1;i++)
        for(let i=0;i<Math.floor((examRawData[nowExamIndex]["problem"].length-1)/10)+1;i++)
        {
            answerListCode += `<div class="answerListRow" style="margin-top:${boxSize/3}px;gap:${boxSize/3}px;height:${boxSize}px;">`;

            for(j=0;j<10;j++)
            {
                let n = 10*i+j;

                if(n < examRawData[nowExamIndex]["problem"].length)
                {
                    let boxStyle = "";

                    if(problemMarked[n] == 1)
                    {
                        if(customerAnswer[nowExamIndex][n] == "")
                            boxStyle = "border:2px solid blue;";
                            //answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;border:1px dashed blue;" onclick="jumpToProblem(${n});">${n+1}</div>`;
                        else
                            boxStyle = "border:2px solid blue;background-color:#ccccff;";
                            //answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;background-color:#ffcccc;" onclick="jumpToProblem(${n});">${n+1}</div>`;
                    }
                    else
                    {
                        if(customerAnswer[nowExamIndex][n] == "")
                            boxStyle = "border:1px dashed blue;";
                            //answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;border:1px dashed blue;" onclick="jumpToProblem(${n});">${n+1}</div>`;
                        else
                            boxStyle = "background-color:#ccccff;";
                            //answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;background-color:#ccccff;" onclick="jumpToProblem(${n});">${n+1}</div>`;
                    }

                    answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;${boxStyle};" onclick="jumpToProblem(${n});">${n+1}</div>`;
                }
                else
                {
                    answerListCode += `<div class="answerListColumn" style="font-size:${Math.sqrt(10.8*boxSize)}px;width:${boxSize}px;height:${boxSize}px;"></div>`;
                }
            }
            
            answerListCode += `</div>`;
        }

        if(divID == "answerListPos")
        {
            document.getElementById(divID).innerHTML =
                `<div class="answerListDivBar" id="answerListDivBar">
                <div class="answerListDivDrag" id="answerListDivDrag"></div>
                <div class="closeButton" id="closeButton" onclick="showAnswerList('answerListPos',${boxSize});"><i class="fa fa-window-close" aria-hidden="true"></i></div>
                </div>
                <div class="answerListDiv" id="answerListDiv">${answerListCode}</div>`;

            let answerListButtonRect = document.getElementById("answerList").getBoundingClientRect();
            let answerListRect = document.getElementById("answerListDiv").getBoundingClientRect();

            let answerListDivLeft = 0.5*(answerListButtonRect.left+answerListButtonRect.right) - 0.5*(answerListRect.right-answerListRect.left);
            let answerListDivTop = answerListButtonRect.top - (answerListRect.bottom-answerListRect.top) - 0.5*boxSize;
            document.getElementById("answerListDiv").style.left = answerListDivLeft+'px';
            document.getElementById("answerListDiv").style.top = answerListDivTop+'px';
            document.getElementById("answerListDivBar").style.left = answerListDivLeft+'px';
            document.getElementById("answerListDivBar").style.top = (answerListDivTop-boxSize)+'px';

            showAnswerDialog = true;
        }
        else
        {
            document.getElementById(divID).innerHTML = `<div class="answerListDiv" id="answerListDiv" style="width:80%;height:80%;">${answerListCode}</div>`;
        }
    }
}

function showMore()
{
    if(isMoreShowing)
    {
        isMoreShowing = false;
        document.getElementById("moreListPos").innerHTML = ``;
    }
    else if(nowProblemIndex > 0 && nowProblemIndex < examRawData[nowExamIndex]["problem"].length)
    {
        let moreList = ["Ask To Tutor(ENG)","Ask To Tutor(KOR)"];
        let moreListCode = "";

        for(let i=0;i<moreList.length;i++)
        {
            moreListCode += `<div class="moreListRow" id="moreListRow" onclick="askToTutor();">${moreList[i]}</div>`;
        }

        isMoreShowing = true;
        document.getElementById("moreListPos").innerHTML = `<div class="moreListDiv" id="moreListDiv">${moreListCode}</div>`;
    }
}


function getProblemID(filename,index)
{

}

function markProblem(n)
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Mark Problem`});

    if(problemMarked[n])
    {
        problemMarked[n] = 0;
    }
    else
    {
        problemMarked[n] = 1;
    }

    document.getElementById("problemMark").innerHTML = getProblemMarkCode(problemMarked[n]);
}

function showPrevProblem()
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Clicked Prev Button`});

    if(nowProblemIndex>0)
        nowProblemIndex--;
        
    if(nowProblemIndex >= examRawData[nowExamIndex]["problem"].length)
        goReviewPage();
    else if(nowProblemIndex >= 0)
        showProblem();
    else
        ;
}

function showNextProblem(type=-1)
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Clicked Next Button`});

    if(nowExamIndex == -2)
    {
        /*
        let radioList = document.getElementsByName("examMode");
        let value = -1;

        for(let i=0;i<radioList.length;i++)
        {
            if(radioList[i].checked === true)
            {
                value = i;
                break;
            }
        }
        */

        if(type == 0)   //test mode
        {
            examDataReq = "DSAT_parseProblem";
            changeDefaultValue["SolutionSwitch"] = "0";
        }
        else if(type == 1)  //study mode
        {
            examDataReq = "DSAT_parseTex";
            changeDefaultValue["SolutionSwitch"] = "1";
        }
        else
            return;
        
        //getProblem(examID);

        if(changeDefaultValue)
        {
            for(const key in changeDefaultValue)
            {
                defaultValue[key] = changeDefaultValue[key];
            }
        }

    }

    if(nowExamIndex == -1)
    {
        if(takeExam.length == 0)
        {
            for(let i=0;i<examRawData.length;i++)
            {
                takeExam.push(document.getElementById(`examSelectionCheckbox${i}`).checked);
            }
        }
        
        let moveNext = false;
        for(let i=0;i<takeExam.length;i++)
        {
            takeExam[i] = document.getElementById(`examSelectionCheckbox${i}`).checked;

            if(takeExam[i] == true && moveNext == false)
            {
                moveNext = true;
            }
        }

        if(moveNext == false)
            return;
    }

    if(nowExamIndex == 0 && nowProblemIndex == -1)
    {
        
    }

    if(nowExamIndex >= 0 && nowProblemIndex < examRawData[nowExamIndex]["problem"].length)
    {
        /*
        let initText = document.getElementById("examContentsBox");
        initText.classList.remove('init');
        nowProblemIndex++; 
        */
        nowProblemIndex++; 
    }
    else
    {
        //for(let i=0;i<takeExam.length;i++)
        nowExamIndex++;
        while(nowExamIndex>=0 && nowExamIndex<takeExam.length && takeExam[nowExamIndex] == false)
            ++nowExamIndex;
        //return false;
        nowProblemIndex = -1;
    }

    if(nowExamIndex>=0 && nowExamIndex == maxExamNumber)
        submitAnswer();
    else if(nowExamIndex>=0 && nowProblemIndex == examRawData[nowExamIndex]["problem"].length)
        goReviewPage();
    else
        showProblem();
}

function submitAnswer()
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Submited Answer`});

    let answerString = {};

    for(let i=0;i<maxExamNumber;i++)
    {
        if(takeExam[i] == false)
            continue;
        
        let smallTitle = examRawData[i]["examTitle"];
        answerString[i] = [];

        for(let j=0;j<examRawData[i]["problem"].length;j++)
        {
            answerString[i].push(customerAnswer[i][j]);
            //answerString[i][j+1] = {};
            //answerString[i][j+1]["Answer"] = customerAnswer[i][j];
        }
    }

    let form = document.createElement('form');
    form.setAttribute('method', 'post');
    //form.setAttribute('action', `DSAT_answerConfirm.php?prefix=${texFileName}&bookIndex=${nowBookIndex}`);
    form.setAttribute('action', `DSAT_answerConfirm.php?examID=${examID}&chatDomain=${chatDomain}`);

    let hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', 'answer');
    hiddenField.setAttribute('value', JSON.stringify(answerString));

    form.appendChild(hiddenField);
    document.body.appendChild(form);
    form.submit();
}

function goReviewPage()
{
    isReview = true;

    if(showAnswerDialog)
        showAnswerList("answerListPos",30);

    if(isMoreShowing)
        showMore();

    showAnswerList("examContentsBox",60);
}

function updateSetValue()
{
    if(examRawData == undefined)
        return;

    let examIndex = Math.max(0,nowExamIndex);
    let problemIndex = Math.max(0,nowProblemIndex);

    if(examIndex>=0 && examIndex<examRawData.length && problemIndex<examRawData[examIndex]["problem"].length)
    {
        for(const key in examRawData[examIndex]["problem"][problemIndex]["value"])
        {
            SetValue[key] = examRawData[examIndex]["problem"][problemIndex]["value"][key];
        }
    }

    if(changeDefaultValue)
    {
        for(const key in changeDefaultValue)
        {
            SetValue[key] = changeDefaultValue[key];
        }
    }
}

function getProblem(examID)
{
    //let bookIndex = 1300;

    /*
    if(filename.indexOf("Section3") != -1)
        bookIndex = 1300;
    else if(filename.indexOf("Section4") != -1)
        bookIndex = 1301;
    else if(filename.indexOf("Harder") != -1 || filename.indexOf("Amazon") != -1)
        bookIndex = 1302;
    */
    //nowBookIndex = bookIndex;
    
    const httpData = new XMLHttpRequest();
    //httpData.open('POST',`DSAT_parseTex.php?prefix=${filename}&bookIndex=${bookIndex}`);
    httpData.open('POST',`${examDataReq}.php?examID=${examID}`,false);

    /*
    httpData.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200) {
            
        }
    };
    */

    httpData.send();

    examRawData = JSON.parse(httpData.responseText);
    //console.log(examRawData);
    maxExamNumber = examRawData.length;

    for(let i=0;i<examRawData.length;i++)
    {
        customerAnswer[i] = Array(examRawData[i]["problem"].length);
        for(let j=0;j<examRawData[i]["problem"].length;j++)
        {
            customerAnswer[i][j] = "";

            let keyArr = Object.keys(examRawData[i]["problem"][j]);
            for(let k=0;k<keyArr.length;k++)
            {
                if(keyArr[k] != "filePath" && keyArr[k] != "value" && keyArr[k] != "problemID" && keyArr[k] != "folderIndex")
                {
                    examRawData[i]["problem"][j][keyArr[k]] = examRawData[i]["problem"][j][keyArr[k]].replace(/\"/g,"&rdquo;");
                    examRawData[i]["problem"][j][keyArr[k]] = examRawData[i]["problem"][j][keyArr[k]].replace(/\'\'/g,"&rdquo;");
                    examRawData[i]["problem"][j][keyArr[k]] = examRawData[i]["problem"][j][keyArr[k]].replace(/\'/g,"&rsquo;");
                    examRawData[i]["problem"][j][keyArr[k]] = examRawData[i]["problem"][j][keyArr[k]].replace(/``/g,"&ldquo;");
                    examRawData[i]["problem"][j][keyArr[k]] = examRawData[i]["problem"][j][keyArr[k]].replace(/`/g,"&lsquo;");
                }
            }
        }
    }
}


function processFraction(eq)
{
    let stringArr = eq.split("/",2);
    
    let result = "";

    if(stringArr[0][0] == '-')
    {
        result += '-';
        stringArr[0] = stringArr[0].substr(1);
    }

    if(stringArr.length == 2)
    {
        result += "\\dfrac{" + stringArr[0] + "}{" + stringArr[1] + "}";
    }
    else
    {
        result += stringArr[0];
    }

    return result;
}

function selectObjKind(n) {
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Select Answer:${n}`});

    nowObjAnswer = answerArr.indexOf(n);

    // Remove 'selected' class from all options
    for(let i=0;i<answerArr.length;i++)
    {
        let option = document.getElementById(answerArr[i] + "Border");

        if(option)
        {
            option.classList.remove('selected');
            option.classList.remove('init');
            option.style.border = '2px solid black';
            option.style.backgroundColor = '#ffffff';
            option.style.color = 'black';
        }
    }

    // Add 'selected' class to the chosen option
    if (nowObjAnswer != -1)
    {
        let selectedOption = document.getElementById(n + "Border");
        selectedOption.classList.remove('init');
        selectedOption.classList.add('selected');
        selectedOption.style.border = '2px solid #0077c8';
        selectedOption.style.backgroundColor = '#0077c8';
        selectedOption.style.color = '#ffffff';
        
        customerAnswer[nowExamIndex][nowProblemIndex] = n;
    }
}


function syncAnswer(input,problemNum)
{
    let equation = input.value;
    customerAnswer[nowExamIndex][nowProblemIndex] = input.value;
    
    document.getElementById("problemSubjAnswer").innerHTML = "\\(" + processFraction(equation) + "\\)";
    MathJax.typeset();
    
    subjAnswer[nowProblemIndex] = document.getElementById("problemSubjAnswer").innerHTML;
}


function getProblemMainText(n)
{
    //return examRawData[nowExamIndex]["problem"][n]["Contents"];
    return processIKPSGrammer(examRawData[nowExamIndex]["problem"][n]["Contents"],texFileFolder);
}

function getProblemTitleCode(mode="1")
{
    if(mode == "0")
        return `<div class="problemTitle">
                <div class="problemNumber" id="problemNumber">${nowProblemIndex+1}</div>
                <div class="problemMark" id="problemMark" onclick="markProblem(${nowProblemIndex});">${(problemMarked[nowProblemIndex]) ? `<font color=red><i class="fa-solid fa-bookmark"></i></font>` : `<i class="fa-regular fa-bookmark"></i> `}</div>
                <div class="problemEmpty"><font face="Source Sans Pro">Mark for Review</font></div>
            </div>`;
    else if(mode == "1")
        return `<div class="problemTitle">
                <div class="problemNumber" id="problemNumber">${nowProblemIndex+1}</div>
                <div class="problemMark" id="problemMark" onclick="markProblem(${nowProblemIndex});">${(problemMarked[nowProblemIndex]) ? `<font color=red><i class="fa-solid fa-bookmark"></i></font>` : `<i class="fa-regular fa-bookmark"></i> `}</div>
                <div class="problemEmpty"><font face="Source Sans Pro">Mark for Review</font></div>
                <div class="problemEraseAnswer" id="problemEraseAnswer" onclick="askToTutor('${examID}','${nowBookIndex}','${examRawData[nowExamIndex]["problem"][nowProblemIndex]["folderIndex"]}:${examRawData[nowExamIndex]["problem"][nowProblemIndex]["problemName"]}','${chatDomain}');"><i class="fa-regular fa-comments"></i></div>
            </div>`;
}

//concept, solution을 출력하고 싶지 않을 때는 label을 ""으로
function getProblemContentsCode(contents,isSubj,showAfterProblem,conceptLabel,solutionLabel)
{
    let afterProblem = "";

    if(showAfterProblem)
    {
        if(conceptLabel == "" && solutionLabel != "")
        {
            afterProblem = `<div class="afterProblemRow" id="afterProblemRow">
                        <div class="afterProblemButton" id="Solution" onclick="showProblemContents('Solution');"><div>${solutionLabel}</div></div>
                    </div>
                    <div class="afterProblemShow" id="afterProblemShow"></div>`;
        }
        else if(conceptLabel != "" && solutionLabel == "")
        {
            afterProblem = `<div class="afterProblemRow" id="afterProblemRow">
            <div class="afterProblemButton" id="Concept" onclick="showProblemContents('Concept');"><div>${conceptLabel}</div></div>
            </div>
            <div class="afterProblemShow" id="afterProblemShow"></div>`;
        }
        else if(conceptLabel != "" && solutionLabel != "")
        {
            afterProblem = `<div class="afterProblemRow" id="afterProblemRow">
            <div class="afterProblemButton" id="Concept" onclick="showProblemContents('Concept');"><div>${conceptLabel}</div></div>
            <div style="width:40%;"></div>
            <div class="afterProblemButton" id="Solution" onclick="showProblemContents('Solution');"><div>${solutionLabel}</div></div>
            </div>
            <div class="afterProblemShow" id="afterProblemShow"></div>`;
        }
    }

    let subjCode = "";

    if(isSubj && showSubjectAnswerInput)
    {
        if(subjAnswerType == "mathquill")
        {
            subjCode = `<div class="problemAnswerSubj" style="flex-direction: column;">
            <div>Your Answer: <span id="math-field" style="width:300px;padding:5px;"></span></div>
            <div>LaTeX Code: <span id="latex-field" style="width:300px;padding:5px;"></span></div>
            </div>`;
        }
        else if(subjAnswerType == "mathfield")
        {
            subjCode = `<div class="problemAnswerSubj" style="flex-direction: column;">
            <div>Your Answer: <math-field id="mf" style="width:300px;padding:5px;border:1px solid #000000;"></math-field></div>
            <div>LaTeX Code: <span id="latex-field" style="width:300px;padding:5px;"></span></div>
            </div>`;
        }
        else
        {
            subjCode = `<div class="problemAnswerSubj">
            <input type="text" class="problemAnswerSubjInput" id="problemAnswerSubjInput" onkeypress="processAnswerInput(event)" oninput="syncAnswer(this,1);" value="${customerAnswer[nowExamIndex][nowProblemIndex]}">
            </div>
            <div class="problemAnswerSubj">
                <div class="problemAnswerSubjReview" style="justify-content: right;">Your Answer: </div>
                <div class="problemAnswerSubjReview" style="justify-content: left;" id="problemSubjAnswer">${(customerAnswer[nowExamIndex][nowProblemIndex]=="") ? "" : subjAnswer[nowProblemIndex]}</div>
            </div>`;
        }
    }

    return `<div class="problemContents">
                <div class="problemMainText" id="problemMainText">
                    <div>${contents}</div>
                </div>

                ${subjCode}
                
                ${afterProblem}
            </div>`;

}

function getProblemCode(title,contents1,contents2)
{
    if(contents1 == null && contents2 != null)
    {
        return `<div class="examContents1" id="examContents1" style="display:none;"></div>
        <div class="examContentsResize" id="examContentsResize" style="display:none;">
            <div class="examContentsResizeBar" id="examContentsResizeBar"></div>
        </div>
        <div class="examContents2" id="examContents2" style="display:flex;">${title}${contents2}</div>`;
    }
    else if(contents1 != null && contents2 == null)
    {
        return `<div class="examContents1" id="examContents1" style="display:flex;">${contents1}</div>
        <div class="examContentsResize" id="examContentsResize" style="display:none;">
            <div class="examContentsResizeBar" id="examContentsResizeBar"></div>
        </div>
        <div class="examContents2" id="examContents2" style="display:none;">${title}</div>`;
    }
    else
    {
        return `<div class="examContents1" id="examContents1" style="display:flex;">${contents1}</div>
        <div class="examContentsResize" id="examContentsResize" style="display:flex;">
            <div class="examContentsResizeBar" id="examContentsResizeBar"></div>
        </div>
        <div class="examContents2" id="examContents2" style="display:flex;">${title}${contents2}</div>`;
    }
}


function jumpToProblem(n)
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Jump To Problem (from ${nowProblemIndex} to ${n})`});
    nowProblemIndex = n;
    showProblem();
}


function showMoveModule()
{
    if(document.getElementById("moveModule").style.display == "none" || document.getElementById("moveModule").style.display == "")
    {
        let contents = "";

        for(let i=0;i<examRawData.length;i++)
        {
            contents += `<div class="moveModuleElement" onclick="moveModule(${i});" style="text-align:center;"><div>${examRawData[i]["examTitle"]}</div></div>`;
        }
    
        document.getElementById("moveModule").innerHTML = contents;
        document.getElementById("moveModule").style.display = "flex";
    }
    else
    {
        document.getElementById("moveModule").style.display = "none";
    }
}

function moveModule(examIndex)
{
    if(examIndex == nowExamIndex)
        return;
    
    nowExamIndex = examIndex;
    nowProblemIndex = -1;

    document.getElementById("moveModule").style.display = "none";
    showProblem();
}

function showProblem()
{
    if(examRawData)
        updateSetValue();

    let initText = document.getElementById("examContentsBox");
    isReview = false;
    if(showAnswerDialog)
        showAnswerList("answerListPos",30);
    if(isMoreShowing)
        showMore();

    let conceptSwitch = (SetValue["ConceptSwitch"]) ? SetValue["ConceptSwitch"] : defaultValue["ConceptSwitch"];
    let conceptLabel = (SetValue["ConceptLabel"]) ? SetValue["ConceptLabel"] : defaultValue["ConceptLabel"];
    if(conceptSwitch == "0")
        conceptLabel = "";
    
    let solutionSwitch = (SetValue["SolutionSwitch"]) ? SetValue["SolutionSwitch"] : defaultValue["SolutionSwitch"];
    let solutionLabel = (SetValue["SolutionLabel"]) ? SetValue["SolutionLabel"] : defaultValue["SolutionLabel"];
    if(solutionSwitch == "0")
        solutionLabel = "";

    let noticeSwitch = (SetValue["NoticeSwitch"]) ? SetValue["NoticeSwitch"] : defaultValue["NoticeSwitch"];

    let referenceSwitch = (SetValue["ReferenceSwitch"]) ? SetValue["ReferenceSwitch"] : defaultValue["ReferenceSwitch"];
    let referenceLabel = (SetValue["ReferenceLabel"]) ? SetValue["ReferenceLabel"] : defaultValue["ReferenceLabel"];
    let calculatorSwitch = (SetValue["CalculatorSwitch"]) ? SetValue["CalculatorSwitch"] : defaultValue["CalculatorSwitch"];
    let calculatorLabel = (SetValue["CalculatorLabel"]) ? SetValue["CalculatorLabel"] : defaultValue["CalculatorLabel"];
    let annotateSwitch = (SetValue["AnnotateSwitch"]) ? SetValue["AnnotateSwitch"] : "1";

    if(nowExamIndex == -2)
    {
        
    }
    else if(nowExamIndex == -1)
    {
        document.getElementById("moveBack").style.cssText = "";
        document.getElementById("moveNext").style.cssText = "";

        document.getElementById("examSmallInfo").innerHTML = "Module Selection";
        let examSelectionCode = `<div class="examSelectionWrapper">`;

        console.log(examRawData);
        for(let i=0;i<examRawData.length;i++)
        {
            examSelectionCode += `<div class="examSelectionDiv"><input type="checkbox" class="examSelectionCheckbox" id="examSelectionCheckbox${i}" checked><label for="examSelectionCheckbox${i}" class="examSelectionCheckboxLabel">${examRawData[i]["examTitle"]}</label></div>`;
        }

        examSelectionCode += "</div>";

        document.getElementById("examContentsBox").innerHTML = examSelectionCode;

        for(let i=0;i<examRawData.length;i++)
        {
            document.getElementById(`examSelectionCheckbox${i}`).addEventListener("change",function(){
                let noSelection = false;

                for(let j=0;j<examRawData.length;j++)
                {
                    if(document.getElementById(`examSelectionCheckbox${j}`).checked == true)
                    {
                        noSelection = true;
                        break;
                    }
                }

                /*
                if(noSelection == false)
                {
                    document.getElementById("moveBack").style.backgroundColor = "#dddddd";
                    document.getElementById("moveNext").style.backgroundColor = "#dddddd";
                }
                else
                {
                    document.getElementById("moveBack").style.cssText = "";
                    document.getElementById("moveNext").style.cssText = "";
                }
                */
            });
        }

        return;
    }

    let mainTitle = SetValue["mainTitle"];
    let examTitle = examRawData[nowExamIndex]["examTitle"];

    if(nowProblemIndex == -1)
    {
        for(let i=0;i<examRawData[nowExamIndex]["problem"].length;i++)
        {
            problemMarked[i] = 0;
        }
        initText.classList.add('init');
        initText.innerHTML = `<div style="font-size:30px;">${examRawData[nowExamIndex]["examTitle"]}</div>`;
        //initText.innerHTML = `<div style="font-size:30px;">Module ${nowExamIndex+1}</div>`; original

        document.getElementById("answerList").innerHTML = `Ready`;
        //document.getElementById("examInfo").innerHTML = examData.smallExamTitle[nowExamIndex];
        document.getElementById("examInfo").innerHTML = mainTitle;
        document.getElementById("examSmallInfo").innerHTML = examTitle;

        document.title = `${mainTitle} - ${examTitle}`;

        if(nowExamIndex >= 0 && examDataReq == "DSAT_parseProblem")
        {
            let timerTime = 1800;

            if(examTitle == "Reading and Writing")
            {
                if(mainTitle == "module 1" || mainTitle == "module 2")
                    timerTime = 32*60;
            }
            else if(examTitle == "Math")
            {
                if(mainTitle == "module 1" || mainTitle == "module 2")
                    timerTime = 35*60;
            }
    
            timerTime = (SetValue["examTime"]) ? parseInt(SetValue["examTime"]) : timerTime;
    
            setTimer(timerTime);
        }

        if(referenceSwitch == "1")
        {
            let examType = (SetValue["ReferenceType"]) ? SetValue["ReferenceType"] : "0";
            let referenceImageURL = "";

            if(SetValue["referenceImage"] == undefined || SetValue["referenceImage"] == "")
            {
                const httpData = new XMLHttpRequest();
                httpData.open('GET',`DSAT_getExamInfo.php?examType=${examType}`,false);
                httpData.setRequestHeader('content-type', 'application/json');
    
                httpData.send();
                let examInfo = JSON.parse(httpData.responseText);
                
                referenceImageURL = (examInfo["referenceImage"]!="none") ? examInfo["referenceImage"] : "none";
            }
            else
            {
                referenceImageURL = SetValue["referenceImage"];
            }
            

            if(referenceImageURL != "none" && referenceImageURL != "")
            {
                document.getElementById("showReference").style.display = "flex";
                document.getElementById("referenceLabel").textContent = referenceLabel;
                if(referenceImageURL.endsWith(".pdf"))
                {
                    document.getElementById("referenceImage").style.height = "100%";
                    document.getElementById("referenceImage").innerHTML = `<object type="application/pdf" data="${referenceImageURL}" width="100%" height="100%"></object>`;
                }
                else
                {
                    document.getElementById("referenceImage").style.height = "";
                    document.getElementById("referenceImage").innerHTML = `<img src="${referenceImageURL}">`;
                }
                
            }
            else
            {
                document.getElementById("showReference").style.display = "none";
            }
        }

        if(calculatorSwitch == "1")
        {
            document.getElementById("showCalculator").style.display = "flex";
            document.getElementById("calculatorLabel").textContent = calculatorLabel;
        }

        
        let examMode = (SetValue["examMode"]) ? SetValue["examMode"] : "";

        if(examMode == "test")   //test mode
        {
            examDataReq = "DSAT_parseProblem";
            changeDefaultValue["SolutionSwitch"] = "0";
        }
        else if(examMode == "study")  //study mode
        {
            examDataReq = "DSAT_parseTex";
            changeDefaultValue["SolutionSwitch"] = "1";
        }
        
    }
    else if(nowProblemIndex >= 0 && nowProblemIndex < examRawData[nowExamIndex]["problem"].length)
    {
        document.getElementById("moveBack").style.cssText = "";
        document.getElementById("moveNext").style.cssText = "";
        
        initText.classList.remove('init');

        let examType = "math";
        let title = getProblemTitleCode(solutionSwitch);
        let contents = getProblemMainText(nowProblemIndex);

        let leftParStartPos = contents.indexOf("!@@SATLeftParStart@@!");
        let leftParEndPos = contents.indexOf("!@@SATLeftParEnd@@!");
        let isSubj = (examRawData[nowExamIndex]["problem"][nowProblemIndex]["Contents"].indexOf("\\ans") == -1);

        if(noticeSwitch == "1" && (leftParStartPos != -1 && leftParEndPos != -1 || examType == "math" && isSubj == true))
        {
            let contents1 = "";
            let contents2 = "";

            if(examType == "math" && isSubj == true)
            {
                contents1 = mathSubjNotice;
                contents2 = contents;
            }
            else
            {
                contents1 = contents.substring(leftParStartPos+21,leftParEndPos);
                contents2 = contents.substring(0,leftParStartPos) + contents.substring(leftParEndPos+19);
            }
            
            

            //console.log("contents1 : ",contents1);
            //console.log("contents2 : ",contents2);

            
            if(window.innerWidth <= 768) //모바일
            {
                contents2 = getProblemContentsCode(`${contents1}<hr class="horizontalDivide">${contents2}`,isSubj,true,conceptLabel,solutionLabel);
                document.getElementById("examContentsBox").innerHTML = getProblemCode(title,null,contents2);
            }
            else //
            {
                contents1 = getProblemContentsCode(contents1,false,false,conceptLabel,solutionLabel);
                contents2 = getProblemContentsCode(contents2,isSubj,true,conceptLabel,solutionLabel);
                document.getElementById("examContentsBox").innerHTML = getProblemCode(title,contents1,contents2);

                document.getElementById("examContentsResize").ondragstart = function(){return false;};
                document.getElementById("examContentsResize").addEventListener('mousedown',mouseDownResizer);
            }

            //console.log("getProblemCode:",document.getElementById("examContentsBox").innerHTML);
        }
        else
        {
            contents = getProblemContentsCode(contents,isSubj,true,conceptLabel,solutionLabel);
            document.getElementById("examContentsBox").innerHTML = getProblemCode(title,null,contents);
            document.getElementById("examContentsResize").removeEventListener('mousedown',mouseDownResizer);
        }

        let mathFieldSpan = document.getElementById("math-field");
        let latexSpan = document.getElementById("latex-field");
        if(mathFieldSpan != undefined)
        {
            let mathField = MQ.MathField(mathFieldSpan, {
                spaceBehavesLikeTab: true, // configurable
                handlers: {
                    edit: function() { // useful event handlers
                    customerAnswer[nowExamIndex][nowProblemIndex] = mathField.latex(); // simple API
                    latexSpan.textContent = mathField.latex(); // simple API
                    }
                }
                });
        }

        let mathFieldTag = document.getElementById("mf");
        if(mathFieldTag != undefined)
        {
            mathFieldTag.addEventListener("input", e => {
                customerAnswer[nowExamIndex][nowProblemIndex] = e.target.value; // simple API
                latexSpan.textContent = e.target.value;
            });
        }

        /*
        document.getElementById("examContentsBox").innerHTML = 
        `<div class="examContents1" id="examContents1"></div>
        <div class="examContentsResize" id="examContentsResize">
            <div class="examContentsResizeBar" id="examContentsResizeBar"></div>
        </div>
        <div class="examContents2" id="examContents2">
            

            <div class="problemTitle">
                <div class="problemNumber" id="problemNumber">${nowProblemIndex+1}</div>
                <div class="problemMark" id="problemMark" onclick="markProblem(${nowProblemIndex+1});">${(problemMarked[nowProblemIndex]) ? `<font color=red><i class="fa-solid fa-bookmark"></i></font>` : `<i class="fa-regular fa-bookmark"></i> `}</div>
                <div class="problemEmpty"><font face="Source Sans Pro">Mark for Review</font></div>
                <div class="problemEraseAnswer" id="problemEraseAnswer" onclick="askToTutor();"><i class="fa-regular fa-comments"></i></div>
            </div>
            <div class="problemContents">
                <div class="problemMainText" id="problemMainText">
                    <div>${getProblemMainText(nowProblemIndex)}</div>
                </div>

                <div id="problemAnswerForm"></div>
                <div class="afterProblemRow" id="afterProblemRow">
                    <!--<div class="afterProblemButton" id="Concept" onclick="showProblemContents('Concept');;"><div>CONCEPT</div></div>-->
                    <div style="width:40%;"></div>
                    <div class="afterProblemButton" id="Solution" onclick="showProblemContents('Solution')"><div>SOLUTION</div></div>
                </div>
                <div class="afterProblemShow" id="afterProblemShow"></div>
            </div>

        </div>`;
        */

        //document.getElementById("examContents1").style.width = '0%';
        //document.getElementById("examContentsResize").style.width = '0%';
        adjustLayout();



        

        
        //if(examRawData[nowExamIndex]["problem"][nowProblemIndex].objAnswer != null)
        if(examRawData[nowExamIndex]["problem"][nowProblemIndex]["Contents"].indexOf("\\ans") != -1)
        {
            if(customerAnswer[nowExamIndex][nowProblemIndex]!="")
                selectObjKind(customerAnswer[nowExamIndex][nowProblemIndex]);
            //document.getElementById("examContentsResize").removeEventListener('mousedown',mouseDownResizer);
        }
        else
        {
            /*
            document.getElementById("problemAnswerForm").innerHTML = 
            `<div class="problemAnswerSubj">
                <input type="text" class="problemAnswerSubjInput" id="problemAnswerSubjInput" onkeypress="processAnswerInput(event)" oninput="syncAnswer(this,1);" value="${customerAnswer[nowExamIndex][nowProblemIndex]}">
            </div>
            <div class="problemAnswerSubj">
                <div class="problemAnswerSubjReview" style="justify-content: right;">Your Answer: </div>
                <div class="problemAnswerSubjReview" style="justify-content: left;" id="problemSubjAnswer">${(customerAnswer[nowExamIndex][nowProblemIndex]=="") ? "" : subjAnswer[nowProblemIndex]}</div>
            </div>`;
            */
        }
        updateAnswerList();
    }
    else
    {

    }
    MathJax.typesetPromise();

    //document.getElementById("problemMainText").innerHTML = renderMarkdown(document.getElementById("problemMainText").innerHTML);
}

function showProblemContents(contentsName) {
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Clicked ${contentsName}`});

    let smallTitle = Object.keys(examRawData)[nowExamIndex];
    let content = examRawData[smallTitle]["problem"][nowProblemIndex][contentsName];
    
    let afterProblemShowElement = document.getElementById("afterProblemShow");
    if(afterProblemShowElement.innerHTML == "")
        afterProblemShowElement.innerHTML = processIKPSGrammer(content,texFileFolder);
    else
        afterProblemShowElement.innerHTML = "";

    MathJax.typesetPromise([afterProblemShowElement]);
    
    /*
    then(() => {
        let MJcontent = afterProblemShowElement.innerHTML;
        let MDcontent = renderMarkdown(MJcontent);
        afterProblemShowElement.innerHTML = MDcontent;

        // Scroll the afterProblemShow element into view
        afterProblemShowElement.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }).catch(error => {
        console.error("Error processing MathJax", error);
    });
    */
}



function showReference()
{
    saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Show Reference`});

    let dialog = document.getElementById("referenceDialog");
    dialog.showModal();
}

function adjustLayout() {
    if (window.innerWidth <= 768) { // Assumes 768px is your breakpoint for mobile devices
      document.getElementById("examContents2").style.width = '90%';
    } else {
      document.getElementById("examContents2").style.width = '50%';
    }
  }

window.onload = function()
{
    nowBookIndex = bookIndex;

    document.getElementById("showCalculator").addEventListener('click',(event) => {showCalculator();});
    document.getElementById("showReference").addEventListener('click',(event) => {showReference();});
    //document.getElementById("ABorder").addEventListener('click',(event) => {});
    //document.getElementById("BBorder").addEventListener('click',(event) => {});
    //document.getElementById("CBorder").addEventListener('click',(event) => {});
    //document.getElementById("DBorder").addEventListener('click',(event) => {});
    document.getElementById("answerList").addEventListener('click',(event) => {showAnswerList('answerListPos',30);});
    document.getElementById("moveBack").addEventListener('click',(event) => {showPrevProblem();});
    document.getElementById("moveNext").addEventListener('click',(event) => {showNextProblem();});

    document.getElementById("moveBack").style.backgroundColor = "#dddddd";
    document.getElementById("moveNext").style.backgroundColor = "#dddddd";

    //임시, test/study 모드 선택 전에 데이터 전부 받음(정답/해설 포함)
    {
        getProblem(examID);
        updateSetValue();
        let mainTitle = SetValue["mainTitle"];
        document.getElementById("examInfo").innerHTML = mainTitle;

        if(SetValue["examMode"] == undefined || SetValue["examMode"] == "")
        {
            document.getElementById("examSmallInfo").innerHTML = "Mode Selection";
            document.getElementById("examContentsBox").innerHTML = `
            <div>
                <div class="modeButton" id="testMode" onclick="showNextProblem(0);"><div>Test Mode</div></div>
            </div>
            <div style="width:50px"></div>
            <div>
                <div class="modeButton" id="studyMode" onclick="showNextProblem(1);"><div>Study Mode</div></div>
            </div>`;
        }
        else
        {
            let examMode = -1;
            if(SetValue["examMode"]=="test")
                examMode = 0;
            else if(SetValue["examMode"]=="study")
                examMode = 1;
            showNextProblem(examMode);
        }
    }

    

    if(localStorage.getItem(`user`) == null || uid == "")
    {
        uid = uuid();
        localStorage.setItem(`user`,uid);
    }
    else
    {
        uid = localStorage.getItem(`user`);
    }
    

    afterLoadExam();
    saveLog({position:"start page",action:`Start Page Loaded`});
};

function getTimerStr(sec)
{
    let remineTime = sec;
    
    let minute = Math.floor(sec/60);
    let second = remineTime%60;

    let timeStr = minute + ":" + ((second<10) ? ("0"+second) : second);
    return timeStr;
}

function setTimer(sec)
{
    if(timerID != -1)
        clearInterval(timerID);

    if(examDataReq == "DSAT_parseTex")
    {
        document.getElementById("timerTime").textContent = "";
    }
    else if(examDataReq == "DSAT_parseProblem")
    {
        document.getElementById("timerTime").textContent = getTimerStr(sec);

        startTime = new Date();
        timerID = setInterval(() => {
            let nowTime = new Date();
            let diffTime = nowTime.getTime() - startTime.getTime();
            let milisec = sec*1000;
    
            if(diffTime <= milisec)
            {
                document.getElementById("timerTime").textContent = getTimerStr(Math.floor((milisec - diffTime) / 1000 + 0.5));
            }
            else
            {
                
            }
            
        }, 1000);
    }
}

function addObjAnswerClickEvent(divID,answer)
{
    let div = document.getElementById(divID);
    if(div)
        div.addEventListener('click',function(){selectObjKind(answer)});
}

function updateAnswerList() {
    var text;
    if (window.innerWidth <= 768) { // 768px is a common breakpoint for mobile devices
        text = `Q${nowProblemIndex+1} of ${examRawData[nowExamIndex]["problem"].length}`;
    } else {
        text = `Question ${nowProblemIndex+1} of ${examRawData[nowExamIndex]["problem"].length}`;
    }

    document.getElementById("answerList").innerHTML = text;
}


function adjustButtonIcons() {
    if (window.innerWidth <= 768) {
      // Set innerHTML to include Font Awesome icons
      document.getElementById('moveBack').innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      document.getElementById('moveNext').innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    } else {
      // Set text content for larger screens
      document.getElementById('moveBack').innerHTML = 'Back';
      document.getElementById('moveNext').innerHTML = 'Next';
    }
  }
  
  // Call this function on window resize and on document load
  window.addEventListener('resize', adjustButtonIcons);
  window.addEventListener('load', adjustButtonIcons);
  


let mathSubjNotice = `<div class="chatData" id="e4e989f6-c56a-4b8b-887a-1935927e1f3"><b>Student-produced response directions</b></div>

<div>

    <div class="texEnum_paragraph chatData" id="6fc3fe07-e4ed-4b10-af3f-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> If you find more than one correct answer, enter only one answer.</div>
    </div>

    <div class="texEnum_paragraph chatData" id="640a9f08-02db-4852-a7bc-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> You can enter up to 5 characters for a positive answer and up to 6 characters
            (including the negative sign) for a negative answer.</div>
    </div>

    <div class="texEnum_paragraph chatData" id="fd1eec1f-529b-4f1e-8367-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> If your answer is a fraction that doesn't fit in the provided space, enter the
            decimal equivalent.</div>
    </div>

    <div class="texEnum_paragraph chatData" id="baf19f50-c539-4435-aa70-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> If your answer is a decimal that doesn't fit in the provided space, enter it by
            truncating or rounding at the fourth digit.</div>
    </div>

    <div class="texEnum_paragraph chatData" id="3f253cde-1b59-46cf-bf1a-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> If your answer is a mixed number (such as $\\mathbf{3} \\frac{1}{2}$), enter it as
            an improper fraction ($\\frac{7}{2}$) or its decimal equivalent (3.5).</div>
    </div>

    <div class="texEnum_paragraph chatData" id="818b7c0a-6dd5-4bfe-839c-1935927e1f3">
        <div class="texEnum_enumItem">
            <ul>
                <li></li>
            </ul>
        </div>
        <div class="texEnum_Contents"> Don't enter symbols such as a percent sign, comma, or dollar sign.</div>
    </div>

</div>

<div class="chatData" id="9fa398d8-c12f-44c2-8890-1935927e1f3">
    <div class='texEnv_center' width='50%'>Examples</div>
</div>


<table>
    <colgroup>
        <col style="width: 20%;">
        <col style="width: 40%;">
        <col style="width: 40%;">
    </colgroup>
    <tr>
        <th style="text-align:center">Answer</th>
        <th style="text-align:center">Acceptable ways to enter answer</th>
        <th style="text-align:center">Unacceptable: will NOT receive credit</th>
    </tr>
    <tr>
        <td style="text-align:center">3.5</td>
        <td>$$\\require{color}
            \\begin{aligned}
            & \\texttt{3.5}\\\\
            & \\texttt{3.50}\\\\
            & \\texttt{7/2}
            \\end{aligned}
            $$</td>
        <td>$$
            \\begin{aligned}
            & \\texttt{31/2}\\\\
            & \\texttt{3&nbsp;1/2}
            \\end{aligned}
            $$</td>
    </tr>
    <tr>
        <td style="text-align:center">$
            \\frac{2}{3}
            $</td>
        <td>$$
            \\begin{aligned}
            & \\texttt{2/3}\\\\
            & \\texttt{.6666}\\\\
            & \\texttt{.6667}\\\\
            & \\texttt{0.666}\\\\
            & \\texttt{0.667}
            \\end{aligned}
            $$</td>
        <td>$$
            \\begin{aligned}
            & \\texttt{0.66}\\\\
            & \\texttt{.66}\\\\
            & \\texttt{0.67}\\\\
            & \\texttt{.67}
            \\end{aligned}
            $$</td>
    </tr>
    <tr>
        <td style="text-align:center">$-\\frac{1}{3}$</td>
        <td>$$
            \\begin{aligned}
            & \\texttt{-1/3}\\\\
            & \\texttt{-.3333}\\\\
            & \\texttt{-0.333}
            \\end{aligned}
            $$</td>
        <td>$$
            \\begin{aligned}
            & \\texttt{-.33}\\\\
            & \\texttt{-0.33}
            \\end{aligned}
            $$</td>
    </tr>
</table>`;