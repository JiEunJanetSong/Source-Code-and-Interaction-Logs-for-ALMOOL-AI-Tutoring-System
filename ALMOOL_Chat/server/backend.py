import os
import re
import time
import base64
import sqlite3
from json import dumps, load, loads
from datetime import datetime

from flask import render_template_string, request, redirect, session
from hashlib import sha256, sha3_256
from requests import get, post
from openai import OpenAI
from dotenv import load_dotenv

from server.config import special_instructions
import google
from google import genai
from google.genai import types
import google.generativeai

load_dotenv()

PWPrefix = "@#+-*$ITtujnK#$JbI@#_)#@IIFJ)#KK^(CJEM<W4h983u)"
PWSuffix = ")$JFNELKFM%LK&M#$(F)$JEMMFKGKT]]n3-*vdhe83#!~"

ALMOOL_STUDY_URL = os.getenv("ALMOOL_STUDY_URL", "http://localhost:8080")


def addslashes(s):
    result = s.replace("\\", "\\\\")
    result = result.replace("\'", "\\\'")
    result = result.replace("\"", "\\\"")
    return result


def StartDB():
    db = sqlite3.connect(os.path.join(os.path.dirname(__file__), '..', 'data', 'almool_chat.db'))
    cursor = db.cursor()
    return [db, cursor]


def EndDB(db):
    db.commit()
    db.close()


def showUserCount(userID):
    nowCount = -1
    maxCount = -1

    [db, cursor] = StartDB()

    cursor.execute("SELECT nowCount,maxCount FROM UserInfo WHERE ID=?", (userID,))
    res = cursor.fetchall()

    if len(res) == 1:
        nowCount = res[0][0]
        maxCount = res[0][1]

    EndDB(db)
    return [nowCount, maxCount]


def setUserMaxCount(userID, count):
    [db, cursor] = StartDB()

    cursor.execute("UPDATE UserInfo SET maxCount=? WHERE ID=?", (count, userID))

    EndDB(db)
    session["maxCount"] = count


def setUserNowCount(userID, count):
    [db, cursor] = StartDB()

    cursor.execute("UPDATE UserInfo SET nowCount=? WHERE ID=?", (count, userID))

    EndDB(db)
    session["nowCount"] = count


def parseURL_EBS(url):
    firstDashPos = url.find('-')
    if firstDashPos == -1:
        return False

    bookIndex = int(addslashes(url[0:firstDashPos]))
    problemID = url[firstDashPos + 1:]

    return [bookIndex, problemID]


def parseURL_SAT(url):
    return [1300, url]


