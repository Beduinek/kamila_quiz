const SEGMENT_SIZE = 50;
const BREAK_TIME = 120;
const STORAGE_KEY = "kamilaQuizState";

let quizWords = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let wrongWords = [];
let answered = false;

let selectedMode = "mixed";
let repeatMode = false;
let currentCorrectAnswers = [];
let segmentStartScore = 0;
let activeBreakTimer = null;


// --------------------
// POMOCNICZE
// --------------------

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function getCorrectAnswers(word, direction) {
  if (direction === "en-pl") {
    return [word.pl];
  }

  return words
    .filter(item =>
      normalize(item.pl) === normalize(word.pl)
    )
    .map(item => item.en);
}

function getDirection() {
  if (selectedMode === "en-pl") {
    return "en-pl";
  }

  if (selectedMode === "pl-en") {
    return "pl-en";
  }

  return Math.random() < 0.5
    ? "en-pl"
    : "pl-en";
}


// --------------------
// ZAPIS SESJI
// --------------------

function saveSession() {
  if (quizWords.length === 0) {
    return;
  }

  const state = {
    quizWords,
    currentIndex,
    score,
    streak,
    wrongWords,
    selectedMode,
    repeatMode,
    segmentStartScore,
    savedAt: Date.now()
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function loadSavedSession() {
  const raw =
    localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const state = JSON.parse(raw);

    if (
      !state ||
      !Array.isArray(state.quizWords) ||
      state.quizWords.length === 0
    ) {
      return null;
    }

    return state;
  } catch (error) {
    console.error(
      "Nie udało się odczytać zapisu:",
      error
    );

    return null;
  }
}

function clearSavedSession() {
  localStorage.removeItem(STORAGE_KEY);
}


// --------------------
// START
// --------------------

function startQuiz(mode) {
  clearSavedSession();

  selectedMode = mode;
  repeatMode = false;

  quizWords = shuffle(words);

  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];
  answered = false;
  segmentStartScore = 0;

  hideAllScreens();

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  saveSession();
  showQuestion();
}

function resumeQuiz() {
  const state = loadSavedSession();

  if (!state) {
    showStartScreen();
    return;
  }

  quizWords = state.quizWords;
  currentIndex = state.currentIndex || 0;
  score = state.score || 0;
  streak = state.streak || 0;
  wrongWords = state.wrongWords || [];
  selectedMode =
    state.selectedMode || "mixed";

  repeatMode =
    state.repeatMode || false;

  segmentStartScore =
    state.segmentStartScore || 0;

  answered = false;

  hideAllScreens();

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  showQuestion();
}

function discardSavedSession() {
  clearSavedSession();
  showStartScreen();
}


// --------------------
// PYTANIE
// --------------------

function showQuestion() {
  if (currentIndex >= quizWords.length) {
    showFinalScreen();
    return;
  }

  answered = false;

  const word =
    quizWords[currentIndex];

  const direction =
    getDirection();

  const question =
    direction === "en-pl"
      ? word.en
      : word.pl;

  currentCorrectAnswers =
    getCorrectAnswers(
      word,
      direction
    );

  document.getElementById(
    "question"
  ).textContent = question;

  const answersContainer =
    document.getElementById(
      "answers"
    );

  answersContainer.innerHTML = "";

  const answerPool = words
    .filter(item => item !== word)
    .map(item =>
      direction === "en-pl"
        ? item.pl
        : item.en
    )
    .filter(answer =>
      !currentCorrectAnswers.includes(
        answer
      )
    );

  const wrongOptions =
    shuffle(
      [...new Set(answerPool)]
    ).slice(0, 3);

  const correctOption =
    currentCorrectAnswers[
      Math.floor(
        Math.random() *
        currentCorrectAnswers.length
      )
    ];

  const options =
    shuffle([
      correctOption,
      ...wrongOptions
    ]);

  options.forEach(option => {
    const button =
      document.createElement(
        "button"
      );

    button.className =
      "answer-btn";

    button.textContent =
      option;

    button.addEventListener(
      "click",
      () => {
        checkAnswer(
          button,
          option,
          word
        );
      }
    );

    answersContainer.appendChild(
      button
    );
  });

  updateProgress();
}

