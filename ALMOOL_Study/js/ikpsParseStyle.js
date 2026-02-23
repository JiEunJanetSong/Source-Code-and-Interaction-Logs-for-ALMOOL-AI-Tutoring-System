"use strict";
//changeTo: 특정 environment 선언문이 어떻게 변하는지를 기술. 0번 인덱스:begin, 1번 인덱스:end
let envParameterNumList = {
    "align*": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["preserve", "preserve"]
    },
    "alignat*": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["preserve", "preserve"]
    },
    "center": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["<div class='texEnv_center' width='50%'>", "</div>"]
    },
    /*
    "justbox":{
      parameterNum:1,
      optionalParameterType:0,
      changeTo:["<table style='border:1px solid black; width=50%;'>","</table>"]
    },*/
    "enumerate": {
        parameterNum: 1,
        optionalParameterType: 2,
        changeTo: ["\n\n!@@EnumStart@!@#2@@!\n\n", "\n\n!@@EnumEnd@@!\n\n"]
    },
    "selection": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@SelectionStart@!@#2@@!\n\n", "\n\n!@@SelectionEnd@@!\n\n"]
    },
    "condition": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@ConditionStart@!@#2@@!\n\n", "\n\n!@@ConditionEnd@@!\n\n"]
    },
    "justbox": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@JustboxStart@@!\n\n", "\n\n!@@JustboxEnd@@!\n\n"]
    },
    "itemize": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@ItemizeStart@@!\n\n", "\n\n!@@ItemizeEnd@@!\n\n"]
    },
    "flushright": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@CenterStart@@!\n\n", "\n\n!@@CenterEnd@@!\n\n"]
    },
    "subsol": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@SubsolStart@!@#2@@!\n\n", "\n\n!@@SubsolEnd@@!\n\n"]
    },
    "subsubsol": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@SubsubsolStart@!@#2@@!\n\n", "\n\n!@@SubsolEnd@@!\n\n"]
    },
    "tabu": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@TableStart@@!#2@@!\n\n", "\n\n!@@TableEnd@@!\n\n"]
    },
    "tabular": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@TableStart@@!#2@@!\n\n", "\n\n!@@TableEnd@@!\n\n"]
    },
    "tblr": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@TableStart@@!#2@@!\n\n", "\n\n!@@TableEnd@@!\n\n"]
    },
    "remark": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeTo: ["#2", ""]
    },
    "quotation": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["<blockquote>", "</blockquote>"]
    },
    "SATleftpar": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["\n\n!@@SATLeftParStart@@!\n\n", "\n\n!@@SATLeftParEnd@@!\n\n"]
    },
    "default": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeTo: ["preserve", "preserve"]
    }
};
//changeInEnv: 특정 environment에서 명령어가 어떻게 변하는지를 기술
let searchList = {
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
    "\\item": {
        parameterNum: 0,
        optionalParameterType: 1,
        changeInEnv: { default: "- ", enumerate: "\n\n!@@ENUMITEM@@!", selection: "\n\n!@@SELECTIONITEM@@!", condition: "\n\n!@@CONDITIONITEM@@!", itemize: "\n\n!@@ITEMIZEITEM@@!" },
        isURLParameter: [false]
    },
    "\\npb": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: " " },
        isURLParameter: [false]
    },
    "\\vskip": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: " " },
        isURLParameter: [false]
    },
    "\\vspace": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: " " },
        isURLParameter: [false]
    },
    "\\noindent": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: " " },
        isURLParameter: []
    },
    "\\includegraphics": {
        parameterNum: 1,
        optionalParameterType: 1,
        changeInEnv: { default: "<img src='#2' style='zoom:!!#scale#!!' alt=''>" },
        isURLParameter: [false, true]
    },
    "\\ovr": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "\\overline{\\mathrm{#1}}" },
        isURLParameter: [false]
    },
    "\\ovl": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "\\overline{#1}" },
        isURLParameter: [false]
    },
    "\\bcd": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: "\\cdot" },
        isURLParameter: []
    },
    "\\NCR": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "{}_{#1}\\mathrm{C}_{#2}" },
        isURLParameter: [false]
    },
    "\\NHR": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "{}_{#1}\\mathrm{H}_{#2}" },
        isURLParameter: [false]
    },
    "\\coi": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "\\left[ #1 ,\: #2 \\right)" },
        isURLParameter: [false,false]
    },
    "\\oci": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "\\left( #1 ,\: #2 \\right]" },
        isURLParameter: [false,false]
    },
    "\\vxy": {
        parameterNum: 2,
        optionalParameterType: 0,
        changeInEnv: { default: "\\begin{bmatrix}#1 \\\\ #2 \\end{bmatrix}" },
        isURLParameter: [false,false]
    },
    "\\mrm": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "\\mathrm{#1}" },
        isURLParameter: [false]
    },
    "\\avr": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "|\\overrightarrow{\\mathrm{#1}}|" },
        isURLParameter: [false]
    },
    "\\vrm": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "\\overrightarrow{\\mathrm{#1}}" },
        isURLParameter: [false]
    },
    "\\arc": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "\\overset{\\mmlToken{mo}{⏜}}{#1}" },
        isURLParameter: [false]
    },
    "\\xy": {
        parameterNum: 2,
        optionalParameterType: 1,
        changeInEnv: { default: "\\mathrm{#1}\\left( #2,#3\\right)" },
        isURLParameter: [false, false, false]
    },
    "\\xyz": {
        parameterNum: 3,
        optionalParameterType: 1,
        changeInEnv: { default: "\\mathrm{#1}\\left( #2,#3,#4\\right)" },
        isURLParameter: [false, false, false, false]
    },
    "\\anstwo": {
        parameterNum: 5,
        optionalParameterType: 0,
        changeInEnv: { default: `<center><table style="width:75%;">
    <colgroup>
    <col style="width: 5%;">
    <col style="width: 14%;">
    <col style="width: 5%;">
    <col style="width: 14%;">
    <col style="width: 5%;">
    <col style="width: 14%;">
    <col style="width: 5%;">
    <col style="width: 14%;">
    <col style="width: 5%;">
    <col style="width: 14%;">
    </colgroup>
    <tr> <td>①</td><td>$#1$</td> <td>②</td><td>$#2$</td> <td>③</td><td>$#3$</td> <td>④</td><td>$#4$</td> <td>⑤</td><td>$#5$</td> </tr> </table></center>` },
        isURLParameter: [false, false, false, false, false]
    },
    "\\ansFOURs": {
        parameterNum: 4,
        optionalParameterType: 0,
        changeInEnv: { default: `<div id="problemAnswerForm">
                <div class="problemAnswerObj init" id="ABorder" onclick="selectObjKind('A')">
                    <div class="problemAnswerObjKind" id="AKind">A</div>
                    <div class="problemAnswerObjContents" id="AContents">$#1$</div>
                </div>
                <div class="problemAnswerObj init" id="BBorder" onclick="selectObjKind('B')">
                    <div class="problemAnswerObjKind" id="BKind">B</div>
                    <div class="problemAnswerObjContents" id="BContents">$#2$</div>
                </div>
                <div class="problemAnswerObj init" id="CBorder" onclick="selectObjKind('C')">
                    <div class="problemAnswerObjKind" id="CKind">C</div>
                    <div class="problemAnswerObjContents" id="CContents">$#3$</div>
                </div>
                <div class="problemAnswerObj init" id="DBorder" onclick="selectObjKind('D')">
                    <div class="problemAnswerObjKind" id="DKind">D</div>
                    <div class="problemAnswerObjContents" id="DContents">$#4$</div>
                </div>
            </div>` },
        isURLParameter: [false, false, false, false]
    },
    "\\ansFOURsT": {
        parameterNum: 4,
        optionalParameterType: 0,
        changeInEnv: { default: `<div id="problemAnswerForm">
                <div class="problemAnswerObj init" id="ABorder" onclick="selectObjKind('A')">
                    <div class="problemAnswerObjKind" id="AKind">A</div>
                    <div class="problemAnswerObjContents" id="AContents">#1</div>
                </div>
                <div class="problemAnswerObj init" id="BBorder" onclick="selectObjKind('B')">
                    <div class="problemAnswerObjKind" id="BKind">B</div>
                    <div class="problemAnswerObjContents" id="BContents">#2</div>
                </div>
                <div class="problemAnswerObj init" id="CBorder" onclick="selectObjKind('C')">
                    <div class="problemAnswerObjKind" id="CKind">C</div>
                    <div class="problemAnswerObjContents" id="CContents">#3</div>
                </div>
                <div class="problemAnswerObj init" id="DBorder" onclick="selectObjKind('D')">
                    <div class="problemAnswerObjKind" id="DKind">D</div>
                    <div class="problemAnswerObjContents" id="DContents">#4</div>
                </div>
            </div>` },
        isURLParameter: [false, false, false, false]
    },
    "\\ansFIVEs": {
        parameterNum: 5,
        optionalParameterType: 0,
        changeInEnv: { default: `<div id="problemAnswerForm">
                <div class="problemAnswerObj init" id="ABorder" onclick="selectObjKind('A')">
                    <div class="problemAnswerObjKind" id="AKind">A</div>
                    <div class="problemAnswerObjContents" id="AContents">$#1$</div>
                </div>
                <div class="problemAnswerObj init" id="BBorder" onclick="selectObjKind('B')">
                    <div class="problemAnswerObjKind" id="BKind">B</div>
                    <div class="problemAnswerObjContents" id="BContents">$#2$</div>
                </div>
                <div class="problemAnswerObj init" id="CBorder" onclick="selectObjKind('C')">
                    <div class="problemAnswerObjKind" id="CKind">C</div>
                    <div class="problemAnswerObjContents" id="CContents">$#3$</div>
                </div>
                <div class="problemAnswerObj init" id="DBorder" onclick="selectObjKind('D')">
                    <div class="problemAnswerObjKind" id="DKind">D</div>
                    <div class="problemAnswerObjContents" id="DContents">$#4$</div>
                </div>
                <div class="problemAnswerObj init" id="EBorder" onclick="selectObjKind('E')">
                    <div class="problemAnswerObjKind" id="EKind">E</div>
                    <div class="problemAnswerObjContents" id="EContents">$#5$</div>
                </div>
            </div>` },
        isURLParameter: [false, false, false, false, false]
    },
    "\\ansFIVEt": {
        parameterNum: 5,
        optionalParameterType: 0,
        changeInEnv: { default: `<div id="problemAnswerForm">
                <div class="problemAnswerObj init" id="ABorder" onclick="selectObjKind('A')">
                    <div class="problemAnswerObjKind" id="AKind">A</div>
                    <div class="problemAnswerObjContents" id="AContents">#1</div>
                </div>
                <div class="problemAnswerObj init" id="BBorder" onclick="selectObjKind('B')">
                    <div class="problemAnswerObjKind" id="BKind">B</div>
                    <div class="problemAnswerObjContents" id="BContents">#2</div>
                </div>
                <div class="problemAnswerObj init" id="CBorder" onclick="selectObjKind('C')">
                    <div class="problemAnswerObjKind" id="CKind">C</div>
                    <div class="problemAnswerObjContents" id="CContents">#3</div>
                </div>
                <div class="problemAnswerObj init" id="DBorder" onclick="selectObjKind('D')">
                    <div class="problemAnswerObjKind" id="DKind">D</div>
                    <div class="problemAnswerObjContents" id="DContents">#4</div>
                </div>
                <div class="problemAnswerObj init" id="EBorder" onclick="selectObjKind('E')">
                    <div class="problemAnswerObjKind" id="EKind">E</div>
                    <div class="problemAnswerObjContents" id="EContents">#5</div>
                </div>
            </div>` },
        isURLParameter: [false, false, false, false, false]
    },
    "\\ansFIVEsT": {
        parameterNum: 5,
        optionalParameterType: 0,
        changeInEnv: { default: `<div id="problemAnswerForm">
                <div class="problemAnswerObj init" id="ABorder" onclick="selectObjKind('A')">
                    <div class="problemAnswerObjKind" id="AKind">A</div>
                    <div class="problemAnswerObjContents" id="AContents">#1</div>
                </div>
                <div class="problemAnswerObj init" id="BBorder" onclick="selectObjKind('B')">
                    <div class="problemAnswerObjKind" id="BKind">B</div>
                    <div class="problemAnswerObjContents" id="BContents">#2</div>
                </div>
                <div class="problemAnswerObj init" id="CBorder" onclick="selectObjKind('C')">
                    <div class="problemAnswerObjKind" id="CKind">C</div>
                    <div class="problemAnswerObjContents" id="CContents">#3</div>
                </div>
                <div class="problemAnswerObj init" id="DBorder" onclick="selectObjKind('D')">
                    <div class="problemAnswerObjKind" id="DKind">D</div>
                    <div class="problemAnswerObjContents" id="DContents">#4</div>
                </div>
                <div class="problemAnswerObj init" id="EBorder" onclick="selectObjKind('E')">
                    <div class="problemAnswerObjKind" id="EKind">E</div>
                    <div class="problemAnswerObjContents" id="EContents">#5</div>
                </div>
            </div>` },
        isURLParameter: [false, false, false, false, false]
    },
    "\\hline": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: " ", tabu: "\n\n!@@TableNewRow@@!\n\n", tabular: "\n\n!@@TableNewRow@@!\n\n", tblr: "\n\n!@@TableNewRow@@!\n\n" },
        isURLParameter: []
    },
    "\\cline": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: " ", tabu: "\n\n!@@TableNewRow@@!\n\n", tabular: "\n\n!@@TableNewRow@@!\n\n", tblr: "\n\n!@@TableNewRow@@!\n\n" },
        isURLParameter: [false]
    },
    "\\multicolumn": {
        parameterNum: 3,
        optionalParameterType: 1,
        changeInEnv: { default: "!@@MultiColumn@!@#2@!@#4@@!" },
        isURLParameter: [false, false, false, false]
    },
    "\\multirow": {
        parameterNum: 3,
        optionalParameterType: 1,
        changeInEnv: { default: "!@@MultiRow@!@#2@!@#4@@!" },
        isURLParameter: [false, false, false, false]
    },
    "\\\\": {
        parameterNum: 0,
        optionalParameterType: 1,
        changeInEnv: { default: "!@@NewLine@@!", tabu: "", tabular: "", tblr: "" },
        isURLParameter: []
    },
    "\\textbf": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "<b>#1</b>" },
        isURLParameter: []
    },
    "\\textit": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "<i>#1</i>" },
        isURLParameter: []
    },
    "\\underline": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "!@@UnderlineStart@@!#1!@@UnderlineEnd@@!" },
        isURLParameter: []
    },
    "\\uline": {
        parameterNum: 1,
        optionalParameterType: 0,
        changeInEnv: { default: "!@@UnderlineStart@@!#1!@@UnderlineEnd@@!" },
        isURLParameter: []
    },
    "\\qquad": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: "&ensp;&ensp;" },
        isURLParameter: []
    },
    "\\quad": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: "&ensp;" },
        isURLParameter: []
    },
    "\\pagebreak": {
        parameterNum: 0,
        optionalParameterType: 0,
        changeInEnv: { default: "\n\n!@@PageBreak@@!\n\n" },
        isURLParameter: []
    },
};
//{함수이름 : [변수개수,옵션변수타입,{default:"","env1":"aa","env2":"bb",...}]}
let plainTextConvert = [
    [/!@@UnderlineStart@@!/g, "<u>"],
    [/!@@UnderlineEnd@@!/g, "</u>"],
    [/!@@NewLine@@!/g, "<br/>"],
    [/\[\]/g, ""],
];
let mathTextConvert = [
    [/!@@UnderlineStart@@!/g, "\\underline{"],
    [/!@@UnderlineEnd@@!/g, "}"],
    [/!@@NewLine@@!/g, "\\\\"],
    [/&lt;/g, '\\lt '],
    [/&gt;/g, '\\gt '],
];
let enumerateChangeValueWithLabel = {
    "\\onum": ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"],
    "\\pnum": ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "(8)", "(9)"],
    "\\alph": ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
    "\\gana": ["가", "나", "다", "라", "마", "바", "사", "아", "자"],
    //"\\gana*":["가","나","다","라","마","바","사","아","자"],
    "\\jaso": ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"],
    "\\arabic": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    "\\roman": ["i", "ii", "ii", "iv", "v", "vi", "vii", "viii", "ix"]
};
let enumerateChangeValue = {
    "\\circnum1": ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"],
    "a": ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
    "가": ["가", "나", "다", "라", "마", "바", "사", "아", "자"],
    "ㄱ": ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"],
    "1": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    "i": ["i", "ii", "ii", "iv", "v", "vi", "vii", "viii", "ix"]
};
let prevEnumerate = `<div>`;
let nextEnumerate = `</div>`;
let prevItemize = `<div>`;
let nextItemize = `</div>`;
let prevSelection = `<div>`;
let nextSelection = `</div>`;
let prevCondition = `<div class="enumParagraph">`;
let nextCondition = `</div>`;
let prevJustbox = `<div class="enumParagraph">`;
let nextJustbox = `</div>`;
let environmentTag = {
    enumerate: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
      </div><div class="texEnum_Contents">`, next: `</div></div>` },
    itemize: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` },
    selection: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` },
    condition: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` },
    justbox: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` },
    subsol: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` },
    subsubsol: { prev: `<div class="texEnum_paragraph"><div class="texEnum_enumItem">
  </div><div class="texEnum_Contents">`, next: `</div></div>` }
};
