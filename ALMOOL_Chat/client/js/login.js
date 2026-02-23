function encryptString(str)
{
  let encryptSource = prepareEncrypting(str);
  return keccak_256(`${encryptSource[0]}-${str}-${encryptSource[1]}`);
}

function prepareEncrypting(str)
{
  let result1 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  let result2 = '0000000000000000000000000000000000000000000000000000000000000000';

  for(let i=0;i<100000;i++)
  {
    let s = keccak_256(`${str}-${i}`);
    if(s<result1)
    {
      result1 = s;
    }
    if(s>result2)
    {
      result2 = s;
    }
  }

  return [result1,result2];
}

function login(ID,PW)
{
  const data = JSON.stringify({
    userID: ID,
    userPW: encryptString(PW)
  });

  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/login`,false);
  httpData.setRequestHeader('content-type', 'application/json');

  httpData.onreadystatechange = function()
  {
    if (this.readyState == 4 && this.status == 200) {
    }
  }

  httpData.send(data);
  return httpData.responseText;
}

function logout()
{
  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/logout`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send();

  location.reload();
}

function modifyPassword(prevPW,newPW)
{
  const data = JSON.stringify({
    prevPW: encryptString(prevPW),
    newPW: encryptString(newPW)
  });

  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/modifyPassword`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send(data);

  return httpData.responseText;
}

function initUserData(bookIndex,convID,chatType)
{
  let examID = aexamID;
  if(examID == undefined)
    examID = '';

  const data = JSON.stringify({
    examID:examID,
    bookIndex:bookIndex,
    convID: convID,
    chatType: chatType
  });

  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/initConversation`,false);
  httpData.setRequestHeader('content-type', 'application/json');

  httpData.onreadystatechange = function()
  {
    if (this.readyState == 4 && this.status == 200) {
    }
  }

  httpData.send(data);
}

function getUserData()
{
  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/getUserData`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send();

  let data = JSON.parse(httpData.responseText)['data'];
  let result = Array();

  for (let i=0;i<data.length;i++)
  {
    let bookIndex = data[i][0];
    let problemID = data[i][1];
    let examID = data[i][5];

    if(Object.keys(result).indexOf(`${bookIndex}`) == -1)
    {
      result[bookIndex] = Array();
    }

    if(Object.keys(result[bookIndex]).indexOf(`${problemID}`) == -1)
    {
      result[bookIndex][problemID] = Array();
    }

    result[bookIndex][problemID].push([data[i][2],data[i][3],examID]);
  }

  return result;
}

function getUserInfo()
{
  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/getUserInfo`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send();

  let data = JSON.parse(httpData.responseText)['data'];
  return data;
}


function chatLogin(redirectURL="")
{
  let ID = document.getElementById("id_tt").value;
  let PW = document.getElementById("pw_tt").value;

  let result = login(ID,PW);

  if(result == "login success")
  {
    if(redirectURL != "")
      location.href = redirectURL;
    else
      location.reload(true);
  }
  else
    alert("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
}

function showModifyPassword()
{
  document.getElementById("prevPW_tt").value = "";
  document.getElementById("newPW_tt").value = "";
  document.getElementById("newPW2_tt").value = "";

  const dialog = document.getElementById("modifyPasswordDialog");
  dialog.showModal();
}

function chatModifyPassword()
{
  let prevPW = document.getElementById("prevPW_tt").value;
  let newPW1 = document.getElementById("newPW_tt").value;
  let newPW2 = document.getElementById("newPW2_tt").value;

  if(newPW1 != newPW2)
    alert("변경할 비밀번호가 일치하지 않습니다.");
  else
  {
    let result = modifyPassword(prevPW,newPW1);

    document.getElementById("prevPW_tt").value = "";
    document.getElementById("newPW_tt").value = "";
    document.getElementById("newPW2_tt").value = "";

    if(result == "modify success")
    {
      const dialog = document.getElementById("modifyPasswordDialog");
      dialog.close();
      alert("비밀번호 변경에 성공했습니다.");
    }
    else
      alert("기존 비밀번호가 올바른지 확인 바랍니다.");
  }
}

/*
async function login(ID,PW)
{
  let result;
  
  await fetch(`/backend-api/v2/login`, {
    method: `POST`,
    headers: {
      "content-type": `application/json`,
      accept: `text/event-stream`,
    },
    body: JSON.stringify({
      userID: ID,
      userPW: encryptString(PW)
    }),
  }).then((json) => {result = json;})
	.catch((error) => {result = error;});

  return result;
}
*/