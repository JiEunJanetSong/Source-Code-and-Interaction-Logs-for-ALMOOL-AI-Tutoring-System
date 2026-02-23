class problemHint
{
    constructor(hintTitle,hintContents)
    {
        this.title = hintTitle;
        this.contents = hintContents;
    }
};

//let problemList = Array();
let hintData = Array();
let showingElement = "";

let mailData = {};
mailData["latexFilePath"] = "latex/test.tex";
mailData["email"] = "contact@example.com";
mailData["data"] = {};

for(let i=0;i<Object.keys(examData).length;i++)
{
    let examTitle = Object.keys(examData)[i];
    //problemList[examTitle] = Array();
    hintData[examTitle] = Array();

    mailData["data"][examTitle] = {};
    mailData["data"][examTitle]["incorrectProblem"] = "";
    mailData["data"][examTitle]["totalProblem"] = "";

    mailData["data"][examTitle]["TotalProblemNumber"] = problemTotalCount[i];
    mailData["data"][examTitle]["CorrectNumber"] = correctNum[examTitle];

    for(let j=0;j<Object.keys(examData[examTitle]).length;j++)
    {
        let problemNum = Object.keys(examData[examTitle])[j];
        //problemList[examTitle][problemNum] = new problem(examData[examTitle][problemNum]["Contents"]);

        hintData[examTitle][problemNum] = Array();
        let keyidx = 0;

        mailData["data"][examTitle][`RealAnswer${problemNum}`] = examData[examTitle][problemNum]["Answer"];
        mailData["data"][examTitle][`MyAnswer${problemNum}`] = customerAnswer[i][problemNum];
        mailData["data"][examTitle][`Correctness${problemNum}`] = (examData[examTitle][problemNum]["Answer"] == customerAnswer[i][problemNum]) ? "O" : "X";

        mailData["data"][examTitle]["totalProblem"] += `${examData[examTitle][problemNum]["Contents"]}\\vfill\n${examData[examTitle][problemNum]["Solution"]}\\begin{center}\\href{http://localhost:5001/Papua/?afilePath=${examData[examTitle][problemNum]["filePath"]}&aexamCode=1302}{\\includegraphics[width=0.1\\textwidth]{DB/Harder/qrcode_${problemNum.padStart(2,'0')}.png}}\\end{center}\\newpage\n`;

        if(examData[examTitle][problemNum]["Answer"] != customerAnswer[i][problemNum])
        {
            mailData["data"][examTitle]["incorrectProblem"] += `${examData[examTitle][problemNum]["Contents"]}\\vfill\n${examData[examTitle][problemNum]["Solution"]}\\begin{center}\\href{http://localhost:5001/Papua/?afilePath=${examData[examTitle][problemNum]["filePath"]}&aexamCode=1302}{\\includegraphics[width=0.1\\textwidth]{DB/Harder/qrcode_${problemNum.padStart(2,'0')}.png}}\\end{center}\\newpage\n`;
        }

        for(let k=0;k<Object.keys(examData[examTitle][problemNum]).length;k++)
        {
            let key = Object.keys(examData[examTitle][problemNum])[k];
            if(key.indexOf("Hint") != -1)
            {
                hintData[examTitle][problemNum][keyidx] = new problemHint(key,examData[examTitle][problemNum][key]);
                keyidx++;
            }
        }
    }
}

function sendResultMail(email,timestamp)
{
    mailData["email"] = email;
    //mailData["latexFilePath"] = `latex/${timestamp}.tex`;
    let sendData = JSON.stringify(mailData);
    console.log(sendData);

    const httpData = new XMLHttpRequest();
    httpData.open('POST',`latexMail.php`,false);
    httpData.setRequestHeader('content-type', 'application/json');

    httpData.send(sendData);
    
    if(httpData.responseText.indexOf("send success.") != -1)
        alert("메일이 성공적으로 전송되었습니다.");
}

function sendResultMail_temp(email,content,type=0)
{
    let sendData = {}
    sendData["email"] = email;
    sendData["content"] = content;
    sendData = JSON.stringify(sendData);
    console.log(sendData);

    const httpData = new XMLHttpRequest();
    httpData.open('POST',`mailTemp.php`,false);
    httpData.setRequestHeader('content-type', 'application/json');

    httpData.send(sendData);
    
    if(type == 0)
    {
        if(httpData.responseText.indexOf("send success.") != -1)
            alert("메일이 성공적으로 전송되었습니다.");
    }
    
}

function getAnswerTitleCode(examidx,problemNum)
{
    let examTitle = examList[examidx];
    let answerTitleCode = 
    `<h3 class="font-bold text-lg">Problem Review</h3>
    <table class="table w-96" style="width:90%;margin-left:auto;margin-right:auto;text-align:center;">
    <colgroup>
        <col style="width: 100px;">
        <col style="width: 200px;">
        <col style="width: 200px;">
        <col style="width: 100px;">
    </colgroup>
    <thead>
    <tr>
        <th id="subject">
            Problem Number
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
    <tbody>`;

    answerTitleCode += "<tr class='hover'>\n";
    answerTitleCode += "<th>\n";
    answerTitleCode += problemNum;
    answerTitleCode += "</th>\n";
    answerTitleCode += "<th>\n";
    answerTitleCode += examData[examidx]["problem"][problemNum]["Answer"];
    answerTitleCode += "</th>\n";
    if(examData[examidx]["problem"][problemNum]["Answer"] == customerAnswer[examidx][problemNum])
        answerTitleCode += "<th id='rightValue'>\n";
    else
        answerTitleCode += "<th id='errorValue'>\n";
    answerTitleCode += customerAnswer[examidx][problemNum];
    answerTitleCode += "</th>\n";
    if(examData[examidx]["problem"][problemNum]["Answer"] == customerAnswer[examidx][problemNum])
        answerTitleCode += "<th id='rightValue'>O\n";
    else
        answerTitleCode += "<th id='errorValue'>X\n";
    answerTitleCode += "</th>\n";
    answerTitleCode += "</tr>\n";

    return answerTitleCode;
}

