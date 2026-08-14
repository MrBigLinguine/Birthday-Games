/* ============================================================
   UNTITLED GAMES
   Main Game Logic — Clean Rebuild
============================================================ */

"use strict";


/* ============================================================
   CONSTANTS
============================================================ */

const STORAGE_KEY = "untitledGamesStateV1";

const TEAM_COLOURS = [
  "#1ef7ff",
  "#ff2bd6",
  "#ffc857"
];

const GAME_IDS = [
  "pub-trivia",
  "category-trivia",
  "whos-that",
  "movie-reviews",
  "song-game",
  "switch-tennis",
  "pixel-movie",
  "geoguessr",
  "family-feud"
];


/* ============================================================
   DEFAULT STATE
============================================================ */

function createDefaultState() {
  return {
    teamCount: 3,

    teams: [
      {
        name: "Team 1",
        score: 0
      },
      {
        name: "Team 2",
        score: 0
      },
      {
        name: "Team 3",
        score: 0
      }
    ],

    soundOn: true,

    completedGames: {},

    category: {
      currentTurn: 0,
      tiles: {}
    },

    song: {
      usedWagers: [
        [],
        [],
        []
      ],
      round: 0
    },

    pixel: {
      round: 0
    },

    geo: {
      round: 0
    },

    tennis: {
      wins: [0, 0, 0],
      matchIndex: 0
    },

    feud: {
      internalScores: [0, 0, 0],
      round: 0
    }
  };
}


let state = loadState();

let activeGame = null;


/* ============================================================
   LOCAL STORAGE
============================================================ */

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function loadState() {

  try {

    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return createDefaultState();
    }

    const parsed = JSON.parse(stored);

    return Object.assign(
      createDefaultState(),
      parsed
    );

  } catch (error) {

    console.error(
      "Could not load saved state:",
      error
    );

    return createDefaultState();
  }
}

function resetEverything() {

  localStorage.removeItem(STORAGE_KEY);

  state = createDefaultState();

  location.reload();
}


/* ============================================================
   BASIC DOM HELPERS
============================================================ */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(
    document.querySelectorAll(selector)
  );
}

function showScreen(id) {

  $$(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(id);

  if (screen) {
    screen.classList.add("active");
  }
}

function cloneTemplate(id) {

  const template =
    document.getElementById(id);

  return template.content.cloneNode(true);
}


/* ============================================================
   SOUND
============================================================ */

// Main-menu music removed in this version.

function safePlay(audio) {

  if (!state.soundOn || !audio) {
    return;
  }

  audio.currentTime = 0;

  const promise = audio.play();

  if (promise) {
    promise.catch(() => {});
  }
}

function playSfx(id) {

  if (!state.soundOn) {
    return;
  }

  const sound = document.getElementById(id);

  if (!sound || !sound.src) {
    return;
  }

  safePlay(sound);
}

function startMenuMusic() {
  // Main menu music intentionally disabled.
}

function stopMenuMusic() {
  // Main menu music intentionally disabled.
}

function updateSoundLabels() {

  const text =
    state.soundOn
      ? "SOUND ON"
      : "SOUND OFF";

  const gameSound =
    $("#game-sound-button");

  const masterSound =
    $("#master-sound-toggle");

  if (gameSound) {
    gameSound.textContent = text;
  }

  if (masterSound) {
    masterSound.textContent = text;
  }
}

function toggleSound() {

  state.soundOn = !state.soundOn;

  updateSoundLabels();
  saveState();
}


/* ============================================================
   VISUAL FEEDBACK
============================================================ */

function flashCorrect() {

  const allowedGames = [
    "pub-trivia",
    "category-trivia",
    "family-feud"
  ];

  if (!allowedGames.includes(activeGame)) {
    return;
  }

  document.body.classList.remove(
    "wrong-flash"
  );

  document.body.classList.add(
    "correct-flash"
  );

  setTimeout(() => {
    document.body.classList.remove(
      "correct-flash"
    );
  }, 650);

  playSfx("correct-sound");
}

function flashWrong() {

  const allowedGames = [
    "pub-trivia",
    "category-trivia",
    "family-feud"
  ];

  if (!allowedGames.includes(activeGame)) {
    return;
  }

  document.body.classList.remove(
    "correct-flash"
  );

  document.body.classList.add(
    "wrong-flash"
  );

  setTimeout(() => {
    document.body.classList.remove(
      "wrong-flash"
    );
  }, 650);

  playSfx("wrong-sound");
}


/* ============================================================
   TEAM HELPERS
============================================================ */

function activeTeams() {
  return state.teams.slice(
    0,
    state.teamCount
  );
}

function changeScore(
  teamIndex,
  amount
) {

  if (
    teamIndex < 0 ||
    teamIndex >= state.teamCount
  ) {
    return;
  }

  state.teams[teamIndex].score += amount;

  saveState();
  updateScoreboards();
}

function updateScoreboards() {

  const masterBoard =
    $("#master-scoreboard");

  if (masterBoard) {
    masterBoard.classList.toggle(
      "two-teams",
      state.teamCount === 2
    );

    masterBoard.classList.toggle(
      "three-teams",
      state.teamCount === 3
    );
  }

  state.teams.forEach(
    (team, index) => {

      const teamNumber = index + 1;

      $$(
        `.score-card[data-team="${teamNumber}"]`
      ).forEach(card => {

        card.style.display =
          index < state.teamCount
            ? ""
            : "none";

        const name =
          card.querySelector(
            ".score-team-name"
          );

        const score =
          card.querySelector(
            ".score-value"
          );

        if (name) {
          name.textContent = team.name;
        }

        if (score) {
          score.textContent = team.score;
        }
      });
    }
  );

  renderGameScoreboard();
}

function renderGameScoreboard() {

  const container =
    $("#game-scoreboard-container");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const board =
    document.createElement("div");

  board.className =
    state.teamCount === 2
      ? "scoreboard two-teams"
      : "scoreboard three-teams";

  activeTeams().forEach(
    (team, index) => {

      const card =
        document.createElement("div");

      card.className =
        `score-card team-${index + 1}-card`;

      card.innerHTML = `
        <div class="score-team-name">
          ${escapeHtml(team.name)}
        </div>

        <div class="score-controls">

          <button
            class="manual-score-button"
            data-team="${index + 1}"
            data-change="-10"
            type="button"
          >
            −10
          </button>

          <span class="score-value">
            ${team.score}
          </span>

          <button
            class="manual-score-button"
            data-team="${index + 1}"
            data-change="10"
            type="button"
          >
            +10
          </button>

        </div>
      `;

      board.appendChild(card);
    }
  );

  container.appendChild(board);

  board
    .querySelectorAll(
      ".manual-score-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const teamIndex =
            Number(button.dataset.team) - 1;

          const amount =
            Number(button.dataset.change);

          changeScore(
            teamIndex,
            amount
          );

          if (
            [
              "pub-trivia",
              "category-trivia",
              "family-feud"
            ].includes(activeGame)
          ) {

            if (amount > 0) {
              flashCorrect();
            } else if (amount < 0) {
              flashWrong();
            }
          }
        }
      );
    });
}

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


/* ============================================================
   GAME COMPLETION
============================================================ */

function markGameComplete(gameId) {

  state.completedGames[gameId] = true;

  saveState();
  updateHub();
}

function completedGameCount() {

  return GAME_IDS.filter(
    id => state.completedGames[id]
  ).length;
}

function updateHub() {

  $$(".game-card").forEach(card => {

    const id =
      card.dataset.game;

    if (state.completedGames[id]) {
      card.classList.add("complete");
    } else {
      card.classList.remove("complete");
    }
  });

  const count =
    completedGameCount();

  const counter =
    $("#games-complete-counter");

  if (counter) {
    counter.textContent =
      `${count} / ${GAME_IDS.length} COMPLETE`;
  }

  const finalButton =
    $("#final-results-button");

  if (finalButton) {

    finalButton.disabled =
      count !== GAME_IDS.length;
  }

  updateScoreboards();
}


/* ============================================================
   TIMER UTILITY
============================================================ */

function createCountdown(
  element,
  seconds,
  onFinish
) {

  let remaining = seconds;

  let interval = null;

  let paused = false;

  element.textContent = remaining;

  function render() {

    element.textContent = remaining;

    element.classList.toggle(
      "warning",
      remaining <= 10 &&
      remaining > 5
    );

    element.classList.toggle(
      "danger",
      remaining <= 5
    );
  }

  function start() {

    if (interval) {
      return;
    }

    paused = false;

    interval = setInterval(() => {

      if (paused) {
        return;
      }

      remaining -= 1;

      render();

      if (remaining <= 0) {

        clearInterval(interval);
        interval = null;

        playSfx("time-up-sound");

        if (onFinish) {
          onFinish();
        }
      }

    }, 1000);
  }

  function pause() {
    paused = true;
  }

  function resume() {
    paused = false;
  }

  function stop() {

    clearInterval(interval);
    interval = null;
  }

  function reset(newSeconds = seconds) {

    stop();

    remaining = newSeconds;

    paused = false;

    render();
  }

  return {
    start,
    pause,
    resume,
    stop,
    reset,

    get remaining() {
      return remaining;
    },

    get paused() {
      return paused;
    }
  };
}


/* ============================================================
   TITLE + SETUP
============================================================ */

function initialiseSetup() {

  const startButton =
    $("#press-start-button");

  if (startButton) {

    startButton.addEventListener(
      "click",
      () => {

        startMenuMusic();
        showScreen("setup-screen");
      }
    );
  }

  $$(".team-count-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          state.teamCount =
            Number(
              button.dataset.teamCount
            );

          $$(".team-count-button")
            .forEach(other => {
              other.classList.remove(
                "selected"
              );
            });

          button.classList.add(
            "selected"
          );

          updateSetupRows();
          saveState();
        }
      );
    });

  const startGame =
    $("#start-game-button");

  if (startGame) {

    startGame.addEventListener(
      "click",
      () => {

        for (
          let i = 0;
          i < state.teamCount;
          i++
        ) {

          const input =
            document.getElementById(
              `team-name-${i + 1}`
            );

          const value =
            input.value.trim();

          state.teams[i].name =
            value ||
            `Team ${i + 1}`;
        }

        saveState();

        updateScoreboards();
        updateHub();

        showScreen("hub-screen");
        startMenuMusic();
      }
    );
  }

  updateSetupRows();
}

function updateSetupRows() {

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const row =
      document.querySelector(
        `.team-name-row[data-team="${i + 1}"]`
      );

    const input =
      document.getElementById(
        `team-name-${i + 1}`
      );

    if (row) {
      row.style.display =
        i < state.teamCount
          ? ""
          : "none";
    }

    if (input) {
      input.value =
        state.teams[i].name;
    }
  }

  $$(".team-count-button")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        Number(button.dataset.teamCount) ===
        state.teamCount
      );
    });
}


/* ============================================================
   HOST CONTROLS
============================================================ */

