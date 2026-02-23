//let chatLog = [];
let quotedChatID = "";
let quotedChat = "";
let imageChat = "";
let imageURL = "";
let imageData = "";
let nowConvID = "";
let tmp = "";
let showRequest = false;

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const canvasResult = document.getElementById("canvasResultImage");

function renderMarkdownWithID(str)
{
  return markdown.render(str);
}

function processMarkdown(str)
{
  let state = 0;
  let result = str;
  let pos = 0;

  result = result.replace(/\\begin{align*}/g, '\n\\begin{align*}');
  result = result.replace(/\\begin{alignat*}/g, '\n\\begin{alignat*}');
  result = result.replace(/\\\[/g, '\n\\begin{align*}');
  result = result.replace(/\\\]/g, '\\end{align*}\n');
  result = result.replace(/\[/g, '\\[');
  result = result.replace(/\]/g, '\\]');
  result = result.replace(/<imageChat.*>/g,'');
  result = result.replace(/<\/imageChat>/g,'');

  while(1)
  {
    pos = result.indexOf("$$",pos);
    if(pos == -1)
      break;

    if(state%2 == 0)
      result = result.replace("$$","\n\\begin{align*}");
    else
      result = result.replace("$$","\\end{align*}\n");
    pos += 10;

    ++state;
  }
  //result = result.replace(/\\/g, '\\\\');
  return result;
}

