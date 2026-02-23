const ALMOOL_STUDY_BASE = "http://localhost:8080";
const ALMOOL_CHAT_BASE = "";

let nowSubject = "B";

function getDataFromConvID(convID)
{
  return [1300,convID];
}

function parseURL(url)
{
  return getDataFromConvID(url);
}

//convID를 리턴
function getProblemCode(bookIndex,problemID)
{
  return problemID;
}

//nameType 0=간략한 제목, 1=전체 제목, 2=문항 번호만
function getConversationTitle(bookIndex,problemID,examID,isFullName)
{
  if(examTitle[examID] == undefined)
  {
    const httpData = new XMLHttpRequest();
    httpData.open('GET',`${ALMOOL_STUDY_BASE}/DSAT_getExamTitle.php?examID=${examID}`,false);
    httpData.setRequestHeader('content-type', 'application/json');
    httpData.send();
    
    examTitle[examID] = httpData.responseText;
  }
  //let title = bookTitle[bookIndex][isFullName];
  //if(title == undefined)
  //  title = "";
  let problemCodePos = problemID.indexOf(":")+1;

  let title = examTitle[examID];
  let title2 = problemID.substring(problemCodePos);

  return `${title} ${title2}`;
}


async function loadPrevProblemSAT()
{
  loadPrevProblem();

  return true;
}

async function loadNextProblemSAT()
{
  loadNextProblem();

  return true;
}

async function afterLoadProblem()
{
  
}