function initialiseHostControls() {

  $("#host-button")
    ?.addEventListener(
      "click",
      openHostModal
    );

  $("#close-host-modal")
    ?.addEventListener(
      "click",
      () => {

        $("#host-modal")
          ?.classList.add("hidden");
      }
    );

  $("#master-sound-toggle")
    ?.addEventListener(
      "click",
      toggleSound
    );

  $("#game-sound-button")
    ?.addEventListener(
      "click",
      toggleSound
    );

  $("#reset-game-button")
    ?.addEventListener(
      "click",
      () => {

        $("#host-modal")
          ?.classList.add("hidden");

        $("#reset-confirmation-modal")
          ?.classList.remove("hidden");
      }
    );

  $("#cancel-reset-button")
    ?.addEventListener(
      "click",
      () => {

        $("#reset-confirmation-modal")
          ?.classList.add("hidden");
      }
    );

  $("#confirm-reset-button")
    ?.addEventListener(
      "click",
      resetEverything
    );
}

function openHostModal() {

  const controls =
    $("#host-team-name-controls");

  controls.innerHTML = "";

  activeTeams().forEach(
    (team, index) => {

      const row =
        document.createElement("div");

      row.className =
        "team-name-row";

      row.innerHTML = `
        <label>
          TEAM ${index + 1}
        </label>

        <input
          type="text"
          value="${escapeHtml(team.name)}"
          maxlength="24"
        >
      `;

      const input =
        row.querySelector("input");

      input.addEventListener(
        "change",
        () => {

          state.teams[index].name =
            input.value.trim() ||
            `Team ${index + 1}`;

          saveState();

          updateScoreboards();
          updateHub();
        }
      );

      controls.appendChild(row);
    }
  );

  $("#host-modal")
    ?.classList.remove("hidden");

  updateSoundLabels();
}


/* ============================================================
   MANUAL SCORE BUTTONS
============================================================ */

function initialiseMasterScoreButtons() {

  $$(".manual-score-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const teamIndex =
            Number(
              button.dataset.team
            ) - 1;

          const amount =
            Number(
              button.dataset.change
            );

          changeScore(
            teamIndex,
            amount
          );
        }
      );
    });
}


/* ============================================================
   GAME HUB / NAVIGATION
============================================================ */

function initialiseGameHub() {

  $$(".game-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const gameId =
            card.dataset.game;

          openGame(gameId);
        }
      );
    });

  $("#return-to-hub-button")
    ?.addEventListener(
      "click",
      returnToHub
    );

  $("#final-results-button")
    ?.addEventListener(
      "click",
      openFinalResults
    );
}

function openGame(gameId) {

  activeGame = gameId;

  stopMenuMusic();

  const title =
    document.querySelector(
      `.game-card[data-game="${gameId}"] .game-card-title`
    )?.textContent || "GAME";

  $("#current-game-title")
    .textContent = title;

  showScreen("game-screen");

  renderGameScoreboard();

  const container =
    $("#game-content");

  container.innerHTML = "";

  switch (gameId) {

    case "pub-trivia":
      initialisePubTrivia();
      break;

    case "category-trivia":
      initialiseCategoryTrivia();
      break;

    case "whos-that":
      initialiseWhosThat();
      break;

    case "movie-reviews":
      initialiseMovieReviews();
      break;

    case "song-game":
      initialiseSongGame();
      break;

    case "switch-tennis":
      initialiseTennis();
      break;

    case "pixel-movie":
      initialisePixelMovie();
      break;

    case "geoguessr":
      initialiseGeoGuessr();
      break;

    case "family-feud":
      initialiseFamilyFeud();
      break;
  }
}

function returnToHub() {

  activeGame = null;

  showScreen("hub-screen");

  updateHub();

  startMenuMusic();
}


/* ============================================================
   PUB TRIVIA DATA
============================================================ */

const PUB_QUESTIONS = [

  {
    q:
      "What is the maximum possible score in a single game of ten-pin bowling?",

    a:
      "300",

    why:
      "A perfect game is 12 consecutive strikes. Ten strikes fill the regulation frames, with two bonus throws in the tenth frame."
  },

  {
    q:
      "Which continent lies in all four hemispheres?",

    a:
      "Africa",

    why:
      "Africa is crossed by both the Equator and the Prime Meridian, placing parts of the continent in the Northern, Southern, Eastern and Western hemispheres."
  },

  {
    q:
      "Which artist created the Campbell's Soup Cans series?",

    a:
      "Andy Warhol",

    why:
      "Andy Warhol produced the famous 32-canvas Campbell's Soup Cans work in 1962, helping define American Pop Art."
  },

  {
    q:
      "On the periodic table, which element is represented by the symbol Au?",

    a:
      "Gold",

    why:
      "Au comes from the Latin word 'aurum', meaning gold."
  },

  {
    q:
      "Which Shakespeare play opens with three witches meeting during a thunderstorm?",

    a:
      "Macbeth",

    why:
      "Macbeth opens on a stormy heath with the three Weird Sisters discussing when they will meet Macbeth."
  },

  {
    q:
      "Who was the first emperor of Rome?",

    a:
      "Augustus",

    why:
      "Octavian became Augustus in 27 BCE and is generally regarded as Rome's first emperor."
  },

  {
    q:
      "Which famous rock band got their name from a sewing machine?",

    a:
      "AC/DC",

    why:
      "The Young family noticed the AC/DC marking on an electrical appliance associated with Margaret Young's sewing machine. AC/DC means alternating current/direct current."
  },

  {
    q:
      "Which berry gives gin its characteristic flavour?",

    a:
      "Juniper berry",

    why:
      "Gin is defined by its dominant juniper flavour. Juniper berries provide its characteristic piney, aromatic taste."
  },

  {
    q:
      "Which Australian animal has fingerprints so similar to humans that they can be difficult to distinguish?",

    a:
      "Koala",

    why:
      "Koalas have highly developed friction ridges on their fingertips that look remarkably similar to human fingerprints."
  },

  {
    q:
      "What is the largest species of tuna?",

    a:
      "Atlantic bluefin tuna",

    why:
      "Atlantic bluefin tuna are the largest tuna species and can grow to several hundred kilograms."
  }
];


/* ============================================================
   PUB TRIVIA
============================================================ */

function initialisePubTrivia() {

  const container = $("#game-content");

  container.appendChild(
    cloneTemplate("pub-trivia-template")
  );

  let questionIndex = 0;
  let phase = "questions";

  const number = $("#pub-question-number");
  const question = $("#pub-question");
  const answerSection = $("#pub-answer-section");
  const answer = $("#pub-answer");
  const explanation = $("#pub-explanation");
  const reveal = $("#pub-reveal-button");
  const next = $("#pub-next-button");

  const previous = document.createElement("button");
  previous.className = "secondary-button";
  previous.type = "button";
  previous.textContent = "← PREVIOUS";

  reveal.parentElement.prepend(previous);

  function showQuestion() {

    const item = PUB_QUESTIONS[questionIndex];

    number.textContent = questionIndex + 1;
    question.textContent = item.q;

    answerSection.classList.add("hidden");
    reveal.classList.remove("hidden");
    next.classList.add("hidden");

    previous.disabled = questionIndex === 0;

    if (phase === "questions") {

      reveal.textContent =
        questionIndex === PUB_QUESTIONS.length - 1
          ? "PENS DOWN"
          : "NEXT QUESTION";

    } else {

      reveal.textContent = "REVEAL ANSWER";
    }
  }

  previous.onclick = () => {

    if (questionIndex <= 0) {
      return;
    }

    questionIndex -= 1;
    showQuestion();
  };

  reveal.onclick = () => {

    if (phase === "questions") {

      if (
        questionIndex <
        PUB_QUESTIONS.length - 1
      ) {

        questionIndex += 1;
        showQuestion();
        return;
      }

      phase = "answers";
      questionIndex = 0;
      showQuestion();
      return;
    }

    const item = PUB_QUESTIONS[questionIndex];

    answer.textContent = item.a;
    explanation.textContent = item.why;

    answerSection.classList.remove("hidden");

    playSfx("reveal-sound");

    reveal.classList.add("hidden");
    next.classList.remove("hidden");

    next.textContent =
      questionIndex === PUB_QUESTIONS.length - 1
        ? "FINISH PUB TRIVIA"
        : "NEXT ANSWER";
  };

  next.onclick = () => {

    if (
      questionIndex ===
      PUB_QUESTIONS.length - 1
    ) {

      markGameComplete("pub-trivia");
      returnToHub();
      return;
    }

    questionIndex += 1;
    showQuestion();
  };

  showQuestion();
}


/* ============================================================
   CATEGORY TRIVIA DATA
============================================================ */

const CATEGORY_DATA = [

  {
    category: "GEOGRAPHY",

    questions: [

      {
        value: 10,
        q:
          "What is the capital city of New Zealand?",
        a:
          "Wellington",
        why:
          "Wellington has been New Zealand's capital since 1865."
      },

      {
        value: 20,
        q:
          "Which country is home to the ancient city of Petra?",
        a:
          "Jordan",
        why:
          "Petra is the famous Nabataean archaeological city carved into sandstone in southern Jordan."
      },

      {
        value: 30,
        q:
          "Which country has more islands than any other country in the world?",
        a:
          "Sweden",
        why:
          "Sweden has hundreds of thousands of identified islands, more than any other country."
      }
    ]
  },

  {
    category: "ENTERTAINMENT",

    questions: [

      {
        value: 10,
        q:
          "In 2022, which famous pop star topped a study ranking celebrities by estimated private-jet CO₂ emissions?",
        a:
          "Taylor Swift",
        why:
          "A widely reported 2022 analysis estimated Taylor Swift's jet produced the highest emissions among the celebrities it ranked."
      },

      {
        value: 20,
        q:
          "What is the name of the lobby boy in The Grand Budapest Hotel?",
        a:
          "Zero Moustafa",
        why:
          "Zero is the young lobby boy who becomes Monsieur Gustave's protégé."
      },

      {
        value: 30,
        q:
          "Which band was originally known as The Polka Tulk Blues Band before changing its name?",
        a:
          "Black Sabbath",
        why:
          "The band used early names including The Polka Tulk Blues Band and Earth before becoming Black Sabbath."
      }
    ]
  },

  {
    category: "HISTORY",

    questions: [

      {
        value: 10,
        q:
          "Who was the first person to walk on the Moon?",
        a:
          "Neil Armstrong",
        why:
          "Neil Armstrong stepped onto the lunar surface during Apollo 11 in July 1969."
      },

      {
        value: 20,
        q:
          "Which battle in 1815 marked Napoleon's final defeat?",
        a:
          "Battle of Waterloo",
        why:
          "Napoleon was defeated at Waterloo on 18 June 1815, ending his Hundred Days return to power."
      },

      {
        value: 30,
        q:
          "Which Carthaginian general famously crossed the Alps with elephants?",
        a:
          "Hannibal",
        why:
          "Hannibal crossed the Alps during the Second Punic War as part of his invasion of Italy."
      }
    ]
  },

  {
    category:
      "ART & LITERATURE",

    questions: [

      {
        value: 10,
        q:
          "Which fictional detective lives at 221B Baker Street?",
        a:
          "Sherlock Holmes",
        why:
          "Arthur Conan Doyle's Sherlock Holmes is famously associated with 221B Baker Street in London."
      },

      {
        value: 20,
        q:
          "Which artist painted The Persistence of Memory?",
        a:
          "Salvador Dalí",
        why:
          "Salvador Dalí painted the surrealist work, famous for its melting clocks, in 1931."
      },

      {
        value: 30,
        q:
          "Who wrote The Divine Comedy?",
        a:
          "Dante Alighieri",
        why:
          "Dante's epic poem follows a journey through Inferno, Purgatorio and Paradiso."
      }
    ]
  },

  {
    category:
      "SPORTS & LEISURE",

    questions: [

      {
        value: 10,
        q:
          "What medal is awarded to the best player in the AFL Grand Final?",
        a:
          "Norm Smith Medal",
        why:
          "The Norm Smith Medal is awarded to the player judged best on ground in the AFL Grand Final."
      },

      {
        value: 20,
        q:
          "Which athlete won eight gold medals at the 2008 Beijing Olympics?",
        a:
          "Michael Phelps",
        why:
          "Michael Phelps won eight swimming gold medals in Beijing, setting a record for gold medals at a single Olympic Games."
      },

      {
        value: 30,
        q:
          "Which driver won the 2007 Formula 1 World Championship by a single point over Lewis Hamilton and Fernando Alonso?",
        a:
          "Kimi Räikkönen",
        why:
          "Räikkönen finished the 2007 season with 110 points, one ahead of both Hamilton and Alonso."
      }
    ]
  },

  {
    category:
      "SCIENCE & NATURE",

    questions: [

      {
        value: 10,
        q:
          "Which organ produces insulin?",
        a:
          "Pancreas",
        why:
          "Beta cells in the islets of Langerhans within the pancreas produce insulin."
      },

      {
        value: 20,
        q:
          "What is the only continent with no native species of ants?",
        a:
          "Antarctica",
        why:
          "Antarctica's extreme climate prevents native ant populations from becoming established."
      },

      {
        value: 30,
        q:
          "What is the boundary around a black hole beyond which nothing can escape called?",
        a:
          "Event horizon",
        why:
          "The event horizon marks the point beyond which escape would require travelling faster than light."
      }
    ]
  }
];