async function renderMarkdownAtTarget(str,targetDivID,parentDivID,isLaTeX=true,isJSON=false)
{
  if(showRequest == false)
  {
    let pos1 = str.indexOf(`<a href='${ALMOOL_CHAT_BASE}/assets/requestResult`);
    if(pos1 > 0)
      str = str.substring(0,pos1);
  }

  if(isLaTeX)
  {
    let texCode = "";
    let json = "";
    if(isJSON)
    {
      json = JSON.parse(str);
      texCode = json[0]['text'];
    }
    else
      texCode = str;

    
    
    texCode = texCode.replace(/<quotedChat>/g,"__(quotedChat__)");
    texCode = texCode.replace(/<\/quotedChat>/g,"__(/quotedChat__)");

    let imageStartPos = 0;
    while(1)
    {
      let imageChatStartOpen = texCode.indexOf("<imageChat",imageStartPos);
      if(imageChatStartOpen == -1)
        break;

      let imageChatStartClose = texCode.indexOf(">",imageChatStartOpen);
      texCode = `${texCode.substring(0,imageChatStartOpen)}__(${texCode.substring(imageChatStartOpen+1,imageChatStartClose)}__)${texCode.substring(imageChatStartClose+1)}`;
      imageStartPos = imageChatStartClose;
    }
    //texCode = texCode.replace(/<imageChat>/g,"__(imageChat__)");
    texCode = texCode.replace(/<\/imageChat>/g,"__(/imageChat__)");

    let result = "";

    result = processIKPSGrammer(texCode,`${ALMOOL_STUDY_BASE}/${folderData[nowBookIndex]["folder"]}`);

    result = result.replace(/__\(/g,"<");
    result = result.replace(/__\)/g,">");
    result = result.replace(/<imageChat/g,"<imageChat><img");

    console.log(targetDivID , " => ",texCode, " => ",result);

    if(isJSON)
    {
      document.getElementById(targetDivID).innerHTML = `<img style="max-width:500px;width:100%;" src="${json[1]['image_url']['url']}">${result}`;
    }
    else
      document.getElementById(targetDivID).innerHTML = result;

    MathJax.typesetPromise();

    cancelButtonString.innerHTML = '해설 중단하기';
    stop_generating.classList.add(`stop_generating-hidden`);
    prompt_lock = false;
    hideInput(false);

    return;
  }
  //else
  //{
  //  MathJax.typesetPromise();
  //  markdown.options.html = true;
  //  markdown.options.quotes = "'";
  //  document.getElementById(targetDivID).innerHTML = markdown.render(str);
  //}

  

  markdown.options.html = false;
  markdown.options.quotes = "'";

  prompt_lock = true;
  hideInput(true);
  cancelButtonString.innerHTML = '해설 전체 바로 보기';
  stop_generating.classList.remove(`stop_generating-hidden`);

  //let ikpsProcessed = processIKPSGrammer(str);
  //let markdownSolution = processMarkdown(ikpsProcessed);
  //let markdownData = markdown.parse(markdownSolution.trim());
  let newStr = str.trim();
  newStr = newStr.replace(/\\\(/g,"\\\\(");
  newStr = newStr.replace(/\\\)/g,"\\\\)");
  //newStr = newStr.replace(/`/g,"&lsquo;");
  newStr = newStr.replace(/\\\[/g,"((left1))");
  newStr = newStr.replace(/\\\]/g,"((right1))");
  newStr = newStr.replace(/\[/g,"((left))");
  newStr = newStr.replace(/\]/g,"((right))");

  let startPos = 0;
  while(1)
  {
    startPos = newStr.indexOf("((left1))",startPos);
    if(startPos == -1)
      break;

    let endPos = newStr.indexOf("((right1))",startPos);

    let equationStr = newStr.substring(startPos+9,endPos);
    equationStr = equationStr.replace(/\n/g," ");
    newStr = newStr.substring(0,startPos+9) + equationStr + newStr.substring(endPos);
    startPos += equationStr.length;
  }

  //newStr = newStr.replace(/\\left\[/g,"((left))");
  //newStr = newStr.replace(/\\right\]/g,"((right))");

  console.log("beforeParse: ", newStr);
  let markdownData = markdown.parse(newStr);

  //console.log("ikpsProcessed: ", ikpsProcessed);
  //console.log("markdownSolution: ", markdownSolution);
  console.log("markdownData: ", markdownData);

  let targetDiv = document.getElementById(targetDivID);
  let parentDiv = document.getElementById(parentDivID);

  let tagStack = [];
  let renderHTML = "";
  let lastRenderHTML = "";
  let prevRendered = "";
  let randParID = uuid();
  let lastID = "";

  let prevStr = "";
  let nextStr = "";
  let dataStorage = [];
  let toNext = 0;

  let currentParentIndex = -1;


  for(let i=0;i<markdownData.length;i++)
  {
    let nowMarkdownData = markdownData[i];
    
    let nowTag = nowMarkdownData["tag"];

    if(nowTag == "hr")
    {
      lastRenderHTML = renderHTML;
      renderHTML += `<hr>`;
    }
    if(nowMarkdownData["type"].indexOf("open") != -1)
    {

      //**console.log("open: ",i,nowTag);
      if(nowTag == 'p')
      {
        if(dataStorage.length != 0)
          continue;
        lastID = uuid();

        lastRenderHTML = renderHTML;
        renderHTML += `<div class='chatData' id='${lastID}'><div class='chatQuoteContents' id='${lastID}-contents'>`;
        tagStack.push(`div`);
        tagStack.push(`div`);
      }
      else
      {
        lastRenderHTML = renderHTML;
        renderHTML += `<${nowTag}>`;
        tagStack.push(nowTag);
      }
    }
    else if(nowMarkdownData["type"].indexOf("close") != -1)
    {
      //**console.log("close: ",i,nowTag);
      if(nowTag == 'p')
      {
        if(dataStorage.length != 0)
          continue;

        lastRenderHTML = renderHTML;
        renderHTML += `</div><div class='chatQuoteButton' id='${lastID}-quote'></div></div>`;
        tagStack.pop();
        tagStack.pop();
      }
      else
      {
        lastRenderHTML = renderHTML;
        renderHTML += `</${nowTag}>`;
        tagStack.pop();
      }
    }
    else if(nowMarkdownData["type"].indexOf("html_block") != -1)
    {
      let nowContent = nowMarkdownData["content"];

      if(nowContent.indexOf("<img") != -1)
      {
        nowContent = nowContent.replace(/<img /g,`<img style="height:100%;" `);
        
        lastRenderHTML = renderHTML;
        renderHTML += `<div class="chatData" style="justify-content:center;zoom:0.5;">
        ${nowContent}
        </div>`;
      }
      else if(nowContent.indexOf("<table") != -1)
      {
        lastRenderHTML = renderHTML;
        renderHTML += `<div class="chatData" style="justify-content:center;">
        <div style="border:1px solid black;padding:4px;">${nowContent}</div>
        </div>`;
      }
    }
    else
    {
      //**console.log("contents: ",i);
      let nowPureContent = nowMarkdownData["content"];
      //let nowContent = prevStr + nowPureContent + nextStr;
      let nowContent = "";

      if(nowMarkdownData["children"] != null)
      {
        for(let j=0;j<nowMarkdownData["children"].length;j++)
        {
          let nowChildren = nowMarkdownData["children"][j];
          if(nowChildren["tag"] != "")
          {
            if(nowChildren["type"] == "softbreak")
            {
              nowContent += `\n`;
            }
            if(nowChildren["type"].indexOf("close") != -1)
            {
              nowContent += `</${nowChildren["tag"]}>`;
            }
            else
            {
              nowContent += `<${nowChildren["tag"]}>`;
            }
          }
          else
          {
            if(nowChildren["content"] == "[" && nowChildren["markup"] == "\\[")
              nowContent += "\\[";
            else if(nowChildren["content"] == "]" && nowChildren["markup"] == "\\]")
              nowContent += "\\]";
            else
            {
              let nowNewContent = nowChildren["content"];
              nowNewContent = nowNewContent.replace(/\(\(left1\)\)/g,"\\[");
              nowNewContent = nowNewContent.replace(/\(\(right1\)\)/g,"\\]");
              nowNewContent = nowNewContent.replace(/\(\(left\)\)/g,"[");
              nowNewContent = nowNewContent.replace(/\(\(right\)\)/g,"]");
              nowContent += nowNewContent;
            }
          }
        }
      }
      else
      {
        if(nowMarkdownData["tag"] == "code")
        {
          lastID = uuid();
          //nowMarkdownData["info"];
          nowContent += `<div class='chatData' id='${lastID}'><div class='chatQuoteContents' id='${lastID}-contents'><acodeTitle>${nowMarkdownData["info"]}</acodeTitle><acode>${nowMarkdownData["content"].trim().replace(/\n/g,"<br>")}</acode></div></div>`;
        }
        else
          nowContent += `<${nowMarkdownData["tag"]}>${nowMarkdownData["content"]}</a${nowMarkdownData["tag"]}>`;
      }
      

      let htmlType = '';

      /*
      if(nowContent.indexOf('<img') != -1)
        htmlType = 'img';
      else if(nowContent.indexOf('<table') != -1)
        htmlType = 'table_open';
      else if(nowContent.indexOf('</table') != -1)
        htmlType = 'table_close';
      */

      /*
      //table이 여는 태그만 있을 때: 다음 문단으로 넘기기
      if(nowPureContent.indexOf("<table") != -1 && nowPureContent.indexOf("</table>") == -1)
      {
        prevStr = nowContent;
        dataStorage.push('table');
      }
      else if(nowPureContent.indexOf("<table") == -1 && nowPureContent.indexOf("</table>") != -1)
      {
        nextStr = nowContent;
        dataStorage.pop();
      }
      */

      if(dataStorage.length != 0)
        continue;

      /*
      nowContent = nowContent.replace(/<quotedChat>/g,'(__openPar__)quotedChat(__closePar__)');
      nowContent = nowContent.replace(/<\/quotedChat>/g,'(__openPar__)/quotedChat(__closePar__)');
    
      nowContent = nowContent.replace(/<img src/g,'(__openPar__)img src');
      nowContent = nowContent.replace(/\/>/g,'(__closePar__)');

      nowContent = nowContent.replace(/<p align=\'center\'>/g,'(__openPar__)p align=\'center\'(__closePar__)');
      nowContent = nowContent.replace(/<\/p>/g,'(__openPar__)/p(__closePar__)');
      */

      //nowContent = nowContent.replace(/\\\[/g,'[');
      //nowContent = nowContent.replace(/\\\]/g,']');
      chatLog[lastID] = nowPureContent;

      /*
      nowContent = nowContent.replace(/</g,'\\lt ');
      nowContent = nowContent.replace(/>/g,'\\gt ');
      nowContent = nowContent.replace(/\(__openPar__\)/g,'<');
      nowContent = nowContent.replace(/\(__closePar__\)/g,'>');
      */
      
      //**console.log("now: ",nowContent);

      if(renderState == 1)
      {
        let closeTag = "";
        for(let j=tagStack.length-1;j>=0;j--)
        {
          closeTag += `</${tagStack[j]}>`;
        }

        let length = 0;
        while(renderState == 1)
        {
          length += 10;
          if(length>nowContent.length)
          {
            length = nowContent.length;
          }
          let nowContentsString = nowContent.substring(0,length);

          if(nowContentsString.indexOf("\\begin{align*}") != -1 && nowContentsString.indexOf("\\end{align*}") == -1)
            nowContentsString += "\\end{align*}";
          else if(nowContentsString.indexOf("\\begin{alignat*}") != -1 && nowContentsString.indexOf("\\end{alignat*}") == -1)
            nowContentsString += "\\end{alignat*}";
    
          targetDiv.innerHTML = renderHTML + nowContentsString + closeTag;
          MathJax.typesetPromise([targetDiv]);

          if(targetDiv.innerHTML.indexOf('align*') != -1 || targetDiv.innerHTML.indexOf('alignat*') != -1)
          {
            targetDiv.innerHTML = prevRendered;
          }
          else
          {
            prevRendered = targetDiv.innerHTML;
          }

          if(length == nowContent.length)
          {
            break;
          }

          window.scrollTo(0, 0);
          parentDiv.scrollTo({ top: parentDiv.scrollHeight, behavior: "auto" });

          await sleep(renderGap);
        }
      }

      //lastRenderHTML = renderHTML;

      /*
      if(htmlType == "img")
      {
        renderHTML = `${lastRenderHTML}<div class='chatData' id='${lastID}' style='justify-content:center;zoom:0.5;'><div class='chatQuoteContents' id='${lastID}-contents'>${nowContent}`;
      }
      else if(htmlType == "table_open")
      {
        renderHTML = `${lastRenderHTML}<div class='chatData' id='${lastID}' style='justify-content:center;border:1px solid black;'><div class='chatQuoteContents' id='${lastID}-contents'>${nowContent}`;
      }
      else if(htmlType == "table_close")
      {
        renderHTML = `${lastRenderHTML}</div>`;
      }
      else
      */
        renderHTML += nowContent;
    }
  }
  //**console.log("renderHTML1: ",renderHTML);

  targetDiv.innerHTML = renderHTML;
  MathJax.typesetPromise([targetDiv]);

  //if(enableQuote)
  {
    for (const key in chatLog)
    {
      let quoteDiv = document.getElementById(`${key}-quote`);
      if(quoteDiv)
      {
        document.getElementById(`${key}-quote`).addEventListener("click", function() {
          if(quotedChatID != "")
          {
            let prevLine = document.getElementById(quotedChatID);
            prevLine.classList.remove(`chatDataQuoted`);
            prevLine.classList.add(`chatData`);

            if(quotedChatID == key)
            {
              quotedChatID = "";
              quotedChatBox.innerHTML = "";
              quotedChatBox.style.display = "none";
              return;
            }
          }

          let line = document.getElementById(key);
          line.classList.remove(`chatData`);
          line.classList.add(`chatDataQuoted`);

          let lineContents = document.getElementById(`${key}-contents`);
          
          quotedChatID = key;
          quotedChatBox.innerHTML = `<quotedChat>${lineContents.innerHTML}</quotedChat>`;
          quotedChatBox.style.display = "block";
        });
      }
    }
  }

  //document.querySelectorAll(`code`).forEach((el) => {
  //  hljs.highlightElement(el);
  //});

  cancelButtonString.innerHTML = '해설 중단하기';
  stop_generating.classList.add(`stop_generating-hidden`);
  prompt_lock = false;
  hideInput(false);
}


const query = (obj) =>
  Object.keys(obj)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
const colorThemes = document.querySelectorAll('[name="theme"]');
const markdown = window.markdownit();
const message_box = document.getElementById(`messages`);
const message_input = document.getElementById(`message-input`);
const box_conversations = document.querySelector(`.top`);
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector(`.stop_generating`);
const send_button = document.querySelector(`#send-button`);
const quotedChatBox = document.getElementById("quotedChat");
const uploadedImageBox = document.getElementById("uploadedImageBox");
const uploadedImage = document.getElementById("uploadedImage");
const modifyPasswordDialog = document.getElementById("modifyPasswordDialog");
const imageUploadDiv = document.getElementById("imageUpload");
const imageUploadButton = document.getElementById("imageUploadButton");
const specialImageUploadDiv = document.getElementById("specialImageUpload");
const specialImageUploadButton = document.getElementById("specialImageUploadButton");

