let nowBookIndex = -1;
let nowProblemID = "";
let nowExamID = "";
let nowPageNumber = -1;
let nowProblemNumber = -1;
let nowProblemIndex = -1;
let nowProblemType = -1;

let problemSubmitted = false;
let problemInfo = "";
let problemList = [];

function makeNavigator()
{

}

function getPureBookSelectionBox()
{
  let buttonList = "";
  for(let i=0;i<bookTitle.length;i++)
  {
    buttonList += 
    `<div class="innerBox" id="inputPage">
      <button class="new_convo"  onclick="getProblemNumberInputBox(${i},'${solutionType}')">
        <i class="fa-regular fa-plus"></i>
        <span>${bookTitle[i][0]} 질문하기</span>
      </button>
    </div>`;
  }

  let contentsBox = document.getElementById("messages");
  contentsBox.style.justifyContent = "center";
  contentsBox.innerHTML = 
  `<div class="flexBox" id="problemInfoBox">
    ${buttonList}
  </div>`;

  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");
  //event.target.classList.remove("rotated");
}

function getBookSelectionBox(startIndex,num,solutionType="GPTSolution")
{
  hideInput(true);
  let buttonList = "";

  if(nowConvID != "")
    document.getElementById(nowConvID).classList.remove("nowConversation");
  nowConvID = "";

  nowBookIndex = -1;
  nowProblemID = "";

  for(let i=0;i<num;i++)
  {
    if(startIndex+i == 2)
      buttonList += 
      `<div class="innerBox" id="inputPage">
        <button class="new_convo"  onclick="getProblemNumberInputBox(${startIndex+i},'Solution')">
          <i class="fa-regular fa-plus"></i>
          <span>${bookTitle[startIndex+i][0]} 질문하기</span>
        </button>
      </div>`;
    else
      buttonList += 
      `<div class="innerBox" id="inputPage">
        <button class="new_convo"  onclick="getProblemNumberInputBox(${startIndex+i},'${solutionType}')">
          <i class="fa-regular fa-plus"></i>
          <span>${bookTitle[startIndex+i][0]} 질문하기</span>
        </button>
      </div>`;
  }

  let contentsBox = document.getElementById("messages");
  contentsBox.style.justifyContent = "center";
  contentsBox.innerHTML = 
  `<div class="flexBox" id="problemInfoBox">
    ${buttonList}
  </div>`;

  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");
  //event.target.classList.remove("rotated");
}

function getProblemNumberInputBox(bookIndex,solutionType="GPTSolution")
{
  prompt_lock = true;
  hideInput(true);

  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");
  const mobile_sidebar = document.querySelector(".mobile-sidebar");
  mobile_sidebar.classList.remove("rotated");

  nowBookIndex = bookIndex;

  if(Object.keys(problemList).indexOf(`${bookIndex}`) == -1)
  {
    getProblemList(bookIndex);
  }
  

  let contentsBox = document.getElementById("messages");
  contentsBox.style.justifyContent = "center";
  contentsBox.innerHTML = 
  `<div class="flexBox" id="problemInfoBox">
    <div class="innerBox" id="inputPage">
      <input
        class="problemNumberInput problemNumberInputGray"
        value="${(chatType=='kice') ? "질문할 번호" : "질문할 페이지"}"
        id="inputPageString"
        disabled
      />
      <input
        style="width:50px;"
        pattern="[0-9]"
        class="problemNumberInput problemNumberInputGray"
        id="inputPageInput"
        onkeydown="processProblemNumberInput2(event,'inputPage',${bookIndex},'${solutionType}')"
      />
    </div>
    <div class="innerBox" id="inputProblemNumber">
      
    </div>
  </div>`;
}



function sleep(sec) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}



function convertFirstLetterToUpperCase(str)
{
  let str2 = str.replace(/[^A-Za-z]+/g,"");
  return `${str2[0].toUpperCase()}${str2.substring(1)}`;
}

