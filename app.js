const SEGMENT_SIZE = 50;
const BREAK_TIME = 120;

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
    .filter(item => normalize(item.pl) === normalize(word.pl))
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

function startQuiz(mode) {
  selectedMode = mode;
  repeatMode = false;

  quizWords = shuffle(words);

  currentIndex = 0;
  score = 0;
  streak = 0;
  wrongWords = [];
  answered = false;
  segmentStartScore = 0;

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

function showQuestion() {
  if (currentIndex >= quizWords.length) {
    showFinalScreen();
    return;
  }

  answered = false;

  const word = quizWords[currentIndex];
  const direction = getDirection();

  const question =
    direction === "en-pl"
      ? word.en
      : word.pl;

  currentCorrectAnswers =
    getCorrectAnswers(word, direction);

  document.getElementById(
    "question"
  ).textContent = question;

  const answersContainer =
    document.getElementById("answers");

  answersContainer.innerHTML = "";

  const answerPool = words
    .filter(item => item !== word)
    .map(item =>
      direction === "en-pl"
        ? item.pl
        : item.en
    )
    .filter(answer =>
      !currentCorrectAnswers.includes(answer)
    );

  const wrongOptions =
    shuffle([...new Set(answerPool)]).slice(0, 3);

  const correctOption =
    currentCorrectAnswers[
      Math.floor(
        Math.random() *
        currentCorrectAnswers.length
      )
    ];

  const options = shuffle([
    correctOption,
    ...wrongOptions
  ]);

  options.forEach(option => {
    const button =
      document.createElement("button");

    button.className = "answer-btn";
    button.textContent = option;

    button.addEventListener("click", () => {
      checkAnswer(
        button,
        option,
        word
      );
    });

    answersContainer.appendChild(button);
  });

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
    document.querySelectorAll(".answer-btn");

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

    if (
      !repeatMode &&
      currentIndex < quizWords.length &&
      currentIndex % SEGMENT_SIZE === 0
    ) {
      showBreak();
    } else {
      showQuestion();
    }
  }, 900);
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

  document.getElementById(
    "overall-progress"
  ).style.width =
    `${total
      ? (completed / total) * 100
      : 0}%`;

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
      `${total
        ? (completed / total) * 100
        : 0}%`;

    return;
  }

  const segmentNumber =
    Math.floor(
      currentIndex / SEGMENT_SIZE
    ) + 1;

  const segmentStart =
    Math.floor(
      currentIndex / SEGMENT_SIZE
    ) * SEGMENT_SIZE;

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
    `${segmentLength
      ? (segmentCompleted / segmentLength) * 100
      : 0}%`;
}

function showBreak() {
  document
    .getElementById("quiz-screen")
    .classList.add("hidden");

  document
    .getElementById("break-screen")
    .classList.remove("hidden");

  const segment =
    currentIndex / SEGMENT_SIZE;

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
    score - segmentStartScore;

  document.getElementById(
    "segment-score"
  ).textContent =
    `Wynik segmentu: ${segmentScore} / 50`;

  segmentStartScore = score;

  let seconds = BREAK_TIME;

  const timerElement =
    document.getElementById(
      "break-timer"
    );

  timerElement.textContent =
    formatTime(seconds);

  const timer =
    setInterval(() => {
      seconds--;

      timerElement.textContent =
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

  const remainingSeconds =
    seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(
      remainingSeconds
    ).padStart(2, "0")
  );
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
    quizWords.length
      ? score / quizWords.length
      : 0;

  let message;

  if (percent >= 0.9) {
    message =
      "No i kto mówił, że nie umie angielskiego? 😏❤️";
  } else if (percent >= 0.75) {
    message =
      "Bardzo dobrze ❤️ Jeszcze trochę i będzie petarda.";
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

function repeatWrongWords() {
  if (wrongWords.length === 0) {
    return;
  }

  quizWords = shuffle([...wrongWords]);

  wrongWords = [];
  currentIndex = 0;
  score = 0;
  streak = 0;
  answered = false;
  repeatMode = true;

  document
    .getElementById("final-screen")
    .classList.add("hidden");

  document
    .getElementById("quiz-screen")
    .classList.remove("hidden");

  showQuestion();
}

function returnToStart() {
  repeatMode = false;

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

document.addEventListener(
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
  }
);