//let globalProblemContents = '';
//let globalProblemAnswer = '';
//let globalProblemSolution = '';
// let globalProblemContents = request.args.get('ProblemInfo', '');
// let globalProblemAnswer = request.args.get('ProblemAnswer', '');
// let globalProblemSolution = request.args.get('ProblemSolution', '');

document.getElementById("inputProblemInfoBtn").addEventListener("click", function() {
  // Retrieve the values from the textareas
  globalProblemContents = document.getElementById("ProblemContents").value;
  globalProblemAnswer = document.getElementById("ProblemAnswer").value;
  globalProblemSolution = document.getElementById("ProblemSolution").value;

  // TODO: Use the values (problemContents, problemAnswer, problemSolution) as needed
  // For example, you can store them in some global variables or use them directly

  // Clear the textareas after retrieving the values
  // Clear the textareas after retrieving the values
  document.getElementById("ProblemContents").value = "";
  document.getElementById("ProblemAnswer").value = "";
  document.getElementById("ProblemSolution").value = "";
});

function markdownFirstSolution()
{
  markdown.options.html = true;
  markdown.options.quotes = "'";
  let solutionDiv = document.getElementById("user_firstSolution");
  solutionDiv.innerHTML = renderMarkdownWithID(solutionDiv.innerHTML);
}


hljs.addPlugin(new CopyButtonPlugin());

function resizeTextarea(textarea) {
  textarea.style.height = 'auto'; // Reset height to auto to get the new scroll height
  let newHeight = Math.min(textarea.scrollHeight, 200); // Set a max height
  textarea.style.height = newHeight + 'px';
}


const format = (text) => {
  return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

message_input.addEventListener("blur", () => {
  window.scrollTo(0, 0);
});

message_input.addEventListener("focus", () => {
  return false; //document.documentElement.scrollTop = document.documentElement.scrollHeight;
});


function deleteAllConversation()
{
  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/deleteAllConversation`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send();

  userData = [];
  let convos = document.getElementsByClassName('convo');
  while(convos.length>0)
    convos[0].remove();

  location.reload(true);
  nowBookIndex = -1;
  nowProblemID = "";
}

const delete_conversations = async () => {

  for (let i = 0; i < localStorage.length; i++)
  {
    if (localStorage.key(i).startsWith(`conversation${chatType}:`))
    {
      let conversation = localStorage.getItem(localStorage.key(i));
      localStorage.removeItem(conversation);
    }
  }

  await new_conversation();
  await hide_deleteAll_option();
};

const handle_ask = async () => {
  message_input.style.height = `80px`;
  message_input.focus();

  window.scrollTo(0, 0);
  let message = message_input.value;

  if(quotedChatID != "")
  {
    //quotedChat = chatLog[quotedChatID].replace(/\(__openPar__\)/g,'<');
    //quotedChat = quotedChat.replace(/\(__closePar__\)/g,'>');
    quotedChat = chatLog[quotedChatID];
    let line = document.getElementById(quotedChatID);
    line.classList.remove(`chatDataQuoted`);
    line.classList.add(`chatData`);
  }
  else
  {
    quotedChat = "";
  }
  quotedChatID = "";
  quotedChatBox.innerHTML = "";
  quotedChatBox.style.display = "none";
  

  if (message.length > 0) {
    message_input.value = '';
    await ask_gpt(message);
  }
};

const remove_cancel_button = async () => {
  stop_generating.classList.add(`stop_generating-hiding`);

  setTimeout(() => {
    stop_generating.classList.remove(`stop_generating-hiding`);
    stop_generating.classList.add(`stop_generating-hidden`);
  }, 300);
};

const ask_gpt = async (message) => {
  try {
    message_input.value = ``;
    message_input.innerHTML = ``;
    message_input.innerText = ``;

    //add_conversation(window.conversation_id, message.substr(0, 20));
    window.scrollTo(0, 0);
    window.controller = new AbortController();

    jailbreak = document.getElementById("jailbreak");
    model = document.getElementById("model");
    prompt_lock = true;
    hideInput(true);
    window.text = ``;
    window.token = message_id();

    stop_generating.classList.remove(`stop_generating-hidden`);

    const sendMessage =
    `${(quotedChat!="") ? `<quotedChat>${quotedChat}</quotedChat>\n` : ''}` +
    `${(imageChat!="") ? `<imageChat src="${imageURL}">${imageChat}</imageChat>\n` : ''}` +
    `${message}`;

    message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${user_image}
                
                </div>
                <div class="chatContent" id="user_${token}"> 
                    ${format(sendMessage)}
                </div>
            </div>
        `;

    MathJax.typesetPromise([document.getElementById(`user_${token}`)]);
    /* .replace(/(?:\r\n|\r|\n)/g, '<br>') */

    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
    

    message_box.innerHTML += `
            <div class="message" id="gptSol_${window.token}">
                <div class="user">
                    ${gpt_image}
                </div>
                <div class="chatContent" id="gpt_${window.token}">
                    <div id="cursor"></div>
                </div>
            </div>
        `;
    
    let hasImage = (imageChat == "" && imageURL != "") ? "1" : "0";

    const systemMessage = {
      role: 'system',
      content: window.conversation_id,
      problemID: nowProblemID,
      bookIndex: nowBookIndex,
      examID:nowExamID,
      hasImage:hasImage
    };

    const assistantMessage = {
      role: 'assistant',
      content: quotedChat
    };
    
    //**console.log("windowconvid=",window.conversation_id);

    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);

    let chatPart = [];

    if(imageChat == "" && imageURL != "")
    {
      chatPart = [
        systemMessage,
        assistantMessage,
        {
          role: "user",
          content: [
            {
              type:"text",
              text:sendMessage
            },
            {
              type:"image_url",
              image_url:{url:imageURL}
            },
          ],
        },
      ];
    }
    else
    {
      chatPart = [
        systemMessage,
        assistantMessage,
        {
            content: sendMessage,
            role: "user",
        },
      ];
    }

    const response = await fetch(`/backend-api/v2/${(chatType.indexOf("upstage")==-1) ? "mathConversation" : "upstageConversation"}`, {
      method: `POST`,
      signal: window.controller.signal,
      headers: {
        "content-type": `application/json`,
        accept: `text/event-stream`,
      },
      body: JSON.stringify({
        conversation_id: window.conversation_id,
        action: `_ask`,
        model: model.options[model.selectedIndex].value,
        jailbreak: jailbreak.options[jailbreak.selectedIndex].value,
        meta: {
          id: window.token,
          content: {
            conversation: await getConversation(window.conversation_id),//await get_conversation(window.conversation_id)*/
            internet_access: document.getElementById("switch").checked,
            content_type: "text",
            chatType: chatType,
            parts: chatPart,
          },
        },
      }),
    });


    deleteImage();
    //**console.log("2222222222222222");

    const reader = response.body.getReader();
    let text = "";
    let nowChunk = "";
    let userMessage = document.getElementById(`user_${token}`);
    let renderTarget = document.getElementById(`gpt_${window.token}`);
    markdown.options.html = true;


    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      nowChunk = new TextDecoder().decode(value);

      if (
        nowChunk.includes(
          `<form id="challenge-form" action="/backend-api/v2/conversation?`
        )
      ) {
        nowChunk = `cloudflare token expired, please refresh the page.`;
      }

      text += nowChunk;

      renderTarget.innerHTML = text;
      MathJax.typesetPromise([renderTarget]);
      renderTarget.innerHTML = renderMarkdownWithID(renderTarget.innerHTML);
      

      document.querySelectorAll(`code`).forEach((el) => {
        hljs.highlightElement(el);
      });

      window.scrollTo(0, 0);
      message_box.scrollTo({ top: message_box.scrollHeight, behavior: "auto" });
    }

    //**console.log("text=",text);
    // if text contains :
    if (text.includes(`instead. Maintaining this website and API costs a lot of money`))
    {
      document.getElementById(`gpt_${window.token}`).innerHTML =
        "An error occured, please reload / refresh cache and try again.";
    }
    else if (text.includes(`###insufficient problem count###`))
    {
      document.getElementById(`gpt_${window.token}`).innerHTML =
        "질문 가능 토큰의 개수가 부족합니다.";
    }
    else if (text.includes(`###illegal keyword###`))
    {
      document.getElementById(`gpt_${window.token}`).innerHTML =
        "허용되지 않은 단어가 포함되어 있습니다. 다시 질문을 해 주세요.";
    }
    else
    {
      renderState = 2;
      renderTarget.innerHTML = text;
      MathJax.typesetPromise([renderTarget]);
      //renderTarget.innerHTML = renderMarkdownWithID(renderTarget.innerHTML);
      renderMarkdownAtTarget(text,`gpt_${window.token}`,`messages`,false);
    }

    //**console.log("nowBookIndex:",nowBookIndex,", nowProblemID:",nowProblemID);

    userData[nowBookIndex][nowProblemID].push([sendMessage,'user']);
    userData[nowBookIndex][nowProblemID].push([text,'assistant']);

    userInfo = getUserInfo();
    document.getElementById("nowCount").innerHTML = `Live Support Credits: ${parseInt(userInfo[0][1])-parseInt(userInfo[0][0])}/${userInfo[0][1]}`;

    //add_message(window.conversation_id, "user", sendMessage);
    //add_message(window.conversation_id, "assistant", text);

    //save_message(window.conversation_id,userMessage.innerHTML);
    //save_message(window.conversation_id,renderTarget.innerHTML);

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();
    prompt_lock = false;
    hideInput(false);

    //await load_conversations(20, 0);
    window.scrollTo(0, 0);
  } catch (e) {
    //add_message(window.conversation_id, "user", message);

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();
    prompt_lock = false;
    hideInput(false);

    await load_conversations(20, 0);

    ////**console.log(e);

    let cursorDiv = document.getElementById(`cursor`);
    if (cursorDiv) cursorDiv.parentNode.removeChild(cursorDiv);

    if (e.name != `AbortError`) {
      let error_message = `oops ! something went wrong, please try again / reload. [stacktrace in console]`;

      document.getElementById(`gpt_${window.token}`).innerHTML = error_message;
      add_message(window.conversation_id, "assistant", error_message);
    } else {
      document.getElementById(`gpt_${window.token}`).innerHTML += ` [aborted]`;
      add_message(window.conversation_id, "assistant", text + ` [aborted]`);
    }
    //**console.log("askEnd");
    MathJax.typesetPromise();

    window.scrollTo(0, 0);
  }
};