async function showProblemData(bookIndex,problemID,solutionType="GPTSolution")
{
  let problemTitle = getConversationTitle(bookIndex,problemID,1);
  problemData = JSON.parse(getProblemData(bookIndex,problemID));

  let keyArr = Object.keys(problemData);
  for(let i=0;i<keyArr.length;i++)
  {
      problemData[keyArr[i]] = problemData[keyArr[i]].replace(/``/g,"\"");
      problemData[keyArr[i]] = problemData[keyArr[i]].replace(/`/g,"\'");
  }

  globalProblemContents = problemData["Contents"];
  globalProblemSelection = "";
  globalProblemAnswer = "";
  globalProblemSolution = (problemData[solutionType].length>10) ? problemData[solutionType] : problemData["Solution"];
  baseURL = `${ALMOOL_STUDY_BASE}/${problemData["ImageFilePath"]}`;


  /*let prevNextButton = `<div class="problemMoveButton" style="width:80px;" onclick="loadPrevProblem${convertFirstLetterToUpperCase(chatType)}();"><i class="fa-solid fa-caret-left"></i> Prev</div>
      <div class="problemMoveButton" style="width:80px;" onclick="loadNextProblem${convertFirstLetterToUpperCase(chatType)}();">Next <i class="fa-solid fa-caret-right"></i></div>`;*/
  let prevNextButton = `<div class="problemMoveButton" style="width:80px;" onclick="loadPrevProblem();"><i class="fa-solid fa-caret-left"></i> Prev</div>
      <div class="problemMoveButton" style="width:80px;" onclick="loadNextProblem();">Next <i class="fa-solid fa-caret-right"></i></div>`;

  message_box.style.justifyContent = "";
  
  message_box.innerHTML = 
 `<div class="moveProblem">
    ${prevNextButton}
  </div>
  <div class="message">
      <div class="user">
          <img src="/assets/img/user.png" alt="User Avatar">
          
      </div>
      <div class="chatContent" id="user_firstAsk"> 
      
      </div>
  </div>
  <div class="message">
      <div class="user">
          <img src="/assets/img/gpt.png" alt="GPT Avatar">
          
      </div>
      <div class="chatContent" id="user_firstSolution"> 
          
      </div>
  </div>`;

  //let firstAskDiv = document.getElementById("user_firstAsk");
  //MathJax.typesetPromise([firstAskDiv]);

  quotedChatID = "";
  chatLog = [];

  let prevRenderState = renderState;
  renderState = 2;
  //renderMarkdownAtTarget(`${problemTitle} \n\n ${problemData["Contents"]}`,`user_firstAsk`,`messages`,false);
  renderMarkdownAtTarget(`${problemData["Contents"]}`,`user_firstAsk`,`messages`,true);
  renderState = prevRenderState;
  renderMarkdownAtTarget(globalProblemSolution,`user_firstSolution`,`messages`,true);
}


async function showExamProblemData(examID,bookIndex,problemID,solutionType="GPTSolution")
{
  let problemTitle = "";
  problemData = JSON.parse(getExamProblemData(examID,bookIndex,problemID));

  let keyArr = Object.keys(problemData);
  for(let i=0;i<keyArr.length;i++)
  {
      problemData[keyArr[i]] = problemData[keyArr[i]].replace(/``/g,"\"");
      problemData[keyArr[i]] = problemData[keyArr[i]].replace(/`/g,"\'");
  }

  console.log("showExamProblemData:",examID,bookIndex,problemID,problemData);

  globalProblemContents = problemData["Contents"];
  globalProblemSelection = "";
  globalProblemAnswer = "";
  globalProblemSolution = (problemData[solutionType].length>10) ? problemData[solutionType] : problemData["Solution"];
  baseURL = `${ALMOOL_STUDY_BASE}/${problemData["ImageFilePath"]}`;


  /*let prevNextButton = `<div class="problemMoveButton" style="width:80px;" onclick="loadPrevProblem${convertFirstLetterToUpperCase(chatType)}();"><i class="fa-solid fa-caret-left"></i> Prev</div>
  <div class="problemMoveButton" style="width:80px;" onclick="loadNextProblem${convertFirstLetterToUpperCase(chatType)}();">Next <i class="fa-solid fa-caret-right"></i></div>`;*/
  let prevNextButton = `<div class="problemMoveButton" style="width:80px;" onclick="loadPrevProblem();"><i class="fa-solid fa-caret-left"></i> Prev</div>
  <div class="problemMoveButton" style="width:80px;" onclick="loadNextProblem();">Next <i class="fa-solid fa-caret-right"></i></div>`;

  message_box.style.justifyContent = "";
  
  message_box.innerHTML = 
 `
 <div class="message">${getConversationTitle(bookIndex,problemID,examID,2)}</div>
 <div class="moveProblem">
    ${prevNextButton}
  </div>
  <div class="message">
      <div class="user">
          <img src="/assets/img/user.png" alt="User Avatar">
          
      </div>
      <div class="chatContent" id="user_firstAsk"> 
      
      </div>
  </div>
  <div class="message">
      <div class="user">
          <img src="/assets/img/gpt.png" alt="GPT Avatar">
          
      </div>
      <div class="chatContent"> 
          <button class="showButton" onclick="showSolution()" id="showButton">Click To Show Solution</button>
          <div id="user_firstSolution" style="display:none;flex-direction:column;"></div>
      </div>
  </div>`;

  //let firstAskDiv = document.getElementById("user_firstAsk");
  //MathJax.typesetPromise([firstAskDiv]);

  quotedChatID = "";
  chatLog = [];

  let prevRenderState = renderState;
  renderState = 2;
  //renderMarkdownAtTarget(`${problemTitle} \n\n ${problemData["Contents"]}`,`user_firstAsk`,`messages`,false);
  renderMarkdownAtTarget(`${problemData["Contents"]}`,`user_firstAsk`,`messages`,true);
  renderState = prevRenderState;
  renderMarkdownAtTarget(globalProblemSolution,`user_firstSolution`,`messages`,true);
}

