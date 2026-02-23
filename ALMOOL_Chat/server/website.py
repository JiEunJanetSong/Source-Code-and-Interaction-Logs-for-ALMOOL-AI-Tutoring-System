import os
import sqlite3
from flask import render_template, send_file, redirect, request, url_for, session
from time import time
from os import urandom
from json import load, loads


def StartDB():
    db = sqlite3.connect(os.path.join(os.path.dirname(__file__), '..', 'data', 'almool_chat.db'))
    cursor = db.cursor()
    return [db, cursor]


def EndDB(db):
    db.commit()
    db.close()


class Website:
    def __init__(self, app) -> None:
        self.app = app
        self.routes = {
            '/newUser/': {
                'function': self._newUser,
                'methods': ['GET', 'POST']
            },
            '/login/': {
                'function': self._login2,
                'methods': ['GET', 'POST']
            },
            '/SAT/': {
                'function': self._SAT,
                'methods': ['GET', 'POST']
            },
            '/SAT/<conversation_id>': {
                'function': self._SATWidhID,
                'methods': ['GET', 'POST']
            },
            '/UCC/': {
                'function': self._UCC,
                'methods': ['GET', 'POST']
            },
            '/UCC/<conversation_id>': {
                'function': self._UCCWidhID,
                'methods': ['GET', 'POST']
            },
            '/Calculus/': {
                'function': self._SAT,
                'methods': ['GET', 'POST']
            },
            '/Calculus/<conversation_id>': {
                'function': self._SATWidhID,
                'methods': ['GET', 'POST']
            },
            '/assets/<folder>/<file>': {
                'function': self._assets,
                'methods': ['GET', 'POST']
            },
            '/bookInfo/<bookIndex>': {
                'function': self._bookInfo,
                'methods': ['GET', 'POST']
            }
        }

    def _newUser(self):
        return render_template('newUser.html')

    def _login2(self):
        if "userID" in session:
            return redirect('/SAT')
        return render_template('login.html')

    def _SAT(self):
        convID = ""
        nowCount = 0
        maxCount = 0
        userType = 'none'

        if "convID" in session:
            convID = session["convID"]
            print("pop %s from session" % convID)
            session.pop("convID", None)

        if "userID" in session:
            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute("SELECT nowCount,maxCount,userType FROM UserInfo WHERE ID=?", (userID,))

            res = cursor.fetchall()
            EndDB(db)

            if len(res) == 1:
                nowCount = res[0][0]
                maxCount = res[0][1]
                userType = res[0][2]

        return render_template('indexSAT.html', chat_id=convID, now_count=nowCount, max_count=maxCount, user_type=userType, show_score_answer="true", chat_type="SAT")

    def _SATWidhID(self, conversation_id):
        print("insert %s to session" % conversation_id)
        session["convID"] = conversation_id
        return redirect('/SAT')

    def _UCC(self):
        convID = ""
        nowCount = 0
        maxCount = 0
        userType = 'none'

        if "convID" in session:
            convID = session["convID"]
            print("pop %s from session" % convID)
            session.pop("convID", None)

        if "userID" in session:
            userID = session["userID"]
            [db, cursor] = StartDB()

            cursor.execute("SELECT nowCount,maxCount,userType FROM UserInfo WHERE ID=?", (userID,))

            res = cursor.fetchall()
            EndDB(db)

            if len(res) == 1:
                nowCount = res[0][0]
                maxCount = res[0][1]
                userType = res[0][2]

        return render_template('indexSAT.html', chat_id=convID, now_count=nowCount, max_count=maxCount, user_type=userType, show_score_answer="true", chat_type="UCC")

    def _UCCWidhID(self, conversation_id):
        print("insert %s to session" % conversation_id)
        session["convID"] = conversation_id
        return redirect('/UCC')

    def _assets(self, folder: str, file: str):
        try:
            return send_file(f"./../client/{folder}/{file}", as_attachment=False)
        except:
            return "File not found", 404

    def _bookInfo(self, bookIndex: str):
        try:
            bookInfoFile = open("client/json/bookInfo.json")
            bookInfo = load(bookInfoFile)
            bookFolder = bookInfo[bookIndex]["folder"]
            return bookFolder
        except:
            return "File not found", 404