const clear_conversations = async () => {
  const elements = box_conversations.childNodes;
  let index = elements.length;

  if (index > 0) {
    while (index--) {
      const element = elements[index];
      if (
        element.nodeType === Node.ELEMENT_NODE &&
        element.tagName.toLowerCase() !== `button`
      ) {
        box_conversations.removeChild(element);
      }
    }
  }
};

async function clearConversation()
{
  let messages = message_box.getElementsByTagName(`div`);

  while (messages.length > 0) {
    message_box.removeChild(messages[0]);
  }
}

const clear_conversation = async () => {
  let messages = message_box.getElementsByTagName(`div`);

  while (messages.length > 0) {
    message_box.removeChild(messages[0]);
  }
};

const show_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "none";
  yes.style.display = "block";
  not.style.display = "block"; 
};

const hide_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "block";
  yes.style.display = "none";
  not.style.display = "none"; 
};

const show_deleteAll_option = async (event) => {
  const yes = document.getElementById(`yes-deleteAll`);
  const not = document.getElementById(`not-deleteAll`);
  
  yes.style.display = "flex";
  not.style.display = "flex"; 
};

const hide_deleteAll_option = async (event) => {
  const yes = document.getElementById(`yes-deleteAll`);
  const not = document.getElementById(`not-deleteAll`);
  
  yes.style.display = "none";
  not.style.display = "none";
};






async function deleteConversation(bookIndex,conversationID)
{
  //let sendData = getDataFromConvID(conversationID);
  //if(sendData == null)
  //  return;

  //let bookIndex = sendData[0];
  //let problemID = sendData[1];
  let problemID = conversationID;

  const data = JSON.stringify({
    bookIndex: bookIndex,
    problemID: problemID
  });

  const httpData = new XMLHttpRequest();
  httpData.open('POST',`/backend-api/v2/deleteConversation`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send(data);

  const conversation = document.getElementById(`convo-${bookIndex}-${problemID}`);
  conversation.remove();

  delete userData[bookIndex][problemID];

  if(nowBookIndex == bookIndex && nowProblemID == problemID)
  {
    location.reload(true);
    nowBookIndex = -1;
    nowProblemID = "";
  }
}

const delete_conversation = async (conversation_id) => {
  localStorage.removeItem(`conversation${chatType}:${conversation_id}`);

  const conversation = document.getElementById(`convo-${conversation_id}`);
    conversation.remove();

  if (window.conversation_id == conversation_id) {
    await new_conversation();
  }

  await load_conversations(20, 0, true);
};

const set_conversation = async (conversation_id) => {
  try {
    history.pushState({}, null, `/${chatType}/${conversation_id}`);
    window.conversation_id = conversation_id;

    await clear_conversation();
    await load_conversation(conversation_id);
    //**console.log("Conversation loaded");

    await load_conversations(20, 0, true);
    //**console.log("Conversations loaded");

  } catch (error) {
    console.error(`Error in set_conversation${chatType}:`, error);
  }
};



const new_conversation = async () => {
  history.pushState({}, null, `/${chatType}/`);
  window.conversation_id = uuid();

  await clear_conversation();
  await load_conversations(20, 0, true);
};

const load_conversation = async (conversation_id) => {
  let conversation = await JSON.parse(
    localStorage.getItem(`conversation${chatType}:${conversation_id}`)
  );

  if(conversation != null && conversation_id != '')
  {
    for (item of conversation.items) {
      message_box.innerHTML += `
              <div class="message">
                  <div class="user">
                      ${item.role == "assistant" ? gpt_image : user_image}
                      ${
                        item.role == "assistant"
                          ? ``
                          : ``
                      }
                  </div>
                  <div class="chatContent">
                      ${
                        item.role == "assistant"
                          ? renderMarkdownWithID(item.content)
                          : item.content
                      }
                  </div>
              </div>
          `;
    }
  }

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });

  message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    message_box.scrollTop = message_box.scrollHeight;
  }, 500);
};

async function getConversation(conversationID)
{
  //let data = getDataFromConvID(conversationID);
  let data = [nowBookIndex,conversationID];
  let result = [];
  
  if(data == null)
  {
      data = [nowBookIndex,conversationID];
    //data = userData[nowBookIndex][conversationID];

    //if(data == null)
    //  return [];
  }

  let bookIndex = data[0];
  let problemID = data[1];

  console.log("getConversation: ",bookIndex,problemID);

  if(Object.keys(userData).includes(`${bookIndex}`))
  {
    if(Object.keys(userData[bookIndex]).includes(problemID))
    {
      for(let i=0;i<userData[bookIndex][problemID].length;i++)
      {
        if(userData[bookIndex][problemID][i][1] != 'init')
        {
          if(userData[bookIndex][problemID][i][0][0] == "[")
            result.push({role:userData[bookIndex][problemID][i][1],content:JSON.parse(userData[bookIndex][problemID][i][0])});
          else
            result.push({role:userData[bookIndex][problemID][i][1],content:userData[bookIndex][problemID][i][0]});
        }
      }
    }
  }

  return result;
}

const get_conversation = async (conversation_id) => {
  let conversation = await JSON.parse(
    localStorage.getItem(`conversation${chatType}:${conversation_id}`)
  );
  return conversation.items;
};

const add_conversation = async (conversation_id, title) => {
  if (localStorage.getItem(`conversation${chatType}:${conversation_id}`) == null) {
    localStorage.setItem(
      `conversation${chatType}:${conversation_id}`,
      JSON.stringify({
        id: conversation_id,
        title: title,
        items: [],
      })
    );
  }
};

const add_message = async (conversation_id, role, content) => {
  before_adding = JSON.parse(
    localStorage.getItem(`conversation${chatType}:${conversation_id}`)
  );

  before_adding.items.push({
    role: role,
    content: content,
  });

  localStorage.setItem(
    `conversation${chatType}:${conversation_id}`,
    JSON.stringify(before_adding)
  ); // update conversation
};

async function initConversation(bookIndex,problemID,examID='')
{
  nowBookIndex = bookIndex;
  nowProblemID = problemID;

  if(Object.keys(userData).includes(`${bookIndex}`) == false)
    userData[bookIndex] = Array();

  if(Object.keys(userData[bookIndex]).includes(problemID) == false)
    userData[bookIndex][problemID] = Array();

  if(userData[bookIndex][problemID].length == 0)
  {
    userData[bookIndex][problemID].push(['init','init',examID]);
    addConversation(bookIndex,problemID,examID);
    return true;
  }
  return false;
}

