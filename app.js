const SEGMENT_SIZE = 50;
const BREAK_TIME = 120;

let quizWords = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let wrongWords = [];
let answered = false;
let currentCorrectAnswers = [];
let selectedMode = "mixed";
let isWrongRepeatMode = false;

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

function getAllCorrectAnswers(word, direction) {
  if (direction === "en-pl") {
    return [word.pl];
  }

  const targetPolish = normalize(word.pl);

  return words
    .filter(item => normalize(item.pl) === targetPolish)
    .map(item => item.en);
}

function chooseDirection() {
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

function startQuiz(mode) {
  selectedMode = mode;
  isWrongRepeatMode = false;

  quizWords = shuffle(words);

  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];

  document
    .getElementById("start-screen")
    .classList.add("hidden");

  document
    .getElementById("final-screen")
    .classList.add("hidden");

  document
    .getElementById("break-screen")
    .classList.add("hidden");

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  showQuestion();
}

function startWrongRepeat() {
  if (wrongWords.length === 0) return;

  quizWords = shuffle([...wrongWords]);

  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];
  isWrongRepeatMode = true;

  document
    .getElementById("final-screen")
    .classList.add("hidden");

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  showQuestion();
}

function showQuestion() {
  if (currentIndex >= quizWords.length) {
    showFinalScreen();
    return;
  }

  const word = quizWords[currentIndex];
  const direction = chooseDirection();

  const question =
    direction === "en-pl"
      ? word.en
      : word.pl;

  currentCorrectAnswers =
    getAllCorrectAnswers(word, direction);

  document.getElementById(
    "question"
  ).textContent = question;

  const answerContainer =
    document.getElementById("answers");

  answerContainer.innerHTML = "";

  const availableAnswers = words
    .filter(item => item !== word)
    .map(item =>
      direction === "en-pl"
        ? item.pl
        : item.en
    )
    .filter(answer =>
      !currentCorrectAnswers.includes(answer)
    );

  const wrongAnswers = shuffle(
    [...new Set(availableAnswers)]
  ).slice(0, 3);

  const displayedCorrectAnswer =
    currentCorrectAnswers[
      Math.floor(
        Math.random() *
        currentCorrectAnswers.length
      )
    ];

  const answers = shuffle([
    displayedCorrectAnswer,
    ...wrongAnswers
  ]);

  answers.forEach(answer => {
    const button =
      document.createElement("button");

    button.className = "answer-btn";
    button.textContent = answer;

    button.addEventListener("click", () => {
      checkAnswer(
        button,
        answer,
        word
      );
    });

    answerContainer.appendChild(button);
  });

  answered = false;

  updateProgress();
}

function checkAnswer(
  button,
  selectedAnswer,
  word
) {
  if (answered) return;

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
      btn.classList.add("correct");
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
    button.classList.add("wrong");
    streak = 0;

    if (
      !wrongWords.some(
        item =>
          item.en === word.en &&
          item.pl === word.pl
      )
    ) {
      wrongWords.push(word);
    }
  }

  updateProgress();

  setTimeout(nextQuestion, 900);
}

function nextQuestion() {
  currentIndex++;

  if (
    !isWrongRepeatMode &&
    currentIndex < quizWords.length &&
    currentIndex % SEGMENT_SIZE === 0
  ) {
    showBreak();
  } else {
    showQuestion();
  }
}