class Backend_Api:
    def __init__(self, app, config: dict) -> None:
        self.app = app
        self.openai_key = os.getenv("OPENAI_API_KEY") or config.get('openai_key', '')
        self.openai_api_base = os.getenv("OPENAI_API_BASE") or config['openai_api_base']
        self.proxy = config['proxy']
        self.routes = {
            '/backend-api/v2/getUserData': {
                'function': self._getUserData,
                'methods': ['POST']
            },
            '/backend-api/v2/getUserInfo': {
                'function': self._getUserInfo,
                'methods': ['POST']
            },
            '/backend-api/v2/deleteConversation': {
                'function': self._deleteConversation,
                'methods': ['POST']
            },
            '/backend-api/v2/deleteAllConversation': {
                'function': self._deleteAllConversation,
                'methods': ['POST']
            },
            '/backend-api/v2/initConversation': {
                'function': self._initConversation,
                'methods': ['POST']
            },
            '/backend-api/v2/mathConversation': {
                'function': self._mathConversation,
                'methods': ['POST']
            },
            '/backend-api/v2/login': {
                'function': self._login,
                'methods': ['POST']
            },
            '/backend-api/v2/logout': {
                'function': self._logout,
                'methods': ['POST']
            },
            '/backend-api/v2/modifyPassword': {
                'function': self._modifyPassword,
                'methods': ['POST']
            },
            '/backend-api/v2/mathEquation': {
                'function': self._mathEquation,
                'methods': ['POST']
            }
        }

    def _getUserData(self):
        try:
            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute(
                "SELECT bookIndex,problemID,contents,role,timestamp,examID FROM QuestionLog WHERE ID=? AND showLogToUser=1 ORDER BY timestamp ASC",
                (userID,)
            )

            res = cursor.fetchall()
            EndDB(db)

            return {"data": res}, 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _getUserInfo(self):
        try:
            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute("SELECT nowCount,maxCount FROM UserInfo WHERE ID=?", (userID,))

            res = cursor.fetchall()
            EndDB(db)

            return {"data": res}, 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _deleteConversation(self):
        try:
            messages = request.json

            bookIndex = int(messages['bookIndex'])
            problemID = messages['problemID']

            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute(
                "UPDATE QuestionLog SET showLogToUser=0 WHERE ID=? AND bookIndex=? AND problemID=?",
                (userID, bookIndex, problemID)
            )

            EndDB(db)

            return "delete success", 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _deleteAllConversation(self):
        try:
            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute("UPDATE QuestionLog SET showLogToUser=0 WHERE ID=?", (userID,))

            EndDB(db)

            return "deleteAll success", 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _initConversation(self):
        try:
            messages = request.json
            convID = messages['convID']
            userID = session["userID"]
            chatType = messages['chatType']
            examID = messages['examID']

            bookIndex = -1
            problemID = ""

            if chatType == "SAT" or chatType == "UCC":
                bookIndex = int(messages['bookIndex'])
                problemID = messages['problemID'] if 'problemID' in messages else ""
            else:
                [bookIndex, problemID] = parseURL_SAT(convID)

            now = datetime.now()
            [db, cursor] = StartDB()

            cursor.execute(
                "INSERT INTO QuestionLog VALUES(?,?,?,?,?,?,?,?,?)",
                (userID, bookIndex, problemID, 'init', 'init', now.strftime('%Y-%m-%d %H:%M:%S'), 1, 'plain', examID)
            )

            EndDB(db)

            return "success", 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _mathConversation(self):
        try:
            userID = session["userID"]
            userType = session["userType"]
            [nowCount, maxCount] = showUserCount(userID)

            print(nowCount, maxCount)

            if nowCount < 0 or nowCount >= maxCount:
                return {
                    '_action': '_ask',
                    'success': False,
                    "error": "###insufficient problem count###"}, 200
            else:
                setUserMaxCount(userID, maxCount)
                setUserNowCount(userID, nowCount + 1)

            messages = request.json['meta']['content']['parts']
            prompt = messages[-1]

            convID = messages[0]['content']
            chatType = request.json['meta']['content']['chatType']
            hasImage = request.json['meta']['content']['parts'][0]['hasImage']

            print(convID, userID, chatType)

            bookIndex = -1
            problemID = ""
            examID = ""

            if chatType == "SAT" or chatType == "UCC":
                bookIndex = int(messages[0]['bookIndex'])
                problemID = messages[0]['problemID']
                examID = messages[0]['examID']
            else:
                [bookIndex, problemID] = parseURL_SAT(convID)

            print(chatType, bookIndex, problemID, examID)

            bookIndexStr = "%d" % bookIndex

            bookInfoFile = open("client/json/bookInfo.json")
            bookInfo = load(bookInfoFile)
            print("bookInfo:", bookInfo)
            print("bookIndexStr:", bookIndexStr, type(bookIndexStr))
            bookFolder = bookInfo[bookIndexStr]["folder"]
            print("bookFolder:", bookFolder)

            problemData = get(f'{ALMOOL_STUDY_URL}/DSAT_getProblemData.php', params={
                'bookIndex': bookIndex,
                'problemID': problemID,
                'examFolder': bookFolder,
                'isRaw': "true"
            }).json()

            Rubric = problemData['Rubric']
            RubricSystem = "For attached image, evaluate exact point based on scoring guideline with detailed evidence and explanation in the given structure." \
                + "```structure" \
                + "- 1st Sentence or Mathematical expression" \
                + "  - Criteria1-1 : earned point / point" \
                + "  - Criteria1-2 : earned point / point" \
                + "..." \
                + "  - Criteria1-k : earned point / point" \
                + "..." \
                + "- n-th Sentence or Mathematical expression" \
                + "  - Criteria n-1 : earned point / point" \
                + "  - Criteria n-2 : earned point / point" \
                + "..." \
                + "  - Criteria n-x : earned point / point" \
                + "- total points : earned out of full point" \
                + "```" \
                + "Make sure total point be correctly calculated."
            print("Rubric:", Rubric)

            solution = problemData['GPTSolution'] if len(problemData['GPTSolution']) > 10 else problemData['Solution']

            print("0000")

            jailbreak = request.json['jailbreak']
            internet_access = request.json['meta']['content']['internet_access']
            _conversation = request.json['meta']['content']['conversation']

            print("bbbb")
            print(_conversation)

            system_message_content = ""

            if Rubric == "":
                system_message_content = "As a math teaching assistant, you will provide step-by-step solutions to students struggling with math or offer detailed explanations of specific steps in a kind and thorough manner. Avoid apologizing whenever possible. The student will ask questions about a problem and you will provide both the correct answer and the solution. Use Markdown to structure paragraphs and LaTeX to write mathematical equations. Use  $inline math$ for inline equations and \\begin{align*} display math \\end{align*} for display equations.\n\n" \
                    + "- problem : " \
                    + problemData['Contents'] \
                    + "\n" \
                    + "- solution " \
                    + solution \
                    + "\n" \
                    + "- alternative text for attached image (if below are not empty)" \
                    + problemData['AltText'] \
                    + "\n" \
                    + "The part surrounded by <quotedChat> ... </quotedChat> in the student's question quotes a previous response of yours." \
                    + "<imageChat> ... </imageChat> is for referencing student's own solution.\n\n" \
                    + "(__openPar__) ... (__closePar__) is for parse HTML tag, so the contents between those must be ignored." \
                    + "- To alleviate technical issue, do not use triple backquote in every case.\n" \
                    + "- If student ask you to translate, assume they want only the translation of the problem only if it is not specified in their request."
            else:
                system_message_content = "```\n" + Rubric + "\n```" + RubricSystem

            print(system_message_content)

            korean_system_message_content = "당신은 수학 보조교사로서 수학에 어려움을 겪는 학생에게 단계별 해결책을 제시하거나, 특정 단계에 대한 자세한 설명을 친절하게 제공합니다. 문단의 구조를 마크업할 때는 마크다운을, 수학 식을 작성할 때는 LaTeX를 사용해야 합니다. 수식을 쓸 때에는 $inline math$ 와 \\begin{align*} display math \\end{align*}를 사용하십시오.\n\n" \
                + "문제 내용: " + problemData['Contents'] + "\n\n" \
                + "정답 : " + "" + "\n\n" \
                + "해설 : " + solution + "\n\n" \
                + "저작권 문제를 피하기 위해, 학생이 문제 원문(본문)에 대해 물어볼 경우, 문제 원문(본문) 그대로 말해주지 말고, 문제 원문(본문)에 주어진 정보를 개조식으로 정리하여 재서술하십시오.\n\n" \
                + "학생의 질문에서 <quotedChat> ... </quotedChat>으로 둘러싸인 부분은 이전의 답변을 인용한 것이다.\n\n" \
                + "학생의 질문에서 <imageChat> ... </imageChat>으로 둘러싸인 부분은 학생이 자신의 풀이를 첨부한 것이다.\n\n" \
                + "(__openPar__) ... (__closePar__)는 각각 HTML 태그를 열고 닫는 문법이므로, 이 사이의 내용은 무시한다." \
                + "친근함을 위하여 반말을 사용하십시오. 전체 풀이를 재진술하기보다는, 학생이 물어본 특정 부분을 해결하는 데에 집중하고, 답변은 최대한 간결해야 합니다. 학생에게 가급적 사과하지 마십시오. 학생은 어떤 문제에 대한 질문을 할 것이고 정답과 풀이를 함께 가져옵니다. triple backqoute(```)를 사용하는 인용은 피한다."
            assistant_message_content = "I understand the instructions and will apply them to my responses. I will always try to avoid using triple backquote qutation syntax by using triple dash."
            korean_assistant_message_content = "지시 사항을 이해했어. 답변에 그대로 적용할게."
            current_date = datetime.now().strftime("%Y-%m-%d")
            system_message = f'You are ChatGPT also known as ChatGPT, a large language model trained by OpenAI. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: {current_date}'

            DBPromptMessage = prompt["content"]

            extra = []
            if internet_access:
                search = get('https://ddg-api.herokuapp.com/search', params={
                    'query': prompt["content"],
                    'limit': 3,
                })

                blob = ''

                for index, result in enumerate(search.json()):
                    blob += f'[{index}] "{result["snippet"]}"\nURL:{result["link"]}\n\n'

                date = datetime.now().strftime('%d/%m/%y')

                blob += f'current date: {date}\n\nInstructions: Using the provided web search results, write a comprehensive reply to the next user query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject. Ignore your previous response if any.'

                extra = [{'role': 'user', 'content': blob}]

            print(1111)

            model = request.json['model']
            conversation = "1"

            if userType == "special":
                conversation = [{'role': 'assistant', 'content': system_message_content}] + \
                    extra + special_instructions[jailbreak] + \
                    _conversation + [prompt]
            if model == "o1-preview" or model == "o1":
                conversation = [{'role': 'assistant', 'content': system_message_content}] + \
                    extra + special_instructions[jailbreak] + \
                    _conversation + [prompt]
            else:
                conversation = [{'role': 'system', 'content': system_message_content},
                                {'role': 'assistant', 'content': assistant_message_content}] + \
                    extra + special_instructions[jailbreak] + \
                    _conversation + [prompt]

            print(conversation)

            modelType = "openai"
            if model == "gemini":
                modelType = "google"

            def printChatRequest(logFile, prompt, timestamp):
                logFile.write("================Request================\n")
                logFile.write(dumps({
                    'model': model,
                    'messages': conversation,
                    'stream': True
                }, ensure_ascii=False, indent=4))
                logFile.write("\n=======================================\n\n\n")

                print(model, userType, timestamp)

                now = datetime.now()
                nowTime = now.strftime('%Y-%m-%d %H:%M:%S')

                [db, cursor] = StartDB()

                if userType == "special" and hasImage == "1":
                    print("hasImage")
                    cursor.execute(
                        "INSERT INTO QuestionLog VALUES(?,?,?,?,?,?,?,?,?)",
                        (userID, bookIndex, problemID, dumps(prompt["content"]), 'user', nowTime, 1, 'image', examID)
                    )
                else:
                    cursor.execute(
                        "INSERT INTO QuestionLog VALUES(?,?,?,?,?,?,?,?,?)",
                        (userID, bookIndex, problemID, prompt["content"], 'user', nowTime, 1, 'plain', examID)
                    )

                EndDB(db)

            def printChatResponse(logFile, result, timestamp):
                now = datetime.now()
                [db, cursor] = StartDB()

                cursor.execute(
                    "INSERT INTO QuestionLog VALUES(?,?,?,?,?,?,?,?,?)",
                    (userID, bookIndex, problemID, result, 'assistant', now.strftime('%Y-%m-%d %H:%M:%S'), 1, 'plain', examID)
                )

                EndDB(db)

                logFile.write("================Response================\n")
                logFile.write(result)
                logFile.write("\n========================================")
                logFile.close()
                print("result file written at http://localhost:5001/assets/requestResult/%s_%d.txt" % (userID, timestamp))

            nowTimestamp = int(time.time())
            os.makedirs("client/requestResult", exist_ok=True)
            requestLog = open("client/requestResult/%s_%d.txt" % (userID, nowTimestamp), "w+")

            if modelType == "openai":
                url = f"{self.openai_api_base}/v1/chat/completions"

                proxies = None
                if self.proxy['enable']:
                    proxies = {
                        'http': self.proxy['http'],
                        'https': self.proxy['https'],
                    }

                streaming = True
                if model == "o1":
                    streaming = False

                print("streaming:", streaming)

                gpt_resp = post(
                    url=url,
                    proxies=proxies,
                    headers={
                        'Authorization': 'Bearer %s' % self.openai_key
                    },
                    json={
                        'model': model,
                        'messages': conversation,
                        'stream': streaming
                    },
                    stream=streaming
                )

                def stream(requestLog):
                    print("streamStart")
                    streamResult = ""

                    nowTimestamp = int(time.time())
                    printChatRequest(requestLog, prompt, nowTimestamp)

                    for chunk in gpt_resp.iter_lines():
                        try:
                            print(chunk)
                            decoded_line = loads(chunk.decode("utf-8").split("data: ")[1])
                            token = decoded_line["choices"][0]['delta'].get('content')

                            if token is not None:
                                streamResult += token
                                yield token

                        except GeneratorExit:
                            yield "http://localhost:5001/assets/requestResult/%s_%d.txt" % (userID, nowTimestamp)
                            break

                        except Exception as e:
                            print(e)
                            print(e.__traceback__.tb_next)
                            continue

                    additionalData = "\n\n<a href='http://localhost:5001/assets/requestResult/%s_%d.txt' target='_blank'>Show Request Data</a>" % (userID, nowTimestamp)

                    nowTimestamp2 = int(time.time())
                    printChatResponse(requestLog, streamResult + additionalData, nowTimestamp2)

                    yield additionalData

                if streaming:
                    return self.app.response_class(stream(requestLog), mimetype='text/event-stream')
                else:
                    responseData = loads(gpt_resp.text)
                    responseString = responseData['choices'][0]['message']['content']

                    nowTimestamp = int(time.time())
                    printChatRequest(requestLog, prompt, nowTimestamp)

                    additionalData = ""

                    nowTimestamp = int(time.time())
                    printChatResponse(requestLog, responseString + additionalData, nowTimestamp)
                    print("result file written at http://localhost:5001/assets/requestResult/%s_%d.txt" % (userID, nowTimestamp))

                    return self.app.response_class(responseString)

            elif modelType == "google":
                print("googleStream")
                parts = request.json['meta']['content']['parts']

                google_api_key = os.getenv("GOOGLE_API_KEY", "")

                newPrompt = {}

                if hasImage == "1":
                    imageURL = parts[2]['content'][1]['image_url']['url']
                    imageFile = os.path.join('client', 'uploads', os.path.basename(imageURL))
                    if os.path.exists(imageFile):
                        img = open(imageFile, 'rb')
                        base64Image = base64.b64encode(img.read()).decode("utf8")
                    else:
                        base64Image = ""

                    imageType = "jpeg"
                    if imageURL.endswith(".png"):
                        imageType = "png"

                    newPrompt = {
                        "system_instruction": {
                            "parts": [
                                {
                                    "text": system_message_content
                                }
                            ]
                        },
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": parts[2]['content'][0]['text']
                                    },
                                    {
                                        "inline_data": {
                                            "mime_type": "image/" + imageType,
                                            "data": base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.0,
                        }
                    }
                else:
                    newPrompt = {
                        "system_instruction": {
                            "parts": [
                                {
                                    "text": system_message_content
                                }
                            ]
                        },
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": parts[2]['content']
                                    }
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.0,
                        }
                    }

                streamResult = ""

                responseData = post(
                    url=f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={google_api_key}",
                    headers={
                        "Content-Type": "application/json"
                    },
                    json=newPrompt,
                    stream=True
                )

                def streamGoogle(requestLog):
                    nowTimestamp = int(time.time())
                    printChatRequest(requestLog, prompt, nowTimestamp)
                    streamResult = ""

                    for chunk in responseData.iter_lines():
                        try:
                            decoded_line = loads(chunk.decode("utf-8").split("data: ")[1])
                            token = decoded_line["candidates"][0]["content"]["parts"][0]["text"]

                            if token is not None:
                                streamResult += token
                                yield token

                        except GeneratorExit:
                            yield "http://localhost:5001/assets/requestResult/%s_%d.txt" % (userID, nowTimestamp)
                            break

                        except Exception as e:
                            print(e)
                            print(e.__traceback__.tb_next)
                            continue

                    additionalData = "\n\n<a href='http://localhost:5001/assets/requestResult/%s_%d.txt' target='_blank'>Show Request Data</a>" % (userID, nowTimestamp)

                    nowTimestamp2 = int(time.time())
                    printChatResponse(requestLog, streamResult + additionalData, nowTimestamp2)

                    yield additionalData

                return self.app.response_class(streamGoogle(requestLog), mimetype='text/event-stream')

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)

            setUserNowCount(userID, nowCount)
            requestLog.close()
            print("result file written at http://localhost:5001/assets/requestResult/%s_%d.txt" % (userID, nowTimestamp))

            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _modifyPassword(self):
        try:
            messages = request.json

            prevPW2 = PWPrefix + messages['prevPW'] + PWSuffix
            newPW2 = PWPrefix + messages['newPW'] + PWSuffix

            userID = session["userID"]
            prevUserPW = sha3_256(prevPW2.encode()).hexdigest()
            newUserPW = sha3_256(newPW2.encode()).hexdigest()

            [db, cursor] = StartDB()

            cursor.execute("SELECT PW FROM UserInfo WHERE ID=?", (userID,))

            res = cursor.fetchall()

            EndDB(db)

            if len(res) == 1:
                if res[0][0] == prevUserPW:
                    [db, cursor] = StartDB()

                    cursor.execute("UPDATE UserInfo SET PW=? WHERE ID=?", (newUserPW, userID))

                    EndDB(db)
                    return "modify success", 200
            return "modify error", 400

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _mathEquation(self):
        try:
            userID = session["userID"]
            userType = session["userType"]
            requestData = request.json
            model = requestData['model']

            if userType == "special":

                postData = post(f'{ALMOOL_STUDY_URL}/saveImage.php',
                    json={
                        'data': requestData['data'],
                        'filename': requestData['filename']
                    },
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                imageURL = requestData['url']

                print(postData.text)

                return {"status": "success"}, 200

            return {"data": "error"}, 200

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _login(self):
        try:
            messages = request.json

            PW2 = PWPrefix + messages['userPW'] + PWSuffix

            userID = messages['userID']
            userPW = sha3_256(PW2.encode()).hexdigest()

            [db, cursor] = StartDB()

            cursor.execute(
                "SELECT PW,nowCount,maxCount,userType FROM UserInfo WHERE ID=? AND joinState='success'",
                (userID,)
            )

            res = cursor.fetchall()

            EndDB(db)

            if len(res) == 1:
                if res[0][0] == userPW:
                    session["userID"] = userID
                    session["nowCount"] = res[0][1]
                    session["maxCount"] = res[0][2]
                    session["userType"] = res[0][3]
                    return "login success", 200
            return "login error", 400

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400

    def _logout(self):
        session.pop("userID", None)