async function addConversation(bookIndex,problemID,examID='')
{
  let conversationID = getProblemCode(bookIndex,problemID);
  //let conversationTitle = getConversationTitle(bookIndex,problemID,0);
  let conversationTitle = getConversationTitle(bookIndex,problemID,examID,2);

  box_conversations.innerHTML += `
    <div class="convo" id="convo-${bookIndex}-${conversationID}">
      <div class="left" onclick="loadConversationProblem(${bookIndex},'${problemID}','${examID}','${globalSolutionType}')">
          <i class="fa-regular fa-comments"></i>
          <span class="convo-title">${conversationTitle}</span>
      </div>
      <i onclick="show_option('${conversationID}')" class="fa-regular fa-trash" id="conv-${conversationID}"></i>
      <i onclick="deleteConversation(${bookIndex},'${conversationID}')" class="fa-regular fa-check" id="yes-${conversationID}" style="display:none;"></i>
      <i onclick="hide_option('${conversationID}')" class="fa-regular fa-x" id="not-${conversationID}" style="display:none;"></i>
    </div>
    `;
}

//서버 저장
async function loadConversations()
{
  for (let i=0;i<Object.keys(userData).length;i++)
  {
    let bookIndex = Object.keys(userData)[i];
    //if(Object.keys(bookTitle).indexOf(`${bookIndex}`) == -1)
    //  continue;

    for(let j=0;j<Object.keys(userData[bookIndex]).length;j++)
    {
      let problemID = Object.keys(userData[bookIndex])[j];
      let examID = userData[bookIndex][problemID][0][2];
      if(examID == '' || examID == undefined)
        examID = aexamID;
      let conversationID = getProblemCode(bookIndex,problemID);
      //let conversationTitle = getConversationTitle(bookIndex,problemID,0);
      let conversationTitle = getConversationTitle(bookIndex,problemID,examID,2);
  
      box_conversations.innerHTML += `
      <div class="convo" id="convo-${bookIndex}-${conversationID}">
        <div class="left" onclick="loadConversationProblem(${bookIndex},'${problemID}','${examID}','${globalSolutionType}')">
            <i class="fa-regular fa-comments"></i>
            <span class="convo-title">${conversationTitle}</span>
        </div>
        <i onclick="show_option('${conversationID}')" class="fa-regular fa-trash" id="conv-${conversationID}"></i>
        <i onclick="deleteConversation(${bookIndex},'${conversationID}')" class="fa-regular fa-check" id="yes-${conversationID}" style="display:none;"></i>
        <i onclick="hide_option('${conversationID}')" class="fa-regular fa-x" id="not-${conversationID}" style="display:none;"></i>
      </div>
      `;
    }
  }
}

const load_conversations = async (limit, offset, loader) => {
  ////**console.log(loader);
  //if (loader === undefined) box_conversations.appendChild(spinner);

  let conversations = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith(`conversation${chatType}:`)) {
      let conversation = localStorage.getItem(localStorage.key(i));
      conversations.push(JSON.parse(conversation));
    }
  }

  //if (loader === undefined) spinner.parentNode.removeChild(spinner)
  await clear_conversations();

  for (conversation of conversations) {
    box_conversations.innerHTML += `
    <div class="convo" id="convo-${conversation.id}">
      <div class="left" onclick="set_conversation_problem('${conversation.id}')">
          <i class="fa-regular fa-comments"></i>
          <span class="convo-title">${conversation.title}</span>
      </div>
      <i onclick="show_option('${conversation.id}')" class="fa-regular fa-trash" id="conv-${conversation.id}"></i>
      <i onclick="delete_conversation('${conversation.id}')" class="fa-regular fa-check" id="yes-${conversation.id}" style="display:none;"></i>
      <i onclick="hide_option('${conversation.id}')" class="fa-regular fa-x" id="not-${conversation.id}" style="display:none;"></i>
    </div>
    `;
  }

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });
};

document.getElementById(`cancelButton`).addEventListener(`click`, async () => {
  renderState = 2;
  //renderGap = 0.5;
  window.controller.abort();
  //**console.log(`aborted ${window.conversation_id}`);
});

function h2a(str1) {
  var hex = str1.toString();
  var str = "";

  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }

  return str;
}

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

const message_id = () => {
  random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
    2
  );
  unix = Math.floor(Date.now() / 1000).toString(2);

  return BigInt(`0b${unix}${random_bytes}`).toString();
};

window.onload = async () => {
  load_settings_localstorage();
  prompt_lock = true;
  hideInput(true);


  conversations = 0;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith(`conversation${chatType}:`)) {
      conversations += 1;
    }
  }

  const httpData = new XMLHttpRequest();
  httpData.open('GET',`/assets/json/bookInfo.json`,false);
  httpData.setRequestHeader('content-type', 'application/json');
  httpData.send();

  folderData = JSON.parse(httpData.responseText);
  //if (conversations == 0)
  //  delete_conversations();
//
  //await setTimeout(() => {
  //  load_conversations(20, 0);
  //}, 1);

  if(chatType != 'null')
  {
    userData = getUserData();
    loadConversations();
  }
  
  if(additionalURL != "")
  {
    let urlResult = parseURL(additionalURL);
    if(urlResult != null)
      {
        renderState = 2;
        loadConversationProblem(urlResult[0],urlResult[1],aexamID,globalSolutionType);
      }
  }
  else if(abookIndex != '' && aproblemID != '')
  {
    renderState = 2;
    loadConversationProblem(abookIndex,aproblemID,aexamID,globalSolutionType);
  }

  if(modifyPasswordDialog)
  {
    modifyPasswordDialog.addEventListener('click', (event) => {
      if (event.target.nodeName === 'DIALOG') {
        modifyPasswordDialog.close();
      }
    });
  }