/* ============================================================
   CATEGORY TRIVIA
============================================================ */

function initialiseCategoryTrivia() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "category-trivia-template"
      )
    );

  renderCategoryBoard();
}

function renderCategoryBoard() {

  const board = $("#category-board");
  const questionView = $("#category-question-view");

  questionView.classList.add("hidden");
  board.classList.remove("hidden");
  board.innerHTML = "";

  let boardTurnIndicator =
    document.getElementById(
      "category-board-turn"
    );

  if (!boardTurnIndicator) {

    boardTurnIndicator =
      document.createElement("div");

    boardTurnIndicator.id =
      "category-board-turn";

    boardTurnIndicator.className =
      "turn-indicator category-board-turn";

    board.parentElement.insertBefore(
      boardTurnIndicator,
      board
    );
  }

  boardTurnIndicator.classList.remove(
    "hidden"
  );

  const choosingTeam =
    state.category.currentTurn %
    state.teamCount;

  boardTurnIndicator.textContent =
    `${state.teams[choosingTeam].name.toUpperCase()}'S TURN — CHOOSE A QUESTION`;

  CATEGORY_DATA.forEach(
    (column, columnIndex) => {

      const columnElement =
        document.createElement("div");

      columnElement.className =
        "category-column";

      const heading =
        document.createElement("div");

      heading.className =
        "category-heading";

      heading.textContent =
        column.category;

      columnElement.appendChild(
        heading
      );

      column.questions.forEach(
        (question, questionIndex) => {

          const key =
            `${columnIndex}-${questionIndex}`;

          const button =
            document.createElement(
              "button"
            );

          button.type = "button";
          button.className =
            "category-tile";

          const status =
            state.category.tiles[key];

          if (status === "correct") {

            button.classList.add(
              "correct"
            );

            button.textContent = "✓";
            button.disabled = true;

          } else if (status === "dead") {

            button.classList.add(
              "dead"
            );

            button.textContent = "✕";
            button.disabled = true;

          } else {

            button.textContent =
              question.value;

            button.onclick = () => {
              openCategoryQuestion(
                columnIndex,
                questionIndex
              );
            };
          }

          columnElement.appendChild(
            button
          );
        }
      );

      board.appendChild(
        columnElement
      );
    }
  );

  const used =
    Object.keys(
      state.category.tiles
    ).length;

  if (used === 18) {

    setTimeout(() => {

      if (
        !state.completedGames[
          "category-trivia"
        ]
      ) {

        markGameComplete(
          "category-trivia"
        );

        alert(
          "Category Trivia complete!"
        );

        returnToHub();
      }

    }, 400);
  }
}

function openCategoryQuestion(
  columnIndex,
  questionIndex
) {

  const item =
    CATEGORY_DATA[columnIndex]
      .questions[questionIndex];

  const key =
    `${columnIndex}-${questionIndex}`;

  const board = $("#category-board");
  const boardTurn =
    $("#category-board-turn");
  const questionView =
    $("#category-question-view");
  const answerSection =
    $("#category-answer-section");
  const stealPanel =
    $("#category-steal-panel");
  const controls =
    $("#category-host-controls");

  board.classList.add("hidden");
  boardTurn?.classList.add("hidden");
  questionView.classList.remove("hidden");

  const turn =
    state.category.currentTurn %
    state.teamCount;

  $("#category-turn-indicator")
    .textContent =
      `${state.teams[turn].name.toUpperCase()}'S QUESTION`;

  $("#category-question")
    .textContent = item.q;

  $("#category-answer")
    .textContent = item.a;

  $("#category-explanation")
    .textContent = item.why;

  answerSection.classList.add(
    "hidden"
  );

  stealPanel.classList.add(
    "hidden"
  );

  let finished = false;
  let stealTimer = null;

  const mainTimer =
    createCountdown(
      $("#category-timer"),
      30,
      openSteal
    );

  const correctButton =
    $("#category-correct-button");

  const wrongButton =
    $("#category-wrong-button");

  const revealButton =
    $("#category-reveal-button");

  function revealAnswer() {

    answerSection.classList.remove(
      "hidden"
    );

    playSfx("reveal-sound");
  }

  function showAnswerAndFinish(
    result,
    scorer = null
  ) {

    if (finished) {
      return;
    }

    finished = true;

    mainTimer.stop();

    if (stealTimer) {
      stealTimer.stop();
    }

    state.category.tiles[key] =
      result;

    if (
      result === "correct" &&
      scorer !== null
    ) {

      changeScore(
        scorer,
        item.value
      );

      flashCorrect();

    } else {

      flashWrong();
    }

    revealAnswer();

    stealPanel.classList.add(
      "hidden"
    );

    correctButton.classList.add("hidden");
wrongButton.classList.add("hidden");
revealButton.classList.add("hidden");

const oldBackButton =
  document.getElementById(
    "category-return-button"
  );

if (oldBackButton) {
  oldBackButton.remove();
}

const backButton =
  document.createElement("button");

backButton.id =
  "category-return-button";

backButton.className =
  "primary-button";

backButton.type =
  "button";

backButton.textContent =
  "RETURN TO BOARD";

backButton.onclick = () => {

  state.category.currentTurn =
    (
      state.category.currentTurn +
      1
    ) % state.teamCount;

  backButton.remove();

  correctButton.classList.remove(
    "hidden"
  );

  wrongButton.classList.remove(
    "hidden"
  );

  revealButton.classList.remove(
    "hidden"
  );

  saveState();

  renderCategoryBoard();
};

controls.appendChild(
  backButton
);

    saveState();
  }

  function openSteal() {

    if (finished) {
      return;
    }

    mainTimer.stop();
    flashWrong();

    stealPanel.classList.remove(
      "hidden"
    );

    const buttonContainer =
      $("#category-steal-team-buttons");

    buttonContainer.innerHTML = "";

    stealTimer =
      createCountdown(
        $("#category-steal-timer"),
        15,
        () => {
          showAnswerAndFinish(
            "dead"
          );
        }
      );

    activeTeams().forEach(
      (team, teamIndex) => {

        if (teamIndex === turn) {
          return;
        }

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "team-button";

        button.dataset.team =
          teamIndex + 1;

        button.textContent =
          `${team.name} BUZZ`;

        button.onclick = () => {

          if (finished) {
            return;
          }

          playSfx(
            "team-buzz-sound"
          );

          stealTimer.stop();

          buttonContainer.innerHTML =
            "";

          const correct =
            document.createElement(
              "button"
            );

          correct.className =
            "correct-button";

          correct.type = "button";

          correct.textContent =
            "STEAL CORRECT";

          correct.onclick = () => {
            showAnswerAndFinish(
              "correct",
              teamIndex
            );
          };

          const wrong =
            document.createElement(
              "button"
            );

          wrong.className =
            "wrong-button";

          wrong.type = "button";

          wrong.textContent =
            "STEAL WRONG";

          wrong.onclick = () => {
            showAnswerAndFinish(
              "dead"
            );
          };

          buttonContainer.append(
            correct,
            wrong
          );
        };

        buttonContainer.appendChild(
          button
        );
      }
    );

    stealTimer.start();
  }

  correctButton.onclick = () => {
    showAnswerAndFinish(
      "correct",
      turn
    );
  };

  wrongButton.onclick = openSteal;

  revealButton.onclick = revealAnswer;

  mainTimer.start();
}


/* ============================================================
   WHO'S THAT DATA
============================================================ */

const WHOS_DATA = [

  {
    name: "Logan Paul",
    silhouette:
      "assets/images/whos-that/01_LoganPaulSILHOUETTE.png",
    reveal:
      "assets/images/whos-that/01_LoganPaul_REVEAL.png"
  },

  {
    name: "MrBeast",
    silhouette:
      "assets/images/whos-that/02_MrBeast_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/02_MrBeast_REVEAL.png"
  },

  {
    name: "Cristiano Ronaldo",
    silhouette:
      "assets/images/whos-that/03_Ronaldo_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/03_Ronaldo_REVEAL.jpg"
  },

  {
    name: "Muhammad Ali",
    silhouette:
      "assets/images/whos-that/04_MuhammedAli_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/04_MuhammedAli_REVEAL.png"
  },

  {
    name: "Danny DeVito",
    silhouette:
      "assets/images/whos-that/05_DannyDevito_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/05_DannyDevito_REVEAL.jpeg"
  },

  {
    name: "Robert Irwin",
    silhouette:
      "assets/images/whos-that/06_RobertIrwin_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/06_RobertIrwin_REVEAL.png"
  },

  {
    name: "Aunty Donna",
    silhouette:
      "assets/images/whos-that/07_AuntieDonna_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/07_AuntieDonna_REVEAL.png"
  },

  {
    name: "Banging Sangas",
    silhouette:
      "assets/images/whos-that/08_BangingSangas_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/08_BangingSangas_REVEAL.png"
  },

  {
    name: "Crocodile Dundee",
    silhouette:
      "assets/images/whos-that/09_CrocodileDundee_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/09_CrocodileDundee_REVEAL.jpeg"
  },

  {
    name: "Margot Robbie",
    silhouette:
      "assets/images/whos-that/10_MargotRobbie_SILHOUETTE.png",
    reveal:
      "assets/images/whos-that/10_MargotRobbie_REVEAL.png"
  }
];


/* ============================================================
   WHO'S THAT
============================================================ */