function checkAnswer(
  button,
  selectedAnswer,
  word
) {
  if (answered) {
    return;
  }

  answered = true;

  const buttons =
    document.querySelectorAll(
      ".answer-btn"
    );

  buttons.forEach(btn => {
    btn.disabled = true;

    if (
      currentCorrectAnswers.includes(
        btn.textContent
      )
    ) {
      btn.classList.add(
        "correct"
      );
    }
  });

  if (
    currentCorrectAnswers.includes(
      selectedAnswer
    )
  ) {
    score++;
    streak++;
  } else {
    button.classList.add(
      "wrong"
    );

    streak = 0;

    const alreadySaved =
      wrongWords.some(item =>
        item.en === word.en &&
        item.pl === word.pl
      );

    if (!alreadySaved) {
      wrongWords.push(word);
    }
  }

  updateProgress();

  setTimeout(() => {
    currentIndex++;

    saveSession();

    if (
      !repeatMode &&
      currentIndex <
        quizWords.length &&
      currentIndex %
        SEGMENT_SIZE === 0
    ) {
      showBreak();
    } else {
      showQuestion();
    }

  }, 900);
}


// --------------------
// PROGRESS
// --------------------

function updateProgress() {
  const total =
    quizWords.length;

  const completed =
    Math.min(
      currentIndex +
      (answered ? 1 : 0),
      total
    );

  document.getElementById(
    "overall-progress-text"
  ).textContent =
    `${completed} / ${total}`;

  document.getElementById(
    "overall-progress"
  ).style.width =
    `${
      total
        ? (completed / total) *
          100
        : 0
    }%`;

  document.getElementById(
    "streak"
  ).textContent =
    `🔥 ${streak}`;

  if (repeatMode) {
    document.getElementById(
      "segment-text"
    ).textContent =
      "Powtórka błędnych";

    document.getElementById(
      "segment-progress-text"
    ).textContent =
      `${completed} / ${total}`;

    document.getElementById(
      "segment-progress"
    ).style.width =
      `${
        total
          ? (completed / total) *
            100
          : 0
      }%`;

    return;
  }

  const segmentNumber =
    Math.floor(
      currentIndex /
      SEGMENT_SIZE
    ) + 1;

  const segmentStart =
    Math.floor(
      currentIndex /
      SEGMENT_SIZE
    ) *
    SEGMENT_SIZE;

  const segmentLength =
    Math.min(
      SEGMENT_SIZE,
      total - segmentStart
    );

  const segmentCompleted =
    Math.min(
      currentIndex -
      segmentStart +
      (answered ? 1 : 0),
      segmentLength
    );

  document.getElementById(
    "segment-text"
  ).textContent =
    `Segment ${segmentNumber}`;

  document.getElementById(
    "segment-progress-text"
  ).textContent =
    `${segmentCompleted} / ${segmentLength}`;

  document.getElementById(
    "segment-progress"
  ).style.width =
    `${
      segmentLength
        ? (
            segmentCompleted /
            segmentLength
          ) * 100
        : 0
    }%`;
}


// --------------------
// PRZERWA
// --------------------

function showBreak() {
  hideAllScreens();

  document
    .getElementById(
      "break-screen"
    )
    .classList.remove(
      "hidden"
    );

  const segment =
    currentIndex /
    SEGMENT_SIZE;

  const messages = [
    "Super Ci idzie ❤️ Odpocznij chwilę, napij się czegoś i lecimy dalej.",
    "Połowa za Tobą 😎 Zrób sobie 2 minuty przerwy, serio zasłużyłaś.",
    "Ostatnia prosta ❤️ Odpocznij chwilę. Jeszcze tylko 50 i masz to."
  ];

  document.getElementById(
    "break-message"
  ).textContent =
    messages[segment - 1] ||
    "Odpocznij chwilę ❤️";

  const segmentScore =
    score -
    segmentStartScore;

  document.getElementById(
    "segment-score"
  ).textContent =
    `Wynik segmentu: ${segmentScore} / 50`;

  segmentStartScore =
    score;

  saveSession();

  let seconds =
    BREAK_TIME;

  const timerElement =
    document.getElementById(
      "break-timer"
    );

  timerElement.textContent =
    formatTime(seconds);

  if (activeBreakTimer) {
    clearInterval(
      activeBreakTimer
    );
  }

  activeBreakTimer =
    setInterval(() => {
      seconds--;

      timerElement.textContent =
        formatTime(seconds);

      if (seconds <= 0) {
        clearInterval(
          activeBreakTimer
        );

        activeBreakTimer =
          null;

        continueQuiz();
      }
    }, 1000);

  document.getElementById(
    "continue-btn"
  ).onclick = () => {
    if (activeBreakTimer) {
      clearInterval(
        activeBreakTimer
      );

      activeBreakTimer =
        null;
    }

    continueQuiz();
  };
}