message_input.addEventListener(`keydown`, async (evt) => {
    if (prompt_lock) return;
    if (evt.keyCode === 13 && !evt.shiftKey) {
        evt.preventDefault();
        //**console.log('pressed enter');
        await handle_ask();
    } else {
      //message_input.style.removeProperty("height");
      //message_input.style.height = message_input.scrollHeight + 4 + "px";
    }
  });

  send_button.addEventListener(`click`, async () => {
    //**console.log("clicked send");
    if (prompt_lock) return;
    await handle_ask();
  });

  document.getElementById("deleteAllConversation").addEventListener(`click`, async () => {
    deleteAllConversation();
  });

  /*
  let loginButton = document.getElementById("login_tt");
  if(loginButton != null)
  {
    loginButton.addEventListener(`click`, async () => {
      let ID = document.getElementById("id_tt").value;
      let PW = document.getElementById("pw_tt").value;

      //**console.log(ID,PW);
      let result = login(ID,PW);

      if(result == "login success")
        location.reload(true);
      else
        alert("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    });
  }
  */

  send_button.addEventListener(`click`, async () => {
    //**console.log("clicked send");
    if (prompt_lock) return;
    await handle_ask();
  });


  message_input.addEventListener(`keydown`, async (evt) => {
    if (prompt_lock) return;
    if (evt.keyCode === 13 && !evt.shiftKey) {
        evt.preventDefault();
        //**console.log('pressed enter');
        await handle_ask();
    } else {
      //message_input.style.removeProperty("height");
      //message_input.style.height = message_input.scrollHeight + 4 + "px";
    }
  });

  if(specialImageUploadDiv)
    addSpecialImageButtonHandler();

  if(imageUploadDiv)
  {
    imageUploadDiv.addEventListener("click",() => {
      imageUploadButton.click();
    });

    imageUploadButton.addEventListener("change",(event) => {
      const selectedFile = imageUploadButton.files[0];

      /*
      let url=window.URL || window.webkitURL;
      let imgSrc=url.createObjectURL(selectedFile);

      let img = new Image();
      img.src = imgSrc;
      img.onload = function() {
        ctx.drawImage(img,0,0);
      };
      */

      //ctx.drawImage(selectedFile.result,0,0);

        
      const fileReader = new FileReader();
      fileReader.onload = async function(e) {
        let img = new Image();
        uploadedImageBox.style.display = "flex";

        canvasResult.innerHTML = `<div><img src="${e.target.result}" style="width:100px;height:80px;"></div><div>image processing</div>`;
        console.log("targetResult: ",e.target.result);
        //canvas.style.display = "flex";
        //canvas.style.display = "none";
        //canvasResult.style.display = "none";
        canvasResult.style.display = "flex";

        img.onload = async function() {
          //let width = canvas.clientWidth;
          //let height = canvas.clientHeight;
          //ctx.drawImage(img,0,0,img.width,img.height);
          console.log(canvas.width,canvas.height,img.width,img.height);

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img,0,0,img.width,img.height);
          //ctx.drawImage(img,0,0);


          let imgData = ctx.getImageData(0,0,img.width,img.height);
          let convert = false;
          let pixelSum = 0;
          let pixelCount = imgData.data.length/4;

          for(let i=0;i<imgData.data.length;i+=4)
          {
            let r = imgData.data[i];
            let g = imgData.data[i+1];
            let b = imgData.data[i+2];
            let a = imgData.data[i+3];

            //가장 밝은 픽셀을 더함
            let maxPixel = Math.max(r,g,b);
            pixelSum += maxPixel;
          }

          console.log(pixelSum,pixelCount);

          let avgPixel = pixelSum / pixelCount;
          if(avgPixel < 60)
            convert = true;

          let src = "";

          if(convert)
          {
            for(let i=0;i<imgData.data.length;i+=4)
            {
              imgData.data[i] = 255 - imgData.data[i];
              imgData.data[i+1] = 255 - imgData.data[i+1];
              imgData.data[i+2] = 255 - imgData.data[i+2];
            }

            ctx.putImageData(imgData,0,0);
          }

          src = canvas.toDataURL();
          let imgFileName = Date.now();

          let slashPos = src.indexOf("/");
          let semicolonPos = src.indexOf(";");
          let ext = src.substring(slashPos+1,semicolonPos);
          
          await fetch(`${ALMOOL_STUDY_BASE}/saveImage.php`, {
            method: `POST`,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              data: src,
              filename: imgFileName
            }),
          })

          const response = await fetch(`https://api.mathpix.com/v3/text`, {
            method: `POST`,
            headers: {
              "app_id": `researchteam_629d15_cb012f`,
              "app_key": `ecb15c4f015f7000900d1e99c1669d92e1677c6cf5ef3932179fcad87cdd91a3`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              src: `${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`,
              format: ["text", "data", "html","latex_styled"],
              data_options: {
                "include_asciimath": true,
                "include_latex": true
              },
              idiomatic_eqn_arrays:true
            }),
          }).then((res) => res.json())
          .then((data) => {
            let equation = `$${data["latex_styled"]}$`;
            let equationDiv = document.getElementById("equationFromImage");
            imageChat = equation;
            imageURL = `${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`;
            equationDiv.innerHTML = equation;
            MathJax.typesetPromise([equationDiv]);
            //console.log(data);
            //alert(data["latex"]);
          });

          canvas.style.display = "none";
          canvasResult.style.display = "flex";
          canvasResult.innerHTML = `<div><img src="${e.target.result}" style="width:100px;height:80px;"></div>`;
          //canvasResult.innerHTML = `<div><img src="${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}"></div>`;
        };
        img.src = e.target.result;
        //ctx.clearRect(0,0,img.width,img.height);

        


        //canvas.width = 300;
        //canvas.height = 150;
        //ctx.putImageData(imgData,0,0,0,0,150,150);

        //ctx.drawImage(e.result,0,0);
        //uploadedImage.src = fileReader.result;

        /*
        const response = await fetch(`https://api.mathpix.com/v3/latex`, {
          method: `POST`,
          headers: {
            "app_id": `researchteam_629d15_cb012f`,
            "app_key": `ecb15c4f015f7000900d1e99c1669d92e1677c6cf5ef3932179fcad87cdd91a3`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            src: fileReader.result,
            format: ["latex_simplified", "asciimath"]
          }),
        }).then((res) => res.json())
        .then((data) => {
          let equation = `$${data["latex"]}$`;
          let equationDiv = document.getElementById("equationFromImage");
          imageChat = equation;
          equationDiv.innerHTML = equation;
          MathJax.typesetPromise([equationDiv]);
          //console.log(data);
          //alert(data["latex"]);
        });
        */
      };
        
      fileReader.readAsDataURL(selectedFile);
      event.target.value = "";
    });
  }

  /*
  if (!window.location.href.endsWith(`#`)) {
    if (/\/chat\/.+/.test(window.location.href)) {
      await load_conversation(window.conversation_id);
    }
  }
  */
  register_settings_localstorage();
  //getBookSelectionBox(50,2,"GPTSolution");
};

function addSpecialImageButtonHandler()
{
  specialImageUploadDiv.addEventListener("click",() => {
    specialImageUploadButton.click();
  });

  specialImageUploadButton.addEventListener("change",(event) => {
    const selectedFile = specialImageUploadButton.files[0];

    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
      let img = new Image();
      uploadedImageBox.style.display = "flex";

      // Update the text from "image processing" to "image processed"
      canvasResult.innerHTML = `<div><img src="${e.target.result}" style="width:100px;height:80px;"></div><div>image processed</div>`;
      console.log("targetResult: ",e.target.result);
      canvasResult.style.display = "flex";

      img.onload = async function() {
        console.log(canvas.width,canvas.height,img.width,img.height);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img,0,0,img.width,img.height);

        src = canvas.toDataURL();
        let imgFileName = Date.now();

        let slashPos = src.indexOf("/");
        let semicolonPos = src.indexOf(";");
        let ext = src.substring(slashPos+1,semicolonPos);

        let equationResponse = await fetch(`/backend-api/v2/mathEquation`, {
          method: `POST`,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model:"gpt-4o",
            data: src,
            filename: imgFileName,
            url:`${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`
          })
        })

        imageChat = "";
        imageURL = `${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`;

        console.log(equationResponse);


        /*
        const response = await fetch(`https://api.mathpix.com/v3/text`, {
          method: `POST`,
          headers: {
            "app_id": `researchteam_629d15_cb012f`,
            "app_key": `ecb15c4f015f7000900d1e99c1669d92e1677c6cf5ef3932179fcad87cdd91a3`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            src: `${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`,
            format: ["text", "data", "html","latex_styled"],
            data_options: {
              "include_asciimath": true,
              "include_latex": true
            },
            idiomatic_eqn_arrays:true
          }),
        }).then((res) => res.json())
        .then((data) => {
          let equation = `$${data["latex_styled"]}$`;
          let equationDiv = document.getElementById("equationFromImage");
          imageChat = equation;
          imageURL = `${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}`;
          equationDiv.innerHTML = equation;
          MathJax.typesetPromise([equationDiv]);
          //console.log(data);
          //alert(data["latex"]);
        });

        canvas.style.display = "none";
        canvasResult.style.display = "flex";
        canvasResult.innerHTML = `<div><img src="${e.target.result}" style="width:100px;height:80px;"></div>`;
        
        */
        //canvasResult.innerHTML = `<div><img src="${ALMOOL_STUDY_BASE}/img/${imgFileName}.${ext}"></div>`;
 
        // Call API with an empty prompt after image processing
        await ask_gpt("Evaluate this solution in detail and assign a score."); 
        // Call handle_ask function to send the message to GPT
        handle_ask(); // Trigger the message sending function
      };
      img.src = e.target.result;
      //ctx.clearRect(0,0,img.width,img.height);

      


      //canvas.width = 300;
      //canvas.height = 150;
      //ctx.putImageData(imgData,0,0,0,0,150,150);

      //ctx.drawImage(e.result,0,0);
      //uploadedImage.src = fileReader.result;

      /*
      const response = await fetch(`https://api.mathpix.com/v3/latex`, {
        method: `POST`,
        headers: {
          "app_id": `researchteam_629d15_cb012f`,
          "app_key": `ecb15c4f015f7000900d1e99c1669d92e1677c6cf5ef3932179fcad87cdd91a3`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          src: fileReader.result,
          format: ["latex_simplified", "asciimath"]
        }),
      }).then((res) => res.json())
      .then((data) => {
        let equation = `$${data["latex"]}$`;
        let equationDiv = document.getElementById("equationFromImage");
        imageChat = equation;
        equationDiv.innerHTML = equation;
        MathJax.typesetPromise([equationDiv]);
        //console.log(data);
        //alert(data["latex"]);
      });
      */
    };
      
    fileReader.readAsDataURL(selectedFile);
    event.target.value = "";
  });
}

function deleteImage()
{
  let equationDiv = document.getElementById("equationFromImage");
  uploadedImageBox.style.display = "none";
  imageChat = "";
  imageURL = ``;
  equationDiv.innerHTML = ``;
}