function initialiseWhosThat() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "whos-that-template"
      )
    );

  let round = 0;

  let selectedTeam = null;

  let lockedOut = new Set();

  let revealed = false;

  let timer =
    createCountdown(
      $("#whos-timer"),
      30,
      revealCurrent
    );

  function render() {

    const item =
      WHOS_DATA[round];

    selectedTeam = null;

    lockedOut.clear();

    revealed = false;

    $("#whos-round-number")
      .textContent =
        round + 1;

    $("#whos-image").src =
      item.silhouette;

    $("#whos-reveal-name")
      .classList.add("hidden");

    $("#whos-reveal-name")
      .textContent = "";

    $("#whos-next-button")
      .classList.add("hidden");

    const teamButtons =
      $("#whos-team-buttons");

    teamButtons.innerHTML = "";

    activeTeams().forEach(
      (team, index) => {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "team-button";

        button.dataset.team =
          index + 1;

        button.textContent =
          `${team.name} BUZZ`;

        button.onclick = () => {

          if (
            revealed ||
            lockedOut.has(index)
          ) {
            return;
          }

          selectedTeam = index;

          playSfx(
            "team-buzz-sound"
          );

          timer.pause();

          $$(".team-button")
            .forEach(b => {
              b.classList.remove(
                "selected"
              );
            });

          button.classList.add(
            "selected"
          );
        };

        teamButtons.appendChild(
          button
        );
      }
    );

    timer.reset(30);
    timer.start();
  }

  function revealCurrent() {

    if (revealed) {
      return;
    }

    revealed = true;

    timer.stop();

    const item =
      WHOS_DATA[round];

    $("#whos-image").src =
      item.reveal;

    $("#whos-reveal-name")
      .textContent =
        item.name;

    $("#whos-reveal-name")
      .classList.remove(
        "hidden"
      );

    $("#whos-next-button")
      .classList.remove(
        "hidden"
      );

    playSfx("reveal-sound");
  }

  $("#whos-pause-button")
    .onclick = () => {

      if (timer.paused) {

        timer.resume();

        $("#whos-pause-button")
          .textContent =
            "PAUSE";

      } else {

        timer.pause();

        $("#whos-pause-button")
          .textContent =
            "PLAY";
      }
    };

  $("#whos-correct-button")
    .onclick = () => {

      if (
        selectedTeam === null ||
        revealed
      ) {
        return;
      }

      changeScore(
        selectedTeam,
        10
      );

      flashCorrect();

      revealCurrent();
    };

  $("#whos-wrong-button")
    .onclick = () => {

      if (
        selectedTeam === null ||
        revealed
      ) {
        return;
      }

      lockedOut.add(
        selectedTeam
      );

      const button =
        document.querySelector(
          `.team-button[data-team="${selectedTeam + 1}"]`
        );

      if (button) {
        button.disabled = true;
      }

      selectedTeam = null;

      flashWrong();

      timer.resume();
    };

  $("#whos-reveal-button")
    .onclick =
      revealCurrent;

  $("#whos-next-button")
    .onclick = () => {

      if (round === 9) {

        markGameComplete(
          "whos-that"
        );

        returnToHub();

        return;
      }

      round += 1;
      render();
    };

  render();
}


/* ============================================================
   MOVIE REVIEWS DATA
============================================================ */

const REVIEW_DATA = [

  {
    title: "Jaws",
    stars: 2,
    author: "Shafrillas Productions",
    review:
      "The Meg (2018) is better AND it has Jason Statham innit. This movie fails cinema.",
    poster:
      "assets/images/movie-reviews/jaws poster.avif"
  },

  {
    title: "The Matrix",
    stars: 1,
    author: "Kaho Matsui",
    review:
      "Got scared at the bellybutton scene when I was 6 and then I ran outside crying and got stung by a bee in the yard. Awful experience. Dad yelled at me after that too. It was no good.",
    poster:
      "assets/images/movie-reviews/matrix poster.jpg"
  },

  {
    title: "Gladiator",
    stars: 1,
    author: "Adambolt",
    review:
      "I was not entertained.",
    poster:
      "assets/images/movie-reviews/gladiator poster.jpg"
  },

  {
    title: "The Lion King",
    stars: 3,
    author: "Clownhead",
    review:
      "If only Bill added a gay meerkat with anxiety into the OG Hamlet. Could have had a real hit on his hands.",
    poster:
      "assets/images/movie-reviews/the lion king poster.jpg"
  },

  {
    title: "2001: A Space Odyssey",
    stars: 2,
    author: "Carter",
    review:
      "I am no film expert by any means, but this has got to be the most boring, anticlimactic and unremarkable movie I’ve ever seen. There is no real plot or characters. Nothing even remotely interesting happens after the beginning with the apes. 95% of the movie there is no dialogue. All of this could be made up for if it gave the audience something to contemplate, but it doesn’t. It’s astonishing to me that this is regarded as one of the best movies of all time.",
    poster:
      "assets/images/movie-reviews/2001- A Space Odyssey Poster.jpg"
  },

  {
    title: "Pulp Fiction",
    stars: 1,
    author: "Anyonebutsyndey",
    review:
      "HE GOES BACK FOR THE POPTART. THE FUCKEN POPTART. HE WAS SO CLOSE TO BEING GOOD, SAFE, FINE, BUT NOOOO, HE NEEDS A POPTART. MOTHERFUCKEN BRUCE WILLIS POPTART-EATING ASS. FUCKEN POPTART. THE GODDAMNED POPTART. BRUCE WILLIS FUCKEN GRANDFATHER’S ASS-WATCH MOTHERFUCKER NEEDS A GOD DAMN POPTART?! ARE YOU KIDDING ME??? ZERO FUCKING STARS.",
    poster:
      "assets/images/movie-reviews/pulp fiction poster.jpg"
  },

  {
    title:
      "The Lord of the Rings: The Fellowship of the Ring",
    stars: 1,
    author: "davem82",
    review:
      "Absolutely terrible. Three hours of people walking.",
    poster:
      "assets/images/movie-reviews/lotr poster.jpeg"
  },

  {
    title: "The Godfather",
    stars: 2,
    author: "Weed King",
    review:
      "Justice for the horse they killed for that one scene!!!",
    poster:
      "assets/images/movie-reviews/the godfather poster.jpg"
  },

  {
    title: "Fight Club",
    stars: 3,
    author: "Fraser Costen",
    review:
      "I actually wanted to learn how to make soap. Now I am being arrested on domestic terrorism charges.",
    poster:
      "assets/images/movie-reviews/fight club poster.jpg"
  },

  {
    title: "Forrest Gump",
    stars: 1,
    author: "Jed",
    review:
      "Awful yet effective piece of propaganda. Obey all orders blindly and you will be promptly rewarded. Disobey and fight back and you get AIDS and die.",
    poster:
      "assets/images/movie-reviews/forrest gump poster.jpg"
  }
];


/* ============================================================
   MOVIE REVIEWS
============================================================ */

function initialiseMovieReviews() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "movie-reviews-template"
      )
    );

  let round = 0;

  let timer = null;

  let revealed = false;

  function render() {

    const item =
      REVIEW_DATA[round];

    revealed = false;

    $("#review-round-number")
      .textContent =
        round + 1;

    $("#review-stars")
      .textContent =
        "★".repeat(item.stars) +
        "☆".repeat(
          5 - item.stars
        );

    $("#review-text")
      .textContent =
        item.review;

    $("#review-author")
      .textContent =
        `— ${item.author}`;

    $("#review-reveal")
      .classList.add("hidden");

    $("#review-next-button")
      .classList.add("hidden");

    $("#review-reveal-button")
      .classList.remove("hidden");

    $("#review-timer-button")
      .textContent =
        "START TIMER";

    timer =
      createCountdown(
        $("#review-timer"),
        30,
        () => {

          $("#review-timer-button")
            .textContent =
              "PENS DOWN";
        }
      );
  }

  $("#review-timer-button")
    .onclick = () => {

      if (
        $("#review-timer-button")
          .textContent ===
        "START TIMER"
      ) {

        timer.start();

        $("#review-timer-button")
          .textContent =
            "PAUSE TIMER";

      } else if (
        $("#review-timer-button")
          .textContent ===
        "PAUSE TIMER"
      ) {

        timer.pause();

        $("#review-timer-button")
          .textContent =
            "RESUME TIMER";

      } else if (
        $("#review-timer-button")
          .textContent ===
        "RESUME TIMER"
      ) {

        timer.resume();

        $("#review-timer-button")
          .textContent =
            "PAUSE TIMER";
      }
    };

  $("#review-reveal-button")
    .onclick = () => {

      if (revealed) {
        return;
      }

      revealed = true;

      timer.stop();

      const item =
        REVIEW_DATA[round];

      $("#review-poster").src =
        item.poster;

      $("#review-movie-title")
        .textContent = "";

      $("#review-reveal")
        .classList.remove(
          "hidden"
        );

      $("#review-reveal-button")
        .classList.add(
          "hidden"
        );

      $("#review-next-button")
        .classList.remove(
          "hidden"
        );

      playSfx("reveal-sound");

      const controls =
        $(".movie-review-panel .game-controls");

      let scoring =
        $("#review-scoring");

      if (scoring) {
        scoring.remove();
      }

      scoring =
        document.createElement(
          "div"
        );

      scoring.id =
        "review-scoring";

      scoring.className =
        "team-action-buttons";

      activeTeams().forEach(
        (team, index) => {

          const button =
            document.createElement(
              "button"
            );

          button.className =
            "team-button";

          button.dataset.team =
            index + 1;

          button.textContent =
            `${team.name} +10`;

          button.onclick = () => {

            if (
              button.dataset.awarded ===
              "true"
            ) {
              return;
            }

            button.dataset.awarded =
              "true";

            button.disabled = true;

            changeScore(
              index,
              10
            );

            flashCorrect();
          };

          scoring.appendChild(
            button
          );
        }
      );

      controls.parentElement
        .appendChild(scoring);
    };

  $("#review-next-button")
    .onclick = () => {

      $("#review-scoring")
        ?.remove();

      if (round === 9) {

        markGameComplete(
          "movie-reviews"
        );

        returnToHub();

        return;
      }

      round += 1;

      render();
    };

  render();
}


/* ============================================================
   SONG GAME DATA
============================================================ */