function updateProgress() {
  const total = quizWords.length;

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

  const overallPercent =
    total === 0
      ? 0
      : (completed / total) * 100;

  document.getElementById(
    "overall-progress"
  ).style.width =
    `${overallPercent}%`;

  let segmentNumber = 1;
  let segmentLength = total;
  let segmentCompleted = completed;

  if (!isWrongRepeatMode) {
    segmentNumber =
      Math.floor(
        currentIndex / SEGMENT_SIZE
      ) + 1;

    const segmentStart =
      Math.floor(
        currentIndex / SEGMENT_SIZE
      ) * SEGMENT_SIZE;

    segmentLength =
      Math.min(
        SEGMENT_SIZE,
        total - segmentStart
      );

    segmentCompleted =
      Math.min(
        (currentIndex - segmentStart) +
          (answered ? 1 : 0),
        segmentLength
      );
  }

  document.getElementById(
    "segment-text"
  ).textContent =
    isWrongRepeatMode
      ? "Powtórka błędnych"
      : `Segment ${segmentNumber}`;

  document.getElementById(
    "segment-progress-text"
  ).textContent =
    `${segmentCompleted} / ${segmentLength}`;

  const segmentPercent =
    segmentLength === 0
      ? 0
      : (segmentCompleted /
          segmentLength) * 100;

  document.getElementById(
    "segment-progress"
  ).style.width =
    `${segmentPercent}%`;

  document.getElementById(
    "streak"
  ).textContent =
    `🔥 ${streak}`;
}

function showBreak() {
  document
    .getElementById("quiz-screen")
    .classList.add("hidden");

  document
    .getElementById("break-screen")
    .classList.remove("hidden");

  const completedSegment =
    currentIndex / SEGMENT_SIZE;

  const messages = [
    const messages = [
  "Super Ci idzie ❤️ Odpocznij chwilę, napij się czegoś i lecimy dalej.",
  "Połowa za Tobą 😎 Zrób sobie 2 minuty przerwy, serio zasłużyłaś.",
  "Ostatnia prosta ❤️ Odpocznij chwilę. Jeszcze tylko 50 i masz to."
];
  ];

  document.getElementById(
    "break-message"
  ).textContent =
    messages[completedSegment - 1] ||
    "Super Ci idzie ❤️";

  let seconds = BREAK_TIME;

  document.getElementById(
    "break-timer"
  ).textContent =
    formatTime(seconds);

  const timer = setInterval(() => {
    seconds--;

    document.getElementById(
      "break-timer"
    ).textContent =
      formatTime(seconds);

    if (seconds <= 0) {
      clearInterval(timer);
      continueQuiz();
    }
  }, 1000);

  document.getElementById(
    "continue-btn"
  ).onclick = () => {
    clearInterval(timer);
    continueQuiz();
  };
}

function continueQuiz() {
  document
    .getElementById("break-screen")
    .classList.add("hidden");

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  showQuestion();
}

function formatTime(seconds) {
  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remaining).padStart(
    2,
    "0"
  )}`;
}

function showFinalScreen() {
  document
    .getElementById("quiz-screen")
    .classList.add("hidden");

  document
    .getElementById("break-screen")
    .classList.add("hidden");

  document
    .getElementById("final-screen")
    .classList.remove("hidden");

  document.getElementById(
    "final-score"
  ).textContent =
    `${score} / ${quizWords.length}`;

  const percent =
    quizWords.length === 0
      ? 0
      : score / quizWords.length;

  let message;

  if (percent >= 0.9) {
    message =
      "No pięknie księżniczko! Duma mnie rozpiera 😏❤️";
  } else if (percent >= 0.75) {
    message =
      "Bardzo dobrze, jestem dumny ❤️ Jeszcze trochę i będzie petarda.";
  } else {
    message =
      "Spokojnie, po to jest ten quiz ❤️ Powtórzymy błędne i będzie git.";
  }

  document.getElementById(
    "final-message"
  ).textContent = message;

  const wrongSummary =
    document.getElementById(
      "wrong-summary"
    );

  if (wrongWords.length > 0) {
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

function goToStart() {
  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];
  isWrongRepeatMode = false;

  document
    .getElementById("final-screen")
    .classList.add("hidden");

  document
    .getElementById("quiz-screen")
    .classList.add("hidden");

  document
    .getElementById("break-screen")
    .classList.add("hidden");

  document
    .getElementById("start-screen")
    .classList.remove("hidden");
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .querySelectorAll(".mode-btn")
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
        startWrongRepeat
      );

    document
      .getElementById("restart-btn")
      .addEventListener(
        "click",
        goToStart
      );
  }
);