document.querySelector(".mobile-sidebar").addEventListener("click", (event) => {
  const sidebar = document.querySelector(".conversations");
  const leftBoxAround = document.getElementById("leftBoxAround");

  if (sidebar.classList.contains("shown")) {
    leftBoxAround.classList.remove("shown");
    sidebar.classList.remove("shown");
    event.target.classList.remove("rotated");
  } else {
    leftBoxAround.classList.add("shown");
    sidebar.classList.add("shown");
    event.target.classList.add("rotated");
  }

  window.scrollTo(0, 0);
});

const register_settings_localstorage = async () => {
  settings_ids = ["switch", "model", "jailbreak"];
  settings_elements = settings_ids.map((id) => document.getElementById(id));
  settings_elements.map((element) =>
    element.addEventListener(`change`, async (event) => {
      switch (event.target.type) {
        case "checkbox":
          localStorage.setItem(event.target.id, event.target.checked);
          break;
        case "select-one":
          localStorage.setItem(event.target.id, event.target.selectedIndex);
          break;
        default:
          console.warn("Unresolved element type");
      }
    })
  );
};

const load_settings_localstorage = async () => {
  settings_ids = ["switch", "model", "jailbreak"];
  settings_elements = settings_ids.map((id) => document.getElementById(id));
  settings_elements.map((element) => {
    if (localStorage.getItem(element.id)) {
      switch (element.type) {
        case "checkbox":
          element.checked = localStorage.getItem(element.id) === "true";
          break;
        case "select-one":
          element.selectedIndex = parseInt(localStorage.getItem(element.id));
          break;
        default:
          console.warn("Unresolved element type");
      }
    }
  });
};

// Theme storage for recurring viewers
const storeTheme = function (theme) {
  localStorage.setItem("theme", theme);
};

// set theme when visitor returns
const setTheme = function () {
  const activeTheme = localStorage.getItem("theme");
  colorThemes.forEach((themeOption) => {
    if (themeOption.id === activeTheme) {
      themeOption.checked = true;
    }
  });
  // fallback for no :has() support
  document.documentElement.className = activeTheme;
};

colorThemes.forEach((themeOption) => {
  themeOption.addEventListener("click", () => {
    storeTheme(themeOption.id);
    // fallback for no :has() support
    document.documentElement.className = themeOption.id;
  });
});



function parseProblemID(problemID)
{
  let underBarPos = 0;
  let result = [];

  while(1)
  {
    let startPos = underBarPos;
    underBarPos = problemID.indexOf('_',startPos);

    if(underBarPos == -1)
    {
      result.push(problemID.substring(startPos));
      break;
    }

    result.push(problemID.substring(startPos,underBarPos));
    ++underBarPos;
  }
  
  return result;
}