const SONG_DATA = [

  {
    category: "WILDCARD",
    title:
      "Never Gonna Give You Up",
    artist:
      "Rick Astley",
    file:
      "assets/audio/songs/Never Gonna Give You Up.mp3"
  },

  {
    category:
      "DIVORCED DAD",
    title:
      "How You Remind Me",
    artist:
      "Nickelback",
    file:
      "assets/audio/songs/How You Remind Me.mp3"
  },

  {
    category:
      "SONGS MUM KNOWS",
    title:
      "Gimme! Gimme! Gimme!",
    artist:
      "ABBA",
    file:
      "assets/audio/songs/Gimme! Gimme! Gimme!.mp3"
  },

  {
    category: "2000s",
    title:
      "Pump It",
    artist:
      "The Black Eyed Peas",
    file:
      "assets/audio/songs/Pump It .mp3"
  },

  {
    category:
      "AUSTRALIAN ANTHEMS",
    title:
      "Beds Are Burning",
    artist:
      "Midnight Oil",
    file:
      "assets/audio/songs/Beds Are Burning.mp3"
  },

  {
    category:
      "CLUB BANGERS",
    title:
      "Low",
    artist:
      "Flo Rida",
    file:
      "assets/audio/songs/Low.mp3"
  },

  {
    category:
      "MOVIE MUSIC",
    title:
      "My Heart Will Go On",
    artist:
      "Céline Dion",
    file:
      "assets/audio/songs/My Heart Will Go On.mp3"
  },

  {
    category:
      "ONE-HIT WONDERS",
    title:
      "Ice Ice Baby",
    artist:
      "Vanilla Ice",
    file:
      "assets/audio/songs/Ice Ice Baby.mp3"
  },

  {
    category:
      "POP CULTURE",
    title:
      "Gangnam Style",
    artist:
      "PSY",
    file:
      "assets/audio/songs/Gangdum Style.mp3"
  },

  {
    category:
      "ROCK CLASSICS",
    title:
      "Whole Lotta Love",
    artist:
      "Led Zeppelin",
    file:
      "assets/audio/songs/Whole Lotta Love.mp3"
  }
];


/* ============================================================
   SONG GAME
============================================================ */

function initialiseSongGame() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "song-game-template"
      )
    );

  let round =
    state.song.round || 0;

  if (round > 9) {
    round = 0;
  }

  let bettingTeam = 0;

  let currentBets = [];

  let selectedWager = null;

  const audio =
    $("#song-game-audio");

  function beginRound() {

    const item =
      SONG_DATA[round];

    currentBets = [];
    bettingTeam = 0;
    selectedWager = null;

    $("#song-round-number")
      .textContent =
        round + 1;

    $("#song-category")
      .textContent =
        item.category;

    $("#song-private-betting")
      .classList.remove(
        "hidden"
      );

    $("#song-play-stage")
      .classList.add(
        "hidden"
      );

    renderBetting();
  }

  function renderBetting() {

    const team =
      state.teams[
        bettingTeam
      ];

    $("#betting-team-name")
      .textContent =
        `${team.name} — PRIVATE WAGER`;

    const track =
      $("#wager-track");

    track.innerHTML = "";

    for (
      let value = 1;
      value <= 10;
      value++
    ) {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "wager-button";

      button.textContent =
        value;

      const used =
        state.song.usedWagers[
          bettingTeam
        ] || [];

      if (used.includes(value)) {

        button.classList.add(
          "used"
        );

        button.disabled = true;
      }

      button.onclick = () => {

        selectedWager = value;

        track
          .querySelectorAll(
            ".wager-button"
          )
          .forEach(b => {
            b.classList.remove(
              "selected"
            );
          });

        button.classList.add(
          "selected"
        );
      };

      track.appendChild(
        button
      );
    }
  }

  $("#lock-wager-button")
    .onclick = () => {

      if (
        selectedWager === null
      ) {

        alert(
          "Choose a wager first."
        );

        return;
      }

      currentBets[
        bettingTeam
      ] = selectedWager;

      state.song.usedWagers[
        bettingTeam
      ] =
        state.song.usedWagers[
          bettingTeam
        ] || [];

      state.song.usedWagers[
        bettingTeam
      ].push(
        selectedWager
      );

      saveState();

      playSfx(
        "lock-in-sound"
      );

      bettingTeam += 1;

      selectedWager = null;

      if (
        bettingTeam <
        state.teamCount
      ) {

        renderBetting();

      } else {

        beginSongStage();
      }
    };

  function beginSongStage() {

    const item =
      SONG_DATA[round];

    $("#song-private-betting")
      .classList.add(
        "hidden"
      );

    $("#song-play-stage")
      .classList.remove(
        "hidden"
      );

    const wagers =
      $("#locked-wagers-display");

    wagers.innerHTML = "";

    activeTeams().forEach(
      (team, index) => {

        const badge =
          document.createElement(
            "div"
          );

        badge.className =
          "team-button";

        badge.dataset.team =
          index + 1;

        badge.textContent =
          `${team.name}: ${currentBets[index]}`;

        wagers.appendChild(
          badge
        );
      }
    );

    audio.src = item.file;

    renderWaveform();

    renderSongScoring();

    $("#song-answer")
      .classList.add(
        "hidden"
      );
  }

  function renderWaveform() {

    const wave =
      $("#audio-waveform");

    wave.innerHTML = "";

    for (
      let i = 0;
      i < 22;
      i++
    ) {

      const bar =
        document.createElement(
          "span"
        );

      bar.className =
        "wave-bar";

      wave.appendChild(
        bar
      );
    }
  }

  $("#play-song-button")
    .onclick = () => {

      audio.currentTime = 0;

      audio.play()
        .catch(() => {});

      $("#vinyl-record")
        .classList.add(
          "spinning"
        );

      $("#audio-waveform")
        .classList.add(
          "playing"
        );
    };

  audio.onended = () => {

    $("#vinyl-record")
      ?.classList.remove(
        "spinning"
      );

    $("#audio-waveform")
      ?.classList.remove(
        "playing"
      );
  };

  function renderSongScoring() {

    const controls =
      $("#song-result-controls");

    controls.innerHTML = "";

    const scored =
      new Set();

    activeTeams().forEach(
      (team, index) => {

        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.style.margin =
          "12px";

        wrapper.innerHTML = `
          <strong>
            ${escapeHtml(team.name)}
            — BET ${currentBets[index]}
          </strong>
        `;

        const full =
          document.createElement(
            "button"
          );

        full.className =
          "correct-button";

        full.textContent =
          "SONG + ARTIST";

        const half =
          document.createElement(
            "button"
          );

        half.className =
          "secondary-button";

        half.textContent =
          "ONE CORRECT";

        const zero =
          document.createElement(
            "button"
          );

        zero.className =
          "wrong-button";

        zero.textContent =
          "WRONG";

        function award(type) {

          if (scored.has(index)) {
            return;
          }

          scored.add(index);

          const max =
            currentBets[index] *
            10;

          let points = 0;

          if (type === "full") {

            points = max;

          } else if (
            type === "half"
          ) {

            points =
              Math.floor(
                (max / 2) /
                10
              ) * 10;
          }

          if (points > 0) {

            changeScore(
              index,
              points
            );

            flashCorrect();

          } else {

            flashWrong();
          }

          full.disabled = true;
          half.disabled = true;
          zero.disabled = true;

          if (
            scored.size ===
            state.teamCount
          ) {

            revealSongAnswer();
          }
        }

        full.onclick =
          () => award("full");

        half.onclick =
          () => award("half");

        zero.onclick =
          () => award("zero");

        wrapper.append(
          document.createElement(
            "br"
          ),
          full,
          half,
          zero
        );

        controls.appendChild(
          wrapper
        );
      }
    );
  }

  function revealSongAnswer() {

    $("#song-answer .song-next-button")
      ?.remove();

    const item =
      SONG_DATA[round];

    $("#song-title")
      .textContent =
        item.title;

    $("#song-artist")
      .textContent =
        item.artist;

    $("#song-answer")
      .classList.remove(
        "hidden"
      );

    const next =
      document.createElement(
        "button"
      );

    next.className =
      "primary-button song-next-button";

    next.textContent =
      round === 9
        ? "FINISH SONG GAME"
        : "NEXT SONG";

    next.onclick = () => {

      audio.pause();

      if (round === 9) {

        state.song.round = 10;

        saveState();

        markGameComplete(
          "song-game"
        );

        returnToHub();

      } else {

        round += 1;

        state.song.round =
          round;

        saveState();

        beginRound();
      }
    };

    $("#song-answer")
      .appendChild(next);
  }

  beginRound();
}


/* ============================================================
   SWITCH TENNIS
============================================================ */

function initialiseTennis() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "switch-tennis-template"
      )
    );

  state.tennis = {
    wins: [0, 0, 0],
    matchIndex: 0
  };

  let matches;

  if (state.teamCount === 2) {

    matches = [
      [0, 1],
      [0, 1],
      [0, 1]
    ];

  } else {

    matches = [
      [0, 1],
      [1, 2],
      [2, 0]
    ];
  }

  function render() {

    const index =
      state.tennis.matchIndex;

    const match =
      matches[index];

    const display =
      $("#tennis-match-display");

    const winButtons =
      $("#tennis-win-buttons");

    winButtons.innerHTML = "";

    if (!match) {

      display.textContent =
        "REGULATION COMPLETE";

      renderStandings();

      return;
    }

    display.innerHTML = `
      MATCH ${index + 1}
      <br><br>
      ${escapeHtml(
        state.teams[
          match[0]
        ].name
      )}
      <br>
      VS
      <br>
      ${escapeHtml(
        state.teams[
          match[1]
        ].name
      )}
    `;

    match.forEach(
      teamIndex => {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "team-button";

        button.dataset.team =
          teamIndex + 1;

        button.textContent =
          `${state.teams[teamIndex].name} WINS`;

        button.onclick = () => {

          state.tennis.wins[
            teamIndex
          ] += 1;

          state.tennis.matchIndex +=
            1;

          saveState();

          render();
        };

        winButtons.appendChild(
          button
        );
      }
    );

    renderStandings();
  }

  function renderStandings() {

    const standings =
      $("#tennis-standings");

    standings.innerHTML =
      "<h3>STANDINGS</h3>";

    activeTeams().forEach(
      (team, index) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "tennis-standing-row";

        row.innerHTML = `
          <span>
            ${escapeHtml(
              team.name
            )}
          </span>

          <strong>
            ${state.tennis.wins[index]}
            WINS
          </strong>
        `;

        standings.appendChild(
          row
        );
      }
    );
  }

  $("#finish-tennis-button")
    .onclick = () => {

      if (
        state.tennis.matchIndex <
        matches.length
      ) {

        alert(
          "Finish the scheduled matches first."
        );

        return;
      }

      const entries =
        activeTeams()
          .map(
            (team, index) => ({
              index,
              wins:
                state.tennis.wins[
                  index
                ]
            })
          );

      const allEqual =
        entries.every(
          entry =>
            entry.wins ===
            entries[0].wins
        );

      if (
        allEqual &&
        state.teamCount === 3
      ) {

        const first =
          prompt(
            "Three-way tie! Run your tennis tiebreak. Enter the WINNING TEAM NUMBER (1, 2 or 3):"
          );

        const winner =
          Number(first) - 1;

        if (
          winner < 0 ||
          winner >= 3
        ) {
          return;
        }

        entries.sort(
          (a, b) => {

            if (
              a.index === winner
            ) {
              return -1;
            }

            if (
              b.index === winner
            ) {
              return 1;
            }

            return (
              b.wins -
              a.wins
            );
          }
        );

      } else {

        entries.sort(
          (a, b) =>
            b.wins -
            a.wins
        );
      }

      const awards =
        state.teamCount === 2
          ? [100, 50]
          : [100, 50, 20];

      entries.forEach(
        (entry, place) => {

          changeScore(
            entry.index,
            awards[place]
          );
        }
      );

      markGameComplete(
        "switch-tennis"
      );

      alert(
        `${state.teams[
          entries[0].index
        ].name} wins King of the Court!`
      );

      returnToHub();
    };

  render();
}