function showSolution()
{
  let nowSolution = document.getElementById("user_firstSolution");
  if(nowSolution)
  {
    if(nowSolution.style.display == "none")
    {
      document.getElementById("showButton").textContent = "Click To Hide Solution";
      nowSolution.style.display = "flex";
    }
    else
    {
      document.getElementById("showButton").textContent = "Click To Show Solution";
      nowSolution.style.display = "none";
    }
  }
}


//페이지 무관 버튼으로 전체 출력
function getProblemSelectionBoxKice(bookIndex,solutionType="GPTSolution")
{
  prompt_lock = true;
  hideInput(true);

  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");
  const mobile_sidebar = document.querySelector(".mobile-sidebar");
  mobile_sidebar.classList.remove("rotated");

  nowBookIndex = bookIndex;
  
  if(Object.keys(problemList).indexOf(`${bookIndex}`) == -1)
  {
    getProblemList(bookIndex);
  }

  let problemListString = "";
  renderState = 1;
  
  problemListString += "<div class='problemSelectionOneSubject'>";
  for(let i=1;i<=22;i++)
  {
    let problemShowString = getConversationTitle(bookIndex,problemList[bookIndex][i][0],2);

    problemListString +=
    `<div class="problem_buttons">
    <button onclick="loadConversationProblem(${bookIndex},'${problemList[bookIndex][i][0]}','${solutionType}');">
      <span>${problemShowString}</span>
    </button>
    </div>`;
  }
  problemListString += "</div>";

  problemListString += "<div class='problemSelectionOneSubject'>";
  for(let i=23;i<=30;i++)
  {
    let problemShowString = getConversationTitle(bookIndex,problemList[bookIndex][i][0],2);

    problemListString +=
    `<div class="problem_buttons">
    <button onclick="loadConversationProblem(${bookIndex},'${problemList[bookIndex][i][0]}','${solutionType}');">
      <span>${problemShowString}</span>
    </button>
    </div>`;
  }
  problemListString += "</div>";

  problemListString += "<div class='problemSelectionOneSubject'>";
  for(let i=23;i<=30;i++)
  {
    let problemShowString = getConversationTitle(bookIndex,problemList[bookIndex][i][1],2);

    problemListString +=
    `<div class="problem_buttons">
    <button onclick="loadConversationProblem(${bookIndex},'${problemList[bookIndex][i][1]}','${solutionType}');">
      <span>${problemShowString}</span>
    </button>
    </div>`;
  }
  problemListString += "</div>";

  problemListString += "<div class='problemSelectionOneSubject'>";
  for(let i=23;i<=30;i++)
  {
    let problemShowString = getConversationTitle(bookIndex,problemList[bookIndex][i][2],2);

    problemListString +=
    `<div class="problem_buttons">
    <button onclick="loadConversationProblem(${bookIndex},'${problemList[bookIndex][i][2]}','${solutionType}');">
      <span>${problemShowString}</span>
    </button>
    </div>`;
  }
  problemListString += "</div>";
  
  let contentsBox = document.getElementById("messages");
  contentsBox.innerHTML = problemListString;
}