const load_conversation_problem = async (conversation_id) => {
  //let conversation = await JSON.parse(
  //  localStorage.getItem(`conversation${chatType}:${conversation_id}`)
  //);
  ////**console.log(conversation, conversation_id);

  let sendData = getDataFromConvID(conversation_id);
  if(sendData == null)
    return;

  let problemData = await JSON.parse(getProblemData(sendData[0],sendData[1],sendData[2]));
  let solutionType = "GPTSolution";

  nowBookIndex = sendData[0];
  nowPageNumber = sendData[1];
  nowProblemNumber = sendData[2];
  nowProblemIndex = 0;

  if(nowProblemNumber != null)
  {
    let nowProblemList = problemList[nowBookIndex][nowPageNumber];
    for(let i=0;i<nowProblemList.length;i++)
    {
      let lastSlashPos = nowProblemList[i].lastIndexOf('/');
      let problemInfo = nowProblemList[i].substring(lastSlashPos).slice(5,-3);

      if(problemInfo.indexOf(nowProblemNumber) != -1)
      {
        nowProblemIndex = i;
        break;
      }
    }
  }

  globalProblemContents = problemData["Contents"];
  globalProblemSelection = "";
  globalProblemAnswer = "";
  globalProblemSolution = (problemData[solutionType].length>10) ? problemData[solutionType] : problemData["Solution"];

  let problemShowString = "";
  /*
  if(sendData[2])
    problemShowString = `[${bookTitle[sendData[0]][1]} ${sendData[1]}p ${(sendData[2][0]>='0' && sendData[2][0]<='9') ? `${sendData[2]}번` : `${problemTypeTitle[sendData[2][0]]} ${sendData[2].substr(1)}번`}]`;
  else
    problemShowString = `[${bookTitle[sendData[0]][1]} ${sendData[1]}p]`;
  */

  markdown.options.html = true;
  markdown.options.quotes = "'";
  
  message_box.innerHTML += 
  `<div class="message">
      <div class="user">
          <img src="/assets/img/user.png" alt="User Avatar">
          
      </div>
      <div class="chatContent" id="user_firstAsk"> 
          ${problemShowString}
      </div>
  </div>
  <div class="message">
      <div class="user">
          <img src="/assets/img/gpt.png" alt="GPT Avatar">
          
      </div>
      <div class="chatContent" id="user_firstSolution"> 
          
      </div>
  </div>`;

  let firstAskDiv = document.getElementById("user_firstAsk");
  let firstSolDiv = document.getElementById("user_firstSolution");
  MathJax.typesetPromise([firstAskDiv]);

  let fullSolution = globalProblemSolution;

  quotedChatID = "";
  chatLog = [];
  quotedChatBox.innerHTML = "";
  quotedChatBox.style.display = "none";
  renderState = 2;

  renderMarkdownAtTarget(fullSolution,`user_firstSolution`,`messages`,true);
  
  globalProblemSolution = fullSolution;


  let i = 0;
  for (item of conversation.items) {
    message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${item.role == "assistant" ? gpt_image : user_image}
                    ${
                      item.role == "assistant"
                        ? ``
                        : ``
                    }
                </div>
                <div class="chatContent" id="${conversation_id}-${i}">
                    ${item.content}
                </div>
            </div>
        `;

    if(item.role == "assistant")
    {
      renderMarkdownAtTarget(item.content,`${conversation_id}-${i}`,`messages`,true);
    }

    ++i;
  }

  prompt_lock = false;
  hideInput(false);


  message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    message_box.scrollTop = message_box.scrollHeight;
  }, 500);
  try {
    // Call MathJax to typeset all new math content in the message box
    //await MathJax.typesetPromise();
    //**console.log("MathJax typesetting completed");
  } catch (error) {
    console.error("Error in MathJax typesetting:", error);
  }
};

const new_conversation_id = async (id) => {
  history.pushState({}, null, `/${chatType}/`);
  window.conversation_id = id;

  await clear_conversation();
  await load_conversations(20, 0, true);
};

async function copyCurrentProblemLink()
{
  if(nowBookIndex == -1 || nowProblemID == "")
    window.navigator.clipboard.writeText(`${ALMOOL_CHAT_BASE}/${chatType}/`);
  else
  {
    let conversationID = getProblemCode(nowBookIndex,nowProblemID);
    window.navigator.clipboard.writeText(`${ALMOOL_CHAT_BASE}/${chatType}/${conversationID}`);
  }
  /*
  document.querySelector("#"+buttonID).addEventListener("click", function(){
                
    let tempElem = document.createElement('textarea');
    tempElem.value = text;  
    document.body.appendChild(tempElem);
    
    tempElem.select();
    document.execCommand("copy");
    document.body.removeChild(tempElem);

    document.getElementById(buttonID).classList.toggle("clicked");
    if(previousClickedID != "")
        document.getElementById(previousClickedID).classList.toggle("clicked");
    
    previousClickedID = buttonID;
    });
  */
}

async function loadPrevProblem()
{
  if(nowBookIndex == -1 || nowProblemID == "")
    return false;

  let result = false;

  /*
  let stack = [];
  let parsingData = Object.keys(problemList);
  for(let i=parsingData.length-1;i>=0;i--)
    stack.push(parseingData[i]);
  let prevKey = "";

  while(stack.length>0)
  {
    let nowVal = stack.pop();
    if(typeof(nowVal) == 'object')
    {
      for(let i=nowVal.length-1;i>=0;i--)
      {
        stack.push(nowVal[i]);
      }
    }
    else
    {
      if(nowVal == nowProblemID)
    }
  }
  */

  for(let i=0;i<Object.keys(problemList[nowBookIndex]).length;i++)
  {
    let key = Object.keys(problemList[nowBookIndex])[i];
    let searchResult = problemList[nowBookIndex][key].indexOf(nowProblemID);

    if(searchResult != -1)
    {
      if(searchResult > 0)
      {
        nowProblemID = problemList[nowBookIndex][key][searchResult-1];
        result = true;
      }
      else
      {
        if(i != 0)
        {
          let key2 = Object.keys(problemList[nowBookIndex])[i-1];
          nowProblemID = problemList[nowBookIndex][key2][problemList[nowBookIndex][key2].length-1]
          result = true;
        }
      }
      break;
    }
  }

  if(result)
  {
    loadConversationProblem(nowBookIndex,nowProblemID,nowExamID,globalSolutionType);
    document.getElementById("deleteAllConversation").addEventListener(`click`, async () => {
      deleteAllConversation();
    });
  }

  return result;
}

async function loadNextProblem()
{
  let result = false;

  for(let i=0;i<Object.keys(problemList[nowBookIndex]).length;i++)
  {
    let key = Object.keys(problemList[nowBookIndex])[i];
    let searchResult = problemList[nowBookIndex][key].indexOf(nowProblemID);

    if(searchResult != -1)
    {
      if(searchResult+1 < problemList[nowBookIndex][key].length)
      {
        nowProblemID = problemList[nowBookIndex][key][searchResult+1];
        result = true;
      }
      else
      {
        if(i+1 != Object.keys(problemList[nowBookIndex]).length)
        {
          let key2 = Object.keys(problemList[nowBookIndex])[i+1];
          nowProblemID = problemList[nowBookIndex][key2][0];
          result = true;
        }
      }
      break;
    }
  }

  if(result)
  {
    loadConversationProblem(nowBookIndex,nowProblemID,nowExamID,globalSolutionType);
    document.getElementById("deleteAllConversation").addEventListener(`click`, async () => {
      deleteAllConversation();
    });
  }
    

  return result;
}



async function loadConversationProblem(bookIndex,problemID,examID='',solutionType="GPTSolution")
{
  const sidebar = document.querySelector(".conversations");
  const leftBoxAround = document.getElementById("leftBoxAround");
  sidebar.classList.remove("shown");
  leftBoxAround.classList.remove("shown");

  clearConversation();
  let conversationID = getProblemCode(bookIndex,problemID);
  window.conversation_id = conversationID;

  nowBookIndex = bookIndex;
  nowProblemID = problemID;
  nowExamID = examID;
  history.pushState({}, null, `/${chatType}/`);

  if((await initConversation(bookIndex,problemID)) == true)
    initUserData(bookIndex,conversationID,chatType);

  quotedChatID = "";
  chatLog = [];
  quotedChatBox.innerHTML = "";
  quotedChatBox.style.display = "none";
  renderState = 2;
  //showProblemData(bookIndex,problemID,solutionType);
  showExamProblemData(aexamID,bookIndex,problemID,solutionType);


  /*
  window.conversation_id = conversationID;
  
*/
/*
  let prevConvID = nowConvID;
  nowConvID = `convo-${conversationID}`;
  //**console.log("convIDPrevNow: ",prevConvID,nowConvID);

  //addConversation(nowBookIndex,nowProblemID);

  if(prevConvID != "" && nowConvID != prevConvID)
    document.getElementById(prevConvID).classList.remove("nowConversation");
  if(nowConvID != prevConvID)
    document.getElementById(nowConvID).classList.add("nowConversation");
*/
/*
  message_box.style.justifyContent = "";
  renderState = 2;


  
  
  let problemShowString = getConversationTitle(nowBookIndex,nowProblemID,1);

  let problemData = await JSON.parse(getProblemData(nowBookIndex,nowProblemID));

  globalProblemContents = problemData["Contents"];
  globalProblemSelection = "";
  globalProblemAnswer = "";
  globalProblemSolution = (problemData[solutionType].length>10) ? problemData[solutionType] : problemData["Solution"];

  markdown.options.html = true;
  markdown.options.quotes = "'";
  globalProblemContents = problemData["Contents"];
  globalProblemSolution = (problemData[solutionType].length>10) ? problemData[solutionType] : problemData["Solution"];

  message_box.innerHTML += 
  `<div class="message">
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
  //renderMarkdownAtTarget(globalProblemContents,`user_firstAsk`,`messages`,true);
  //renderMarkdownAtTarget(globalProblemSolution,`user_firstSolution`,`messages`,true);
  
*/

  for (let i=0;i<userData[nowBookIndex][nowProblemID].length;i++)
  {
    //if(userData[nowBookIndex][nowProblemID][i][1] == 'assistant')
    if(userData[nowBookIndex][nowProblemID][i][1] == 'init')
      continue;
    
    message_box.innerHTML += `
          <div class="message">
              <div class="user">
                  ${(userData[nowBookIndex][nowProblemID][i][1] == 'assistant') ? gpt_image : user_image}
              </div>
              <div class="chatContent" id="${conversationID}-${i}">
                  ${userData[nowBookIndex][nowProblemID][i][0]}
              </div>
          </div>
      `;

    let isJSON = (userData[nowBookIndex][nowProblemID][i][0][0] == "[");
    let isLaTeX = (userData[nowBookIndex][nowProblemID][i][1] != 'assistant');
    
    renderMarkdownAtTarget(userData[nowBookIndex][nowProblemID][i][0],`${conversationID}-${i}`,`messages`, isLaTeX,isJSON);
  }

  /*
  quotedChatID = "";
  chatLog = [];
  quotedChatBox.innerHTML = "";
  quotedChatBox.style.display = "none";

  prompt_lock = false;
  hideInput(false);
*/
/*
  let firstSolDiv = document.getElementById("user_firstSolution");





  nowPageNumber = sendData[1];
  nowProblemNumber = sendData[2];
  nowProblemIndex = 0;
*/

  if(chatLog != undefined)
  {
    for(const key in chatLog)
    {
      let div = document.getElementById(key);

      if(div)
      {
        document.getElementById(key).addEventListener("click", function() {
          if(quotedChatID != "")
          {
            let prevLine = document.getElementById(quotedChatID);
            prevLine.classList.remove(`chatDataQuoted`);
            prevLine.classList.add(`chatData`);
  
            if(quotedChatID == key)
            {
              quotedChatID = "";
              quotedChatBox.innerHTML = "";
              quotedChatBox.style.display = "none";
              return;
            }
          }
  
          let line = document.getElementById(key);
          line.classList.remove(`chatData`);
          line.classList.add(`chatDataQuoted`);
  
          let lineContents = document.getElementById(key);
          
          quotedChatID = key;
          quotedChatBox.innerHTML = `<quotedChat>${lineContents.innerHTML}</quotedChat>`;
          quotedChatBox.style.display = "block";
        });
      }
    }
  }
  

 

  


  


  

 


  //message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

  //setTimeout(() => {
  //  message_box.scrollTop = message_box.scrollHeight;
  //}, 500);
  try {
    // Call MathJax to typeset all new math content in the message box
    //await MathJax.typesetPromise();
    //**console.log("MathJax typesetting completed");
  } catch (error) {
    console.error("Error in MathJax typesetting:", error);
  }
  //await clear_conversation();
  //await load_conversation_problem(conversation_id);
  //await load_conversations(20, 0, true);
  afterLoadProblem();
}

const set_conversation_problem = async (conversation_id) => {
  history.pushState({}, null, `/${chatType}/${conversation_id}`);
  window.conversation_id = conversation_id;
  const sidebar = document.querySelector(".conversations");
  sidebar.classList.remove("shown");

  message_box.style.justifyContent = "";

  await clear_conversation();
  await load_conversation_problem(conversation_id);
  await load_conversations(20, 0, true);
};

function save_message(convID,contents,userID="")
{
  const data = JSON.stringify({
    'convID':convID,
    'contents':contents
  });

  const httpData = new XMLHttpRequest();

  if(userID == "")
    httpData.open('POST',`${ALMOOL_STUDY_BASE}/DigitalSAT_saveEBSQuestionData.php`,false);
  else
    httpData.open('POST',`${ALMOOL_STUDY_BASE}/DigitalSAT_saveKiceQuestionData.php`,false);
  httpData.setRequestHeader('content-type', 'application/json');

  httpData.onreadystatechange = function()
  {
    if (this.readyState == 4 && this.status == 200) {
    }
  }

  httpData.send(data);
  return httpData.responseText;
}

function hideInput(hide)
{
    document.getElementById("message-input").hidden = hide;
    document.getElementById("send-button").hidden = hide;
    document.getElementById("imageUpload").hidden = hide;
    document.getElementById("modelSelect").hidden = hide;

    if(hide == false)
    {
      //document.getElementById("messages").scrollTo({top:message_box.scrollHeight});
    }
}

document.onload = function()
{setTheme(); 

}