/* ============================================================
   PIXEL MOVIE DATA

   IMPORTANT:
   Game order = most pixelated → clearer → original.
   Your numbered files are reversed here automatically.
============================================================ */

const PIXEL_MOVIES = [

  {
    title: "Pretty Woman",
    images: [
      "assets/images/pixel-movie/Pretty Woman 4.png",
      "assets/images/pixel-movie/Pretty Woman 3.png",
      "assets/images/pixel-movie/Pretty Woman 2.png",
      "assets/images/pixel-movie/Pretty Woman 1.png",
      "assets/images/pixel-movie/Pretty Woman Original.png"
    ]
  },

  {
    title:
      "The Lord of the Rings: The Fellowship of the Ring",
    images: [
      "assets/images/pixel-movie/LOTR 4.png",
      "assets/images/pixel-movie/LOTR 3.png",
      "assets/images/pixel-movie/LOTR 2.png",
      "assets/images/pixel-movie/LOTR 1.png",
      "assets/images/pixel-movie/LOTR Original.png"
    ]
  },

  {
    title:
      "Fantastic Mr. Fox",
    images: [
      "assets/images/pixel-movie/FMF 4.png",
      "assets/images/pixel-movie/FMF 3.png",
      "assets/images/pixel-movie/FMF 2.png",
      "assets/images/pixel-movie/FMF 1.png",
      "assets/images/pixel-movie/FMF Original .png"
    ]
  },

  {
    title:
      "The Dark Knight",
    images: [
      "assets/images/pixel-movie/The Dark Knight 4.png",
      "assets/images/pixel-movie/The Dark Knight 3.png",
      "assets/images/pixel-movie/The Dark Knight 2.png",
      "assets/images/pixel-movie/The Dark Knight 1.png",
      "assets/images/pixel-movie/The Dark Knight Original.png"
    ]
  },

  {
    title:
      "The Matrix",
    images: [
      "assets/images/pixel-movie/Matrix 4.png",
      "assets/images/pixel-movie/Matrix 3.png",
      "assets/images/pixel-movie/Matrix 2.png",
      "assets/images/pixel-movie/Matrix 1.png",
      "assets/images/pixel-movie/Matrix Original .png"
    ]
  },

  {
    title: "Troy",
    images: [
      "assets/images/pixel-movie/Troy4.png",
      "assets/images/pixel-movie/Troy3.png",
      "assets/images/pixel-movie/Troy2.png",
      "assets/images/pixel-movie/Troy1.png",
      "assets/images/pixel-movie/Troy Original.jpeg"
    ]
  },

  {
    title:
      "Tropic Thunder",
    images: [
      "assets/images/pixel-movie/Tropic Thunder 4.png",
      "assets/images/pixel-movie/Tropic Thunder 3.png",
      "assets/images/pixel-movie/Tropic Thunder 2.png",
      "assets/images/pixel-movie/Tropic Thunder  1.png",
      "assets/images/pixel-movie/Tropic Thunder Original.jpeg"
    ]
  },

  {
    title: "Jaws",
    images: [
      "assets/images/pixel-movie/Jaws4.png",
      "assets/images/pixel-movie/Jaws3.png",
      "assets/images/pixel-movie/Jaws2.png",
      "assets/images/pixel-movie/Jaws 1.png",
      "assets/images/pixel-movie/Jaws Original.jpeg"
    ]
  },

  {
    title:
      "Knives Out",
    images: [
      "assets/images/pixel-movie/Knives Out 4.png",
      "assets/images/pixel-movie/Knives Out 3.png",
      "assets/images/pixel-movie/Knives Out 2.png",
      "assets/images/pixel-movie/Knives Out 1.png",
      "assets/images/pixel-movie/Knives Out Original.jpeg"
    ]
  },

  {
    title:
      "The Hunger Games",
    images: [
      "assets/images/pixel-movie/Hunger Games  4.png",
      "assets/images/pixel-movie/Hunger Games  3.png",
      "assets/images/pixel-movie/Hunger Games  2.png",
      "assets/images/pixel-movie/Hunger Games  1.png",
      "assets/images/pixel-movie/Hunger Games Original .png"
    ]
  }
];


/* ============================================================
   PIXEL MOVIE
============================================================ */

function initialisePixelMovie() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "pixel-movie-template"
      )
    );

  let round = 0;
  let stage = 0;

  let locks =
    new Array(
      state.teamCount
    ).fill(null);

  let revealed = false;

  const values =
    [50, 40, 30, 20, 10];

  function render() {

    const movie =
      PIXEL_MOVIES[round];

    $("#pixel-round-number")
      .textContent =
        round + 1;

    $("#pixel-current-value")
      .textContent =
        `${values[stage]} POINTS`;

    $("#pixel-movie-image").src =
      movie.images[stage];

    $("#pixel-final-reveal")
      .classList.add(
        "hidden"
      );

    $("#pixel-clearer-button")
      .disabled =
        stage >= 4;

    renderLockButtons();
  }

  function renderLockButtons() {

    const container =
      $("#pixel-lock-buttons");

    container.innerHTML = "";

    activeTeams().forEach(
      (team, index) => {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "team-button";

        button.dataset.team =
          index + 1;

        if (
          locks[index] !== null
        ) {

          button.textContent =
            `${team.name} LOCKED ${locks[index]}`;

          button.disabled = true;

        } else {

          button.textContent =
            `${team.name} LOCK ${values[stage]}`;

          button.onclick = () => {

            locks[index] =
              values[stage];

            playSfx(
              "lock-in-sound"
            );

            renderLockButtons();
          };
        }

        container.appendChild(
          button
        );
      }
    );
  }

  $("#pixel-clearer-button")
    .onclick = () => {

      if (stage >= 4) {
        return;
      }

      stage += 1;

      render();
    };

  $("#pixel-reveal-button")
    .onclick = () => {

      if (revealed) {
        return;
      }

      revealed = true;

      const movie =
        PIXEL_MOVIES[round];

      $("#pixel-movie-image").src =
        movie.images[4];

      $("#pixel-movie-title")
        .textContent =
          movie.title;

      $("#pixel-final-reveal")
        .classList.remove(
          "hidden"
        );

      $("#pixel-clearer-button")
        .disabled = true;

      $("#pixel-reveal-button")
        .disabled = true;

      renderMarkingButtons();

      playSfx(
        "reveal-sound"
      );
    };

  function renderMarkingButtons() {

    const container =
      $("#pixel-marking-buttons");

    container.innerHTML = "";

    const marked =
      new Set();

    activeTeams().forEach(
      (team, index) => {

        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.className =
          "pixel-mark-row";

        const label =
          document.createElement(
            "span"
          );

        label.textContent =
          locks[index] === null
            ? `${team.name} — DID NOT LOCK`
            : `${team.name} — ${locks[index]} POINTS`;

        const correct =
          document.createElement(
            "button"
          );

        correct.className =
          "correct-button";

        correct.textContent =
          "CORRECT";

        const wrong =
          document.createElement(
            "button"
          );

        wrong.className =
          "wrong-button";

        wrong.textContent =
          "WRONG";

        if (
          locks[index] === null
        ) {
          correct.disabled = true;
          wrong.disabled = true;
          marked.add(index);
        }

        function mark(isCorrect) {

          if (marked.has(index)) {
            return;
          }

          marked.add(index);

          if (isCorrect) {

            changeScore(
              index,
              locks[index]
            );
          }

          correct.disabled = true;
          wrong.disabled = true;

          checkDone();
        }

        correct.onclick =
          () => mark(true);

        wrong.onclick =
          () => mark(false);

        wrapper.append(
          label,
          correct,
          wrong
        );

        container.appendChild(
          wrapper
        );
      }
    );

    function checkDone() {

      if (
        marked.size !==
        state.teamCount
      ) {
        return;
      }

      const next =
        document.createElement(
          "button"
        );

      next.className =
        "primary-button";

      next.textContent =
        round === 9
          ? "FINISH PIXEL MOVIE"
          : "NEXT MOVIE";

      next.onclick = () => {

        if (round === 9) {

          markGameComplete(
            "pixel-movie"
          );

          returnToHub();

          return;
        }

        round += 1;
        stage = 0;
        revealed = false;

        locks =
          new Array(
            state.teamCount
          ).fill(null);

        $("#pixel-reveal-button")
          .disabled = false;

        render();
      };

      container.appendChild(next);
    }

    checkDone();
  }

  render();
}


/* ============================================================
   GEOGUESSR DATA
============================================================ */

const GEO_DATA = [

  {
    name: "Uluru, Northern Territory",
    image:
      "assets/images/geoguessr/1 Uluru.png",
    lat: -25.301444,
    lng: 130.998151
  },

  {
    name: "Niagara Falls, Canada",
    image:
      "assets/images/geoguessr/02 Niagra Falls.png",
    lat: 43.0848518,
    lng: -79.0844662
  },

  {
    name: "Dubai, United Arab Emirates",
    image:
      "assets/images/geoguessr/03 Dubai.png",
    lat: 25.2065062,
    lng: 55.2433251
  },

  {
    name: "Phuket, Thailand",
    image:
      "assets/images/geoguessr/04 Phuket.png",
    lat: 7.893752,
    lng: 98.296152
  },

  {
    name: "Easter Island, Chile",
    image:
      "assets/images/geoguessr/05 Easter Island.png",
    lat: -27.1269102,
    lng: -109.2779372
  },

  {
    name: "Chernobyl / Pripyat, Ukraine",
    image:
      "assets/images/geoguessr/06 Chernobyl.png",
    lat: 51.4020348,
    lng: 30.0523949
  }
];


/* ============================================================
   GEOGUESSR
============================================================ */