function continueQuiz() {
  hideAllScreens();

  document
    .getElementById(
      "quiz-screen"
    )
    .classList.remove(
      "hidden"
    );

  saveSession();
  showQuestion();
}

function formatTime(seconds) {
  const minutes =
    Math.floor(
      seconds / 60
    );

  const remaining =
    seconds % 60;

  return (
    String(minutes).padStart(
      2,
      "0"
    ) +
    ":" +
    String(remaining).padStart(
      2,
      "0"
    )
  );
}


// --------------------
// KONIEC
// --------------------

function showFinalScreen() {
  clearSavedSession();

  hideAllScreens();

  document
    .getElementById(
      "final-screen"
    )
    .classList.remove(
      "hidden"
    );

  document.getElementById(
    "final-score"
  ).textContent =
    `${score} / ${quizWords.length}`;

  const percent =
    quizWords.length
      ? score /
        quizWords.length
      : 0;

  let message;

  if (percent >= 0.9) {
    message =
      "No i pięknie księżniczko! Kocham Cię😏❤️";
  } else if (
    percent >= 0.75
  ) {
    message =
      "Bardzo dobrze, idziesz jak burza! Kocham Cię ❤️";
  } else {
    message =
      "Spokojnie, powtórzymy błędne i będzie super. Kocham Cię ❤️ ";
  }

  document.getElementById(
    "final-message"
  ).textContent =
    message;

  const wrongSummary =
    document.getElementById(
      "wrong-summary"
    );

  if (
    wrongWords.length > 0
  ) {
    wrongSummary.classList.remove(
      "hidden"
    );

    document.getElementById(
      "wrong-count"
    ).textContent =
      `Do powtórki: ${wrongWords.length}`;
  } else {
    wrongSummary.classList.add(
      "hidden"
    );
  }
}


// --------------------
// POWTÓRKA BŁĘDNYCH
// --------------------

function repeatWrongWords() {
  if (
    wrongWords.length === 0
  ) {
    return;
  }

  quizWords =
    shuffle([
      ...wrongWords
    ]);

  wrongWords = [];
  currentIndex = 0;
  score = 0;
  streak = 0;
  answered = false;
  repeatMode = true;
  segmentStartScore = 0;

  hideAllScreens();

  document
    .getElementById(
      "quiz-screen"
    )
    .classList.remove(
      "hidden"
    );

  saveSession();
  showQuestion();
}


// --------------------
// EKRANY
// --------------------

function hideAllScreens() {
  [
    "resume-screen",
    "start-screen",
    "quiz-screen",
    "break-screen",
    "final-screen"
  ].forEach(id => {
    document
      .getElementById(id)
      .classList.add(
        "hidden"
      );
  });
}

function showStartScreen() {
  hideAllScreens();

  document
    .getElementById(
      "start-screen"
    )
    .classList.remove(
      "hidden"
    );
}

function showResumeScreen(
  state
) {
  hideAllScreens();

  document
    .getElementById(
      "resume-screen"
    )
    .classList.remove(
      "hidden"
    );

  const total =
    state.quizWords.length;

  const completed =
    Math.min(
      state.currentIndex,
      total
    );

  document.getElementById(
    "resume-progress"
  ).textContent =
    `Postęp: ${completed} / ${total}`;
}

function returnToStart() {
  clearSavedSession();

  repeatMode = false;
  quizWords = [];
  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];
  answered = false;

  showStartScreen();
}


// --------------------
// START APLIKACJI
// --------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {

    document
      .querySelectorAll(
        ".mode-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            startQuiz(
              button.dataset.mode
            );
          }
        );

      });


    document
      .getElementById(
        "repeat-wrong-btn"
      )
      .addEventListener(
        "click",
        repeatWrongWords
      );


    document
      .getElementById(
        "restart-btn"
      )
      .addEventListener(
        "click",
        returnToStart
      );


    document
      .getElementById(
        "resume-btn"
      )
      .addEventListener(
        "click",
        resumeQuiz
      );


    document
      .getElementById(
        "discard-session-btn"
      )
      .addEventListener(
        "click",
        discardSavedSession
      );


    const saved =
      loadSavedSession();

    if (
      saved &&
      saved.currentIndex <
        saved.quizWords.length
    ) {
      showResumeScreen(saved);
    } else {
      clearSavedSession();
      showStartScreen();
    }

  }
);