function getExamIndex(examTitle)
{
    return examList.indexOf(examTitle);
}

function showReview(examidx,problemNum)
{
    let examTitle = examList[examidx];
    let problemReviewStr = `<h3 class="font-bold text-lg">Problem Main Text</h3>${processIKPSGrammer(examData[examidx]["problem"][problemNum]["Contents"])}`;


    document.getElementById("problemReviewTitle").innerHTML = getAnswerTitleCode(examidx,problemNum);
    document.getElementById("problemReview").innerHTML = problemReviewStr;
    document.getElementById("problemReviewHint").innerHTML = getSolutionCode(examidx,problemNum);

    let dialog = document.getElementById("problemReviewDialog");
    MathJax.typeset();
    dialog.show();
}

function showSolution(examidx,problemNum)
{
    let examTitle = examList[examidx];
    let elementTag = examTitle + "-" + problemNum + "-Solution";

    if(showingElement == elementTag)
    {
        showingElement = "";
        document.getElementById("solutionData").innerHTML = `<div class="py-24 text-center" style="color:darkgray">Solution or Hint Shows Here.</div>`;
    }
    else
    {
        showingElement = elementTag;
        document.getElementById("solutionData").innerHTML = processIKPSGrammer(examData[examidx]["problem"][problemNum]["Solution"]);
    }

    MathJax.typesetPromise();
}

function showConcept(examidx,problemNum,n)
{
    let examTitle = examList[examidx];
    let elementTag = examTitle + "-" + problemNum + "-Hint";

    if(showingElement == elementTag)
    {
        showingElement = "";
        document.getElementById("solutionData").innerHTML = `<div class="py-24 text-center" style="color:darkgray">Solution or Hint Shows Here.</div>`;
    }
    else
    {
        showingElement = elementTag;
        document.getElementById("solutionData").innerHTML = examData[examidx]["problem"][problemNum]["Concept"];
    }

    MathJax.typesetPromise();
}

function getSolutionCode(examidx,problemNum)
{
    let examTitle = examList[examidx];
    //let problemID = examData[examidx]["problem"][problemNum]["filePath"];
    let problemID = `${examData[examidx]["problem"][problemNum]["folderIndex"]}:${examData[examidx]["problem"][problemNum]["problemName"]}`;

    //let hintNum = examData[examidx]["problem"][problemNum].length;
    //let lineNum = Math.floor((hintNum+1)/2);
    let nowSetValue = traceSetValue(examData,examidx,problemNum);

    let conceptSwitch = (nowSetValue["ConceptSwitch"]) ? nowSetValue["ConceptSwitch"] : "0";
    let conceptLabel = (nowSetValue["ConceptLabel"]) ? nowSetValue["ConceptLabel"] : "Concept";
    if(conceptSwitch == "0")
        conceptLabel = "";
    
    let solutionSwitch = (nowSetValue["SolutionSwitch"]) ? nowSetValue["SolutionSwitch"] : "1";
    let solutionLabel = (nowSetValue["SolutionLabel"]) ? nowSetValue["SolutionLabel"] : "Solution";
    if(solutionSwitch == "0")
        solutionLabel = "";

    let hintButtonCode = "";
    if(solutionLabel != "")
    {
        hintButtonCode += `<button class='btn btn-secondary' type='button' onclick='showConcept(${examidx},${problemNum})'>Concept</button> `;
    }

    let solutionCode = 
    `<div class="flex flex-row items-center w-full">
        <div class="w-1/5"><h3 class="font-bold text-lg">Solution & Hint</h3></div>
        <div class="w-4/5">
            <button class='btn btn-primary' type='button' onclick='showSolution(${examidx},${problemNum});'>Solution</button>
            ${/*hintButtonCode*/''}
            <button class='btn btn-success' type='button' onclick="askToTutor('${examID}','${bookIndex}','${problemID}');">Ask Almool</button>
        </div>
    </div>
    <div class="py-4" id="solutionData"><div class="py-24 text-center" style="color:darkgray">Solution or Hint Shows Here.</div></div>
    `;

    return solutionCode;
}

function traceSetValue(examData,examidx,problemIndex)
{
    let SetValue = {};

    for(let i=0;i<examidx;i++)
    {
        for(let j=0;j<examData[i]["problem"].length;j++)
        {
            for(const key in examData[i]["problem"][j]["value"])
            {
                SetValue[key] = examData[i]["problem"][j]["value"][key];
            }
        }
    }

    for(let j=0;j<=problemIndex;j++)
    {
        for(const key in examData[examidx]["problem"][j]["value"])
        {
            SetValue[key] = examData[examidx]["problem"][j]["value"][key];
        }
    }

    return SetValue;
}

function closeButton()
{
    showingElement = "";
}