function getProblemSelectionBox(bookIndex,solutionType="GPTSolution")
{
  prompt_lock = true;
  hideInput(true);

  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");
  const mobile_sidebar = document.querySelector(".mobile-sidebar");
  mobile_sidebar.classList.remove("rotated");

  nowBookIndex = bookIndex;
  
  if(Object.keys(problemList).indexOf(`${bookIndex}`) == -1)
  {
    getProblemList(bookIndex);
  }

  let problemListString = "";
  renderState = 1;

  problemListString += "<div class='problemSelectionOneSubject'>";
  for(const bIndex in problemList)
  {
    for(const pageNum in problemList[bIndex])
    {
      for(const problemNum in problemList[bIndex][pageNum])
      {
        let problemShowString = getConversationTitle(bookIndex,problemList[bIndex][pageNum][problemNum],2);

        problemListString +=
        `<div class="problem_buttons">
        <button onclick="loadConversationProblem(${bookIndex},'${problemList[bIndex][pageNum][problemNum]}','${solutionType}');">
          <span>${problemShowString}</span>
        </button>
        </div>`;
      }
    }
  }
  problemListString += "</div>";

  
  let contentsBox = document.getElementById("messages");
  contentsBox.innerHTML = problemListString;
}

//페이지 입력하고 
function processProblemNumberInput2(event,divID,bookIndex,solutionType="GPTSolution")
{
  if((event.keyCode >= 48 && event.keyCode <= 57) || event.keyCode == 8)
  {
    let number = document.getElementById(divID+"Input").value;

    if(number.length <= 1 && event.keyCode == 8)
    {
      document.getElementById(divID+"String").className = "problemNumberInput problemNumberInputGray";
      document.getElementById(divID+"Input").className = "problemNumberInput problemNumberInputGray";
    }
    else
    {
      document.getElementById(divID+"String").className = "problemNumberInput";
      document.getElementById(divID+"Input").className = "problemNumberInput";
    }
  }
  else if(event.keyCode == 13)    //엔터
  {
    let number = document.getElementById(divID+"Input").value;
    nowPageNumber = parseInt(number);
    let nowProblemList = problemList[bookIndex][nowPageNumber];

    if(nowProblemList == null)
      return;
    
    if(nowProblemList.length > 1)
    {
      let problemListString = "";
      
      
      for(let i=0;i<nowProblemList.length;i++)
      {
        
        //let lastUnderBarPos = nowProblemList[i].lastIndexOf('_');
        //let problemInfo = nowProblemList[i].substring(lastUnderBarPos+1);
        let problemShowString = getConversationTitle(bookIndex,nowProblemList[i],2);

        /*
        if(problemInfo[0] >= '0' && problemInfo[0] <= '9')
          problemShowString = `${problemInfo}번`;
        else
          problemShowString = `${problemTypeTitle[problemInfo[0]]} ${problemInfo.substr(1)}번`;

        let problemTitle = `${nowPageNumber}p ${problemShowString}`;
        */
       
        renderState = 1;
        problemListString +=
        `<div class="problem_buttons">
        <button onclick="loadConversationProblem(${bookIndex},'${nowProblemList[i]}','${solutionType}');">
          <span>${problemShowString}</span>
        </button>
        </div>`;
      }
      document.getElementById("inputProblemNumber").innerHTML = problemListString;
    }
    else if(nowProblemList.length == 1)
    {
      renderState = 1;
      loadConversationProblem(bookIndex,nowProblemList[0],solutionType);
    }
  }
}


function isOnlyNumber(str)
{
  let check = /^[0-9]+$/; 
  if (!check.test(str))
      return false;
  else
      return true;
}

function goPrevNumber()
{
  --nowProblemType;

  document.getElementById("inputProblemTypeResult").value = String(nowProblemType).padStart(2,'0');
}

function goNextNumber()
{
  ++nowProblemType;

  document.getElementById("inputProblemTypeResult").value = String(nowProblemType).padStart(2,'0');
}

function setProblemNumber()
{
  let number = document.getElementById("inputProblemTypeResult").value;

  if(isOnlyNumber(number))
  {
      nowProblemType = parseInt(number);
  }
  

  document.getElementById("inputProblemTypeResult").value = nowProblemType;
}

