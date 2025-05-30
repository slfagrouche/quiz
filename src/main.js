import React, { useState, useEffect } from 'react';
import './style.css';
import { motion, AnimatePresence } from "motion/react";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { BarLoader } from "react-spinners";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';

import { useWindowSize } from 'react-use'
import Confetti from 'react-confetti'
import ConfettiBoom from 'react-confetti-boom';

registerPlugin(FilePondPluginFileValidateType);

function App() {
  const { width, height } = useWindowSize()
  const RadioButton = ({ name, id, value, onChange, checked, text }) => (
    <label htmlFor={id} className="radio-label">
      <input
        className="radio-input"
        type="radio"
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        checked={checked}
        disabled={choicesDisabled}
      />
      <span className="custom-radio" />
      {text}
    </label>
  );

  const [loadingInference, setLoadingInference] = useState(false);
  const [file, setFile] = useState();
  const [textLoaded, doneLoadingText] = useState(false);
  const [cards, setCards] = useState();
  const [cardArray, setCardArray] = useState();
  const [currentCard, setCurrentCard] = useState(0);
  const [quiz, setQuiz] = useState();
  const [mode, setMode] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState();
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedValue, setSelectedValue] = useState(true);
  const [choicesDisabled, setChoicesDisabled] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState(null); // null, "correct", or "incorrect"
  const [showQuestion, setShowQuestion] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleRadioChange = (event) => {
    setSelectedValue(false);
  };

  useEffect(() => {
    if (cards === undefined) { return }
    const arr = cards.all.map(c => ({ concept: c.concept, definition: c.definition }));
    setCardArray(arr);
  }, [cards]);

  useEffect(() => {
    if (quiz === undefined) { return }
    const res = quiz.all.map(item => {
      let array = [item.correct_answer, ...item.incorrect_answers];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return [item, array];
    });
    setQuestions(res);

  }, [quiz]);

  useEffect(() => {
    if (questions === undefined || mode !== 1 || currentQuestion >= questions.length) {
      return;
    }
    setChoicesDisabled(false);
    setSelectedAnswer(null);
    setSelectedValue(true);
    const question = document.getElementById("question");
    if (question) {
      question.style.color = "white";
      question.innerText = `${questions[currentQuestion][0].question}`;
    }
    document.getElementById("submit").style.display = "block";
    document.getElementById("next").style.display = "none";
    const radios = document.getElementsByName("question");
    radios.forEach((r, i) => {
      r.disabled = false;
      document.getElementById(`label-${i}`).style.color = "rgb(200, 200, 200)";
    });

  }, [questions, currentQuestion, mode]);

  useEffect(() => {

    setSelectedAnswer(null);
    setChoicesDisabled(false);
    setShowCongrats(false);
    setShowButtons(false);

    if(mode === 2) {
      if(questions !== undefined && score === questions.length) {
        setTimeout(() => {setShowCongrats(true)}, 1000);
        setTimeout(() => {setShowButtons(true)}, 2000);
      }
      else {
        setShowButtons(true);
      }
    }
    
  }, [mode, questions, score]);

  function generateCards() {
    doneLoadingText(true);
    setLoadingInference(true);
    fetch('/generate_cards', { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if ("error" in data) { setLoadingInference(false); alert("An error occurred. Please try again."); window.location.reload(); }
        else { setCards(data); setLoadingInference(false); }
      });
  }

  function generateQuiz() {
    setLoadingInference(true);
    fetch('/generate_quiz', { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if ("error" in data) { setLoadingInference(false); alert("An error occurred. Please try again."); window.location.reload(); }
        else { setQuiz(data); setLoadingInference(false); }
      });
    setShowQuestion(true);
    setMode(1);
  }

  // Send questions to backend and create PDF document of quiz
  function exportQuiz() {

    fetch('/export', {
      method: "POST",
      body: JSON.stringify(questions),
      headers: { 'Content-type': 'application/json' }
    })
      .then(res => { return res.blob(); })
      .then(
        blob => { // Download exported file once received
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'export.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      )
  }

  function checkAnswer(q) {
    if (selectedAnswer === null) return;

    setChoicesDisabled(true);
    setSelectedAnswer(selectedAnswer); // freeze answer
    document.getElementById("submit").style.display = "none";

    const correctIndex = q[1].indexOf(q[0].correct_answer);

    if (selectedAnswer === correctIndex) {
      setScore(prev => prev + 1);
      setQuestionFeedback('correct');
    } else {
      setQuestionFeedback('incorrect');
      document.getElementById(`label-${selectedAnswer}`).style.color = "#ff7373";
    }
    document.getElementById(`label-${correctIndex}`).style.color = "#7fff7f";

    document.getElementById("next").style.display = "block";
  }

  return (
    <div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loadingInference && <motion.div

          initial={{ opacity: 0 }}
          animate={{ opacity: loadingInference ? 1 : 0 }}
          transition={{ duration: 1.0 }}
          exit={{ opacity: 0 }}>

          <div id="overlay">
            <BarLoader
              id="loading"
              color={"silver"}
              loading={loadingInference}
              width={300}
            />
            <div id='overlay-back' />
          </div>

        </motion.div>}
      </AnimatePresence>

      {/* Start page */}
      <AnimatePresence>
        {!textLoaded && <div id="start-page">
          <div id="title">{"Skip the textbook.".split("").map((el, i) => (<motion.span id="title-letter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: i / 10 }} key={i}>{el}</motion.span>))}</div>
          <motion.div id="input-anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="subtitle">Upload your text document, and get access to AI-generated study tools, including flashcards and quizzes.</p>
            <FilePond files={file} allowMultiple name="file" onupdatefiles={fileItems => setFile(fileItems)} server={{ url: '/upload' }} onprocessfiles={() => generateCards()} acceptedFileTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']} labelIdle='Drop your file or <span class="filepond--label-action"> Browse </span>' />
          </motion.div>
        </div>}
      </AnimatePresence>

      {/* Main content */}
      {cardArray !== undefined &&
        <div>
            <AnimatePresence>
            {mode === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} exit={{ opacity: 0 }}>
                <Swiper modules={[Navigation, Pagination, EffectCards]} effect='cards' allowTouchMove={false} navigation pagination={{ clickable: true }} touchRatio={0} onRealIndexChange={(swiper) => setCurrentCard(swiper.realIndex)}
                  style={{
                    "--swiper-theme-color": "rgb(200, 200, 200)",
                    "--swiper-pagination-bullet-inactive-color": "#888888",
                    "--swiper-pagination-bullet-inactive-opacity": "0.5",
                    "--swiper-pagination-bullet-size": "16px",
                    "--swiper-pagination-bullet-horizontal-gap": "6px",
                    "--swiper-pagination-bottom": "-50px",
                  }}>
                  {cardArray.map(card => (<SwiperSlide><div className="flip-card"><div className="flip-card-inner"><div className="flip-card-front"><div id='concept'>{card.concept}</div></div><div className="flip-card-back"><div id='definition'>{card.definition}</div></div></div></div></SwiperSlide>))}
                  <SwiperSlide>

                    <div className="card">
                      <div className="flip-card-inner">
                        <AnimatePresence>
                          <motion.div
                            className="flip-card-front"
                            id="take-quiz"
                            initial={{ backgroundColor: "#303048" }}
                            animate={currentCard === cardArray.length ? { backgroundColor: "#008000" } : { backgroundColor: "#303048" }}
                            transition={{
                              duration: 0.5,
                              ease: 'easeInOut',
                            }}
                          >
                            <div>
                              <motion.div
                                id='quiz-card-text'
                                initial={{ opacity: 0 }}
                                animate={currentCard === cardArray.length ? { opacity: 1 } : { opacity: 0 }}
                                transition={{
                                  duration: 0.75,
                                  ease: 'easeInOut',
                                }}
                                exit={{ opacity: 0 }}>
                                Ready for the quiz?
                                {questions !== undefined ?
                                  <div> <img id="make-quiz" onClick={(e) => { setMode(3); setShowQuestion(false); setTimeout(() => { setMode(1) }, 700); setShowQuestion(true); }} src="\pngegg.png" alt='Start button' /> <br /> </div>
                                  : <div> <img id="make-quiz" onClick={(e) => { setMode(3); setTimeout(() => { generateQuiz() }, 500)}} src="\pngegg.png" alt='Start button' /> <br /> </div>
                                }
                              </motion.div>
                            </div>

                          </motion.div>

                        </AnimatePresence>
                      </div>
                    </div>

                  </SwiperSlide>
                </Swiper>
              </motion.div>
            )}
            </AnimatePresence>
          {(mode === 1 && questions && currentQuestion < questions.length && (

            <AnimatePresence>
              { showQuestion && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} exit={{ opacity: 0 }}>

                <div className='question-container'>
                  <div className='question-number'>Question {currentQuestion + 1} of {questions.length}</div>
                  <div id="question" style={{
                    color: questionFeedback === 'correct' ? '#7fff7f' :
                      questionFeedback === 'incorrect' ? '#ff7373' : '#c8c8c8'
                  }}>
                    {questions[currentQuestion][0].question}
                  </div>
                </div>

                { questionFeedback === "correct" && <ConfettiBoom y={0.2} shapeSize={30} particleCount={60} spreadDeg={70}/> }

                <form id="choices">

                  <div className='answer option-1'>
                    <RadioButton name="question" id={`choice-${0}`} value={questions[currentQuestion][1][0]} onChange={(e) => { setSelectedAnswer(0); handleRadioChange(e) }} checked={selectedAnswer === 0} />
                    <div className='label'> <label id={`label-${0}`} htmlFor={`choice-${0}`}>{questions[currentQuestion][1][0]}</label> </div>
                  </div>

                  <div className='answer option-2'>
                    <RadioButton name="question" id={`choice-${1}`} value={questions[currentQuestion][1][1]} onChange={(e) => { setSelectedAnswer(1); handleRadioChange(e) }} checked={selectedAnswer === 1} />
                    <div className='label'> <label id={`label-${1}`} htmlFor={`choice-${1}`}>{questions[currentQuestion][1][1]}</label> </div>
                  </div>

                  <div className='answer option-3'>
                    <RadioButton name="question" id={`choice-${2}`} value={questions[currentQuestion][1][2]} onChange={(e) => { setSelectedAnswer(2); handleRadioChange(e) }} checked={selectedAnswer === 2} />
                    <div className='label'> <label id={`label-${2}`} htmlFor={`choice-${2}`}>{questions[currentQuestion][1][2]}</label> </div>
                  </div>

                  <div className='answer option-4'>
                    <RadioButton name="question" id={`choice-${3}`} value={questions[currentQuestion][1][3]} onChange={(e) => { setSelectedAnswer(3); handleRadioChange(e) }} checked={selectedAnswer === 3} />
                    <div className='label'><label id={`label-${3}`} htmlFor={`choice-${3}`}>{questions[currentQuestion][1][3]}</label> </div>
                  </div>

                </form>
                <button type="button" id="submit" disabled={selectedValue} onClick={() => checkAnswer(questions[currentQuestion])}>Check</button>
                <button id="next" style={{ display: "none" }} onClick={() => {
                  if (currentQuestion + 1 >= questions.length) {
                    setMode(2); // 🎯 Switch to results mode when quiz is complete
                  } else {
                    setShowQuestion(false);
                    setTimeout(() => {
                      setShowQuestion(true);
                      setCurrentQuestion(currentQuestion + 1);
                    }, 500);
                  }
                  setQuestionFeedback(null);
                }}>Next</button>
              </motion.div> )}
            </AnimatePresence>

          ))}
          {(mode === 2 &&

            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} exit={{ opacity: 0 }}>

                {questions && (
                  <div className='end' style={{ marginTop: score === questions.length ? "25px" : "50px" }}>
                    Your score:
                    <div className='end-score'> {score} / {questions.length} </div>
                    { showCongrats && (
                      <div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                        <div className='congrats'>Nice work!</div>
                      </motion.div>
                      <Confetti run={score === questions.length} width={width} height={height} />
                      </div>
                    )}
                  </div>
                )}

                { showButtons && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className='end-buttons' style={{ marginTop: score === questions.length ? "10px" : "50px" }}>
                  
                  <button type="button" onClick={() => { exportQuiz(); }}>Export quiz</button>

                  <button type="button" onClick={() => {
                    setCurrentQuestion(0); setScore(0);
                    setSelectedAnswer(null); setQuestionFeedback(null); setChoicesDisabled(false);
                    setMode(1); // Stay in quiz mode
                  }}>Retry</button>

                  <button type="button" onClick={() => {             
                    setCurrentQuestion(0); setScore(0);
                    setChoicesDisabled(false); setSelectedAnswer(null);
                    setQuestions(); generateQuiz(); 
                  }}>Generate a new quiz</button>

                  <button type="button" onClick={() => {
                    setCurrentQuestion(0); setScore(0);
                    setChoicesDisabled(false); setSelectedAnswer(null);
                    setMode(0);
                  }}>Back to flashcards</button>

                </motion.div> }

              </motion.div>
            </AnimatePresence>

          )}

        </div>
      }
    </div>
  );
}

export default App;