function initialiseGeoGuessr() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "geoguessr-template"
      )
    );

  let round = 0;

  let observationTimer = null;

  let map = null;

  let currentTeam = 0;

  let selectedLatLng = null;

  let temporaryMarker = null;

  let guesses = [];

  function renderRound() {

    const location =
      GEO_DATA[round];

    $("#geo-round-number")
      .textContent =
        round + 1;

    $("#geo-mystery-image").src =
      location.image;

    $("#geo-results")
      .classList.add(
        "hidden"
      );

    $("#geo-results")
      .innerHTML = "";

    $("#geo-map-stage")
      .classList.add(
        "hidden"
      );

    $("#geo-observation-controls")
      .classList.remove(
        "hidden"
      );

    $("#geo-start-button")
      .disabled = false;

    $("#geo-begin-guesses-button")
      .disabled = false;

    currentTeam = 0;

    selectedLatLng = null;

    guesses = [];

    observationTimer =
      createCountdown(
        $("#geo-timer"),
        60,
        () => {

          $("#geo-start-button")
            .textContent =
              "TIME UP";
        }
      );
  }

  $("#geo-start-button")
    .onclick = () => {

      observationTimer.reset(60);
      observationTimer.start();

      $("#geo-start-button")
        .textContent =
          "OBSERVING...";
    };

  $("#geo-begin-guesses-button")
    .onclick = () => {

      observationTimer.stop();

      $("#geo-observation-controls")
        .classList.add(
          "hidden"
        );

      $("#geo-map-stage")
        .classList.remove(
          "hidden"
        );

      initialiseMap();
      renderGeoTeam();
    };

  function initialiseMap() {

    if (map) {

      map.remove();
      map = null;
    }

    map = L.map(
      "geoguessr-map",
      {
        worldCopyJump: true
      }
    ).setView(
      [15, 10],
      1
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);

    map.on(
      "click",
      event => {

        selectedLatLng =
          event.latlng;

        if (temporaryMarker) {
          temporaryMarker.remove();
        }

        temporaryMarker =
          L.marker(
            selectedLatLng
          ).addTo(map);
      }
    );

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  function renderGeoTeam() {

    $("#geo-current-team")
      .textContent =
        `${state.teams[currentTeam].name.toUpperCase()} — PLACE YOUR GUESS`;

    selectedLatLng = null;

    if (temporaryMarker) {

      temporaryMarker.remove();

      temporaryMarker = null;
    }

    map.setView(
      [15, 10],
      1
    );
  }

  $("#geo-lock-button")
    .onclick = () => {

      if (!selectedLatLng) {

        alert(
          "Click somewhere on the map first."
        );

        return;
      }

      guesses[currentTeam] = {
        lat:
          selectedLatLng.lat,
        lng:
          selectedLatLng.lng
      };

      playSfx(
        "lock-in-sound"
      );

      currentTeam += 1;

      if (
        currentTeam <
        state.teamCount
      ) {

        renderGeoTeam();

      } else {

        revealGeoResults();
      }
    };

  function distanceKm(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const radius =
      6371;

    const toRad =
      degrees =>
        degrees *
        Math.PI /
        180;

    const dLat =
      toRad(
        lat2 - lat1
      );

    const dLon =
      toRad(
        lon2 - lon1
      );

    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
      Math.cos(
        toRad(lat1)
      ) *
      Math.cos(
        toRad(lat2)
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return radius * c;
  }

  function revealGeoResults() {

    const location =
      GEO_DATA[round];

    $("#geo-current-team")
      .textContent =
        `ANSWER — ${location.name}`;

    if (temporaryMarker) {

      temporaryMarker.remove();

      temporaryMarker = null;
    }

    const actual =
      L.marker(
        [
          location.lat,
          location.lng
        ]
      )
        .addTo(map)
        .bindPopup(
          `ACTUAL: ${location.name}`
        );

    const ranking =
      guesses.map(
        (guess, index) => {

          const distance =
            distanceKm(
              guess.lat,
              guess.lng,
              location.lat,
              location.lng
            );

          const marker =
            L.marker(
              [
                guess.lat,
                guess.lng
              ]
            )
              .addTo(map)
              .bindPopup(
                `${state.teams[index].name}: ${Math.round(distance)} km`
              );

          L.polyline(
            [
              [
                guess.lat,
                guess.lng
              ],
              [
                location.lat,
                location.lng
              ]
            ]
          ).addTo(map);

          return {
            index,
            distance,
            marker
          };
        }
      );

    ranking.sort(
      (a, b) =>
        a.distance -
        b.distance
    );

    const awards =
      state.teamCount === 2
        ? [30, 10]
        : [30, 10, 0];

    ranking.forEach(
      (entry, place) => {

        if (
          awards[place] > 0
        ) {

          changeScore(
            entry.index,
            awards[place]
          );
        }
      }
    );

    const bounds =
      L.latLngBounds(
        [
          [
            location.lat,
            location.lng
          ],
          ...guesses.map(
            guess => [
              guess.lat,
              guess.lng
            ]
          )
        ]
      );

    map.fitBounds(
      bounds,
      {
        padding: [60, 60]
      }
    );

    const results =
      $("#geo-results");

    results.innerHTML = `
      <h3>
        ${escapeHtml(
          location.name
        )}
      </h3>
    `;

    ranking.forEach(
      (entry, place) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "geo-result-row";

        row.innerHTML = `
          <strong>
            ${place + 1}.
            ${escapeHtml(
              state.teams[
                entry.index
              ].name
            )}
          </strong>

          <span>
            ${Math.round(
              entry.distance
            ).toLocaleString()}
            km

            ${
              awards[place] > 0
                ? ` — +${awards[place]}`
                : " — 0"
            }
          </span>
        `;

        results.appendChild(
          row
        );
      }
    );

    const next =
      document.createElement(
        "button"
      );

    next.className =
      "primary-button";

    next.textContent =
      round ===
      GEO_DATA.length - 1
        ? "FINISH GEOGUESSR"
        : "NEXT LOCATION";

    next.onclick = () => {

      map.remove();
      map = null;

      if (
        round ===
        GEO_DATA.length - 1
      ) {

        markGameComplete(
          "geoguessr"
        );

        returnToHub();

        return;
      }

      round += 1;

      renderRound();
    };

    results.appendChild(next);

    results.classList.remove(
      "hidden"
    );

    playSfx(
      "reveal-sound"
    );
  }

  renderRound();
}


/* ============================================================
   FAMILY FEUD DATA
============================================================ */

const FEUD_ROUNDS = [

  {
    multiplier: 1,
    question:
      "We asked 100 married people: Name something you've done to your partner's feet.",

    answers: [
      ["Rubbed them", 50],
      ["Given them a pedicure", 27],
      ["Put socks on / covered them", 8],
      ["Tickled them", 3],
      ["Washed them", 3],
      ["Stepped on them", 2],
      ["Smelled them", 2]
    ]
  },

  {
    multiplier: 1,
    question:
      "Name something in the refrigerator a cheap guy might use in his hair instead of styling gel.",

    answers: [
      ["Mayonnaise", 48],
      ["Butter / margarine", 21],
      ["Oil", 10],
      ["Jelly", 6],
      ["Raw egg", 5],
      ["Whipped cream", 4],
      ["Lard / grease", 3]
    ]
  },

  {
    multiplier: 2,
    question:
      "Name something a doctor might pull out of a person.",

    answers: [
      ["Gerbil", 32],
      ["A baby", 23],
      ["A tumour", 15],
      ["A tooth", 9],
      ["A bullet", 7]
    ]
  },

  {
    multiplier: 3,
    question:
      "Name something Brandon would do on a day off.",

    answers: [
      ["Exercise", 30],
      ["Spend time with family / friends", 24],
      ["Gaming", 18],
      ["Go out for food / drinks", 13],
      ["Play music", 9],
      ["Gardening", 6]
    ]
  }
];


const FAST_MONEY = [

  {
    question:
      "Name something that gets passed around.",

    answers: [
      ["Joint", 34],
      ["Cold", 23],
      ["Collection plate", 12],
      ["Rumour", 9],
      ["Baby", 6]
    ]
  },

  {
    question:
      'Fill in the blank: "Hold the ____."',

    answers: [
      ["Phone", 26],
      ["Door", 14],
      ["Mayo", 10],
      ["Elevator", 9],
      ["Line", 6]
    ]
  },

  {
    question:
      "Name an occasion when you might wear your lucky underwear.",

    answers: [
      ["Hot date", 30],
      ["Job interview", 16],
      ["Casino / gambling", 11],
      ["Sporting event", 9],
      ["Wedding / wedding night", 7],
      ["Anniversary", 5],
      ["Valentine's Day", 4],
      ["Exam / finals", 4]
    ]
  },

  {
    question:
      'Besides the weasel, name something that goes "pop."',

    answers: [
      ["Popcorn", 24],
      ["Rice Krispies", 17],
      ["Balloons", 10],
      ["Pringles", 5],
      ["Bubbles", 4]
    ]
  },

  {
    question:
      "Name something that has holes.",

    answers: [
      ["Swiss cheese", 40],
      ["Clothes / socks", 16],
      ["Alibi / story", 14],
      ["Net / fishing net", 9],
      ["Colander / strainer", 8],
      ["Golf course", 2],
      ["Screen", 2],
      ["Road / street", 2]
    ]
  }
];


/* ============================================================
   FAMILY FEUD
============================================================ */