function findFirstNumberPos(str,startPos=0)
{
  for(let i=startPos;i<str.length;i++)
  {
    if(str[i] >= '0' && str[i] <= '9')
      return i;
  }
  return -1;
}


function getExamProblemList(examID,bookIndex)
{
  const httpData = new XMLHttpRequest();
  httpData.open('GET',`${ALMOOL_STUDY_BASE}/DSAT_getProblemList.php?examID=${examID}`,false);
  httpData.send();

  //problemList[bookIndex] = [];
  //let rawProblemList = JSON.parse(httpData.responseText);
  problemList[bookIndex] = JSON.parse(httpData.responseText);
}

function getProblemList(bookIndex)
{
  const httpData = new XMLHttpRequest();
  httpData.open('GET',`${ALMOOL_STUDY_BASE}/DigitalSAT_getEBSProblemList.php?bookIndex=${bookIndex}`,false);
  httpData.send();

  problemList[bookIndex] = [];
  let rawProblemList = JSON.parse(httpData.responseText);

  
  for(let i=0;i<rawProblemList.length;i++)
  {
    let numberStartPos = findFirstNumberPos(rawProblemList[i]);
    let pageNum = parseInt(rawProblemList[i].substring(numberStartPos));

    if(isNaN(pageNum) == false)
    {
      if(Object.keys(problemList[bookIndex]).indexOf(`${pageNum}`) == -1)
      {
        problemList[bookIndex][pageNum] = Array();
      }
      problemList[bookIndex][pageNum].push(rawProblemList[i]);
    }
  }
  

  for(let i=0;i<Object.keys(problemList[bookIndex]).length;i++)
  {
    let pageNum = Object.keys(problemList[bookIndex])[i];

    problemList[bookIndex][pageNum].sort(function(a,b){
      let aBar = a.indexOf('_');
      let bBar = b.indexOf('_');
      let aInfo = (aBar!=-1) ? a.substring(aBar+1) : a;
      let bInfo = (bBar!=-1) ? b.substring(bBar+1) : b;
  
      //숫자만 있지 않은 경우
      if(/^[0-9]*$/.test(aInfo[0]) == false)
      {
        if(aInfo[0] == bInfo[0])
        {
          return parseInt(aInfo.substr(1)) - parseInt(bInfo.substr(1));
        }
        else if(/^[0-9]*$/.test(bInfo[0]) == false)
        {
          return aInfo[0]-bInfo[0];
        }
        else
        {
          return -1;
        }
      }
      else
      {
        parseInt(aInfo) - parseInt(bInfo);
      }
    });
  }
}

function getProblemData(bookIndex,problemID)
{
  const httpData = new XMLHttpRequest();

  if(Object.keys(problemList).indexOf(`${bookIndex}`) == -1)
    getProblemList(bookIndex);
  
  httpData.open('GET',`${ALMOOL_STUDY_BASE}/DSAT_getProblemData.php?bookIndex=${bookIndex}&problemID=${problemID}`,false);
  httpData.send();

  console.log("received: \n",httpData.responseText);
  return httpData.responseText;
}

function getExamProblemData(examID,bookIndex,problemID)
{
  const httpData = new XMLHttpRequest();

  if(examID != "")
  {
    if(Object.keys(problemList).indexOf(`${examID}`) == -1)
      getExamProblemList(examID,bookIndex);

    httpData.open('GET',`${ALMOOL_STUDY_BASE}/DSAT_getProblemData.php?examID=${examID}&bookIndex=${bookIndex}&problemID=${problemID}`,false);
  }
  else
  {
    httpData.open('GET',`${ALMOOL_STUDY_BASE}/DSAT_getProblemData.php?bookIndex=${bookIndex}&problemID=${problemID}`,false);
  }
  
  httpData.send();

  console.log("received: \n",httpData.responseText);
  return httpData.responseText;
}



function addFocusListeners() {
  const inputs = document.querySelectorAll('.problemNumberInput');
  inputs.forEach(input => {
    input.addEventListener('focus', (event) => {
      // Find the adjacent label and change its class
      const label = event.target.nextElementSibling;
      if (label) {
        label.classList.add('focused');
      }
    });

    input.addEventListener('blur', (event) => {
      // Find the adjacent label and revert its class
      const label = event.target.nextElementSibling;
      if (label) {
        label.classList.remove('focused');
      }
    });
  });
}

window.onload = function() {
  addFocusListeners();
  //... rest of your onload function
}
