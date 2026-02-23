
function askToTutor(examID,bookIndex,problemID,domain="SAT")
{
    //saveLog({position:`Exam:${nowExamIndex}, ProblemNumber:${nowProblemIndex}`,action:`Ask To Tutor`});
    
    let form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', `http://localhost:5001/${domain}/?examID=${examID}&bookIndex=${bookIndex}&problemID=${problemID}`);
    form.setAttribute('target', '_blank');

    document.body.appendChild(form);
    form.submit();
}