function initialiseFamilyFeud() {

  $("#game-content")
    .appendChild(
      cloneTemplate(
        "family-feud-template"
      )
    );

  let round = 0;

  let bank = 0;

  let strikes = 0;

  let controllingTeam = 0;

  let bankAwarded = false;

  let revealedAnswers =
    new Set();

  function renderRound() {

    const data =
      FEUD_ROUNDS[round];

    bank = 0;
    strikes = 0;
    bankAwarded = false;

    revealedAnswers =
      new Set();

    $("#feud-round-label")
      .textContent =
        `ROUND ${round + 1} — ${
          data.multiplier === 1
            ? "SINGLE"
            : data.multiplier === 2
              ? "DOUBLE"
              : "TRIPLE"
        } POINTS`;

    $("#feud-question")
      .textContent =
        data.question;

    $("#feud-bank")
      .textContent = 0;

    $("#feud-strikes")
      .textContent = 0;

    renderFeudBoard();
    renderFeudTeamControls();
  }

  function renderFeudBoard() {

    const data =
      FEUD_ROUNDS[round];

    const board =
      $("#feud-board");

    board.innerHTML = "";

    data.answers.forEach(
      (answer, index) => {

        const slot =
          document.createElement(
            "div"
          );

        slot.className =
          "feud-answer-slot";

        const number =
          document.createElement(
            "span"
          );

        number.className =
          "feud-answer-number";

        number.textContent =
          index + 1;

        const button =
          document.createElement(
            "button"
          );

        const points =
          document.createElement(
            "span"
          );

        points.className =
          "feud-answer-points";

        if (
          revealedAnswers.has(index)
        ) {

          button.textContent =
            answer[0];

          points.textContent =
            answer[1] *
            data.multiplier;

        } else {

          button.textContent =
            "████████████";

          points.textContent =
            "";
        }

        button.onclick = () => {

          if (
            revealedAnswers.has(index)
          ) {
            return;
          }

          revealedAnswers.add(index);

          const value =
            answer[1] *
            data.multiplier;

          bank += value;

          $("#feud-bank")
            .textContent =
              bank;

          playSfx(
            "reveal-sound"
          );

          renderFeudBoard();
        };

        slot.append(
          number,
          button,
          points
        );

        board.appendChild(
          slot
        );
      }
    );
  }

  function renderFeudTeamControls() {

    let section =
      $("#feud-team-controls");

    if (!section) {

      section =
        document.createElement(
          "div"
        );

      section.id =
        "feud-team-controls";

      section.className =
        "team-action-buttons";

      $("#feud-question")
        .after(section);
    }

    section.innerHTML =
      "<strong>CONTROLLING TEAM:</strong>";

    activeTeams().forEach(
      (team, index) => {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "team-button";

        button.dataset.team =
          index + 1;

        button.textContent =
          team.name;

        if (
          index ===
          controllingTeam
        ) {
          button.style.boxShadow =
            `0 0 18px ${
              TEAM_COLOURS[index]
            }`;
        }

        button.onclick = () => {

          controllingTeam =
            index;

          renderFeudTeamControls();
        };

        section.appendChild(
          button
        );
      }
    );
  }

  $("#feud-strike-button")
    .onclick = () => {

      strikes += 1;

      $("#feud-strikes")
        .textContent =
          strikes;

      flashWrong();

      if (strikes >= 3) {

        alert(
          "THREE STRIKES — OPEN THE STEAL!"
        );
      }
    };

  $("#feud-play-pass-button")
    .onclick = () => {

      renderFeudTeamControls();
    };

  $("#feud-steal-button")
    .onclick = () => {

      if (bankAwarded) {
        return;
      }

      const options =
        activeTeams()
          .map(
            (team, index) =>
              `${index + 1}: ${team.name}`
          )
          .join("\n");

      const response =
        prompt(
          `Who wins the bank?\n\n${options}\n\nEnter team number.`
        );

      const winner =
        Number(response) - 1;

      if (
        winner < 0 ||
        winner >= state.teamCount
      ) {
        return;
      }

      state.feud.internalScores[
        winner
      ] += bank;

      bankAwarded = true;

      flashCorrect();

      alert(
        `${state.teams[winner].name} wins ${bank} Family Feud points.`
      );
    };

  $("#feud-next-round-button")
    .onclick = () => {

      if (!bankAwarded) {

        state.feud.internalScores[
          controllingTeam
        ] += bank;
      }

      saveState();

      if (round < 3) {

        round += 1;

        renderRound();

      } else {

        finishMainFeud();
      }
    };

  function finishMainFeud() {

    const ranking =
      activeTeams()
        .map(
          (team, index) => ({
            index,
            score:
              state.feud.internalScores[
                index
              ]
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    const awards =
      state.teamCount === 2
        ? [100, 50]
        : [100, 50, 20];

    ranking.forEach(
      (entry, place) => {

        changeScore(
          entry.index,
          awards[place]
        );
      }
    );

    const winner =
      ranking[0].index;

    alert(
      `${state.teams[winner].name} wins Family Feud and advances to FAST MONEY!`
    );

    initialiseFastMoney(
      winner
    );
  }

  function initialiseFastMoney(
    winner
  ) {

    $("#feud-board")
      .classList.add("hidden");

    $(".feud-status")
      ?.classList.add("hidden");

    $(".feud-panel > .game-controls")
      ?.classList.add("hidden");

    $("#feud-question")
      .classList.add("hidden");

    $("#feud-round-label")
      .classList.add("hidden");

    $("#feud-team-controls")
      ?.classList.add("hidden");

    const section =
      $("#fast-money-section");

    section.classList.remove(
      "hidden"
    );

    section.innerHTML = `
      <h2>
        FAST MONEY
      </h2>

      <p>
        ${escapeHtml(
          state.teams[winner].name
        )}
      </p>

      <div
        id="fast-money-timer"
        class="timer-display"
      >
        30
      </div>

      <button
        id="fast-money-start"
        class="primary-button"
        type="button"
      >
        START 30 SEC
      </button>

      <div
        id="fast-money-player"
        class="round-counter"
      >
        PLAYER 1
      </div>

      <div
        id="fast-money-entry"
      ></div>

      <div
        id="fast-money-running-total"
        class="pixel-value"
      >
        TOTAL: 0
      </div>
    `;

    let player = 1;

    let grandTotal = 0;

    let timer =
      createCountdown(
        $("#fast-money-timer"),
        30,
        () => {}
      );

    $("#fast-money-start")
      .onclick = () => {

        timer.reset(30);
        timer.start();
      };

    renderFastMoneyFields();

    function renderFastMoneyFields() {

      const entry =
        $("#fast-money-entry");

      entry.innerHTML = "";

      FAST_MONEY.forEach(
        (question, index) => {

          const box =
            document.createElement(
              "div"
            );

          box.className =
            "review-card";

          box.innerHTML = `
            <strong>
              ${index + 1}.
              ${escapeHtml(
                question.question
              )}
            </strong>

            <p>
              Enter the survey score for the player's answer:
            </p>

            <input
              type="number"
              min="0"
              max="100"
              value="0"
              style="
                width:100px;
                padding:10px;
              "
            >
          `;

          entry.appendChild(
            box
          );
        }
      );

      const reveal =
        document.createElement(
          "button"
        );

      reveal.className =
        "primary-button";

      reveal.textContent =
        `REVEAL PLAYER ${player} SCORES`;

      reveal.onclick = () => {

        timer.stop();

        const values =
          Array.from(
            entry.querySelectorAll(
              "input"
            )
          ).map(
            input =>
              Math.max(
                0,
                Number(
                  input.value
                ) || 0
              )
          );

        reveal.disabled = true;

        let delay = 0;

        values.forEach(
          (value, index) => {

            setTimeout(() => {

              grandTotal += value;

              $("#fast-money-running-total")
                .textContent =
                  `TOTAL: ${grandTotal}`;

              const card =
                entry.children[
                  index
                ];

              const score =
                document.createElement(
                  "div"
                );

              score.className =
                "pixel-value";

              score.textContent =
                value;

              card.appendChild(
                score
              );

              playSfx(
                "reveal-sound"
              );

            }, delay);

            delay += 700;
          }
        );

        setTimeout(() => {

          if (player === 1) {

            player = 2;

            $("#fast-money-player")
              .textContent =
                "PLAYER 2";

            timer.reset(30);

            renderFastMoneyFields();

          } else {

            finishFastMoney();
          }

        }, delay + 500);
      };

      entry.appendChild(
        reveal
      );
    }

    function finishFastMoney() {

      const entry =
        $("#fast-money-entry");

      entry.innerHTML = "";

      const result =
        document.createElement(
          "div"
        );

      result.className =
        "answer-section";

      if (
        grandTotal >= 200
      ) {

        result.innerHTML = `
          <h2>
            FAST MONEY WIN!
          </h2>

          <p>
            ${grandTotal} POINTS
          </p>

          <p>
            +20 OVERALL BONUS
          </p>
        `;

        changeScore(
          winner,
          20
        );

        flashCorrect();

      } else {

        result.innerHTML = `
          <h2>
            ${grandTotal} POINTS
          </h2>

          <p>
            Target: 200
          </p>
        `;
      }

      const finish =
        document.createElement(
          "button"
        );

      finish.className =
        "primary-button";

      finish.textContent =
        "FINISH FAMILY FEUD";

      finish.onclick = () => {

        markGameComplete(
          "family-feud"
        );

        returnToHub();
      };

      result.appendChild(
        finish
      );

      entry.appendChild(
        result
      );
    }
  }

  renderRound();
}


/* ============================================================
   FINAL RESULTS
============================================================ */

function openFinalResults() {

  stopMenuMusic();

  showScreen(
    "final-results-screen"
  );

  $("#podium-first")
    .innerHTML = "";

  $("#podium-second")
    .innerHTML = "";

  $("#podium-third")
    .innerHTML = "";

  $("#final-results-heading")
    .textContent =
      "THE SCORES ARE IN...";

  $("#reveal-results-button")
    .classList.remove(
      "hidden"
    );

  $("#close-game-button")
    .classList.add(
      "hidden"
    );
}

$("#reveal-results-button")
  ?.addEventListener(
    "click",
    beginFinalReveal
  );

function beginFinalReveal() {

  $("#reveal-results-button")
    .classList.add("hidden");

  const rankings =
    activeTeams()
      .map(
        (team, index) => ({
          index,
          name:
            team.name,
          score:
            team.score
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  if (
    state.teamCount === 2
  ) {

    revealPodiumPosition(
      "podium-second",
      rankings[1],
      2
    );

    setTimeout(() => {

      revealWinner(
        rankings[0]
      );

    }, 2500);

    return;
  }

  revealPodiumPosition(
    "podium-third",
    rankings[2],
    3
  );

  setTimeout(() => {

    revealPodiumPosition(
      "podium-second",
      rankings[1],
      2
    );

  }, 2600);

  setTimeout(() => {

    $("#final-results-heading")
      .textContent =
        "WHICH MEANS YOUR UNTITLED GAMES CHAMPIONS ARE...";

  }, 5200);

  setTimeout(() => {

    countdownWinner(
      rankings[0]
    );

  }, 7000);
}

function revealPodiumPosition(
  id,
  team,
  place
) {

  const podium =
    document.getElementById(id);

  if (!podium) {
    return;
  }

  podium.innerHTML = `
    <div class="podium-team">
      ${escapeHtml(team.name)}
    </div>

    <div class="podium-score">
      ${team.score} POINTS
    </div>

    <div>
      ${place === 2
        ? "2ND"
        : "3RD"}
    </div>
  `;

  playSfx(
    place === 3
      ? "applause-small-sound"
      : "applause-medium-sound"
  );
}

function countdownWinner(
  winner
) {

  const heading =
    $("#final-results-heading");

  let number = 3;

  heading.textContent = number;

  const interval =
    setInterval(() => {

      number -= 1;

      if (number > 0) {

        heading.textContent =
          number;

      } else {

        clearInterval(interval);

        revealWinner(
          winner
        );
      }

    }, 900);
}

function revealWinner(
  winner
) {

  $("#final-results-heading")
    .textContent =
      `${winner.name.toUpperCase()}!`;

  const podium =
    $("#podium-first");

  podium.innerHTML = `
    <div class="podium-team">
      ${escapeHtml(
        winner.name
      )}
    </div>

    <div class="podium-score">
      ${winner.score} POINTS
    </div>

    <div>
      CHAMPION
    </div>
  `;

  podium.classList.add(
    "winner-celebration"
  );

  spawnConfetti();

  playSfx(
    "winner-sound"
  );

  setTimeout(() => {

    $("#close-game-button")
      .classList.remove(
        "hidden"
      );

  }, 2200);
}

function spawnConfetti() {

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const piece =
      document.createElement(
        "div"
      );

    piece.className =
      "confetti-piece";

    piece.style.left =
      `${Math.random() * 100}vw`;

    piece.style.background =
      TEAM_COLOURS[
        Math.floor(
          Math.random() *
          TEAM_COLOURS.length
        )
      ];

    piece.style.animationDuration =
      `${2.5 +
      Math.random() * 3}s`;

    piece.style.animationDelay =
      `${Math.random() *
      1.5}s`;

    document.body.appendChild(
      piece
    );

    setTimeout(() => {
      piece.remove();
    }, 7000);
  }
}


/* ============================================================
   CLOSE GAME / CONTINUE
============================================================ */

$("#close-game-button")
  ?.addEventListener(
    "click",
    closeGameSequence
  );

function closeGameSequence() {

  document.body.classList.add(
    "glitching"
  );

  setTimeout(() => {

    document.body.classList.remove(
      "glitching"
    );

    showScreen(
      "continue-screen"
    );

  }, 1600);
}

$("#continue-yes-button")
  ?.addEventListener(
    "click",
    resetEverything
  );

$("#continue-no-button")
  ?.addEventListener(
    "click",
    () => {

      $(".continue-buttons")
        ?.classList.add(
          "hidden"
        );

      $("#continue-text")
        ?.classList.add(
          "hidden"
        );

      $("#thanks-for-playing")
        ?.classList.remove(
          "hidden"
        );

      setTimeout(() => {

        $("#thanks-for-playing")
          .style.opacity = "0";

      }, 4000);
    }
  );


/* ============================================================
   BOOT
============================================================ */

function boot() {

  initialiseSetup();

  initialiseHostControls();

  initialiseMasterScoreButtons();

  initialiseGameHub();

  updateSetupRows();

  updateScoreboards();

  updateHub();

  updateSoundLabels();

  showScreen("title-screen");
}

document.addEventListener(
  "DOMContentLoaded",
  boot
);
