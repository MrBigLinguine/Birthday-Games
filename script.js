/* ============================================================
   MENTAL COMBAT
   Main Game Logic
============================================================ */

"use strict";


/* ============================================================
   CONSTANTS
============================================================ */

const STORAGE_KEY = "mentalCombatStateV1";

const TEAM_COLOURS = [
  "#73c7f5",
  "#d28dbf",
  "#f3c969"
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
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return createDefaultState();
    }

    const parsed =
      JSON.parse(stored);

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

  stopAllMusic();

  localStorage.removeItem(
    STORAGE_KEY
  );

  state =
    createDefaultState();

  location.reload();
}


/* ============================================================
   DOM HELPERS
============================================================ */

function $(selector) {
  return document.querySelector(
    selector
  );
}


function $$(selector) {
  return Array.from(
    document.querySelectorAll(
      selector
    )
  );
}


function showScreen(id) {

  $$(".screen")
    .forEach(screen => {
      screen.classList.remove(
        "active"
      );
    });

  const screen =
    document.getElementById(id);

  if (screen) {
    screen.classList.add(
      "active"
    );
  }
}


function cloneTemplate(id) {

  const template =
    document.getElementById(id);

  if (!template) {
    return null;
  }

  return template.content
    .cloneNode(true);
}


function escapeHtml(value) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ============================================================
   AUDIO HELPERS
============================================================ */

function safePlay(
  audio,
  {
    restart = true
  } = {}
) {

  if (
    !state.soundOn ||
    !audio
  ) {
    return;
  }

  if (restart) {
    try {
      audio.currentTime = 0;
    } catch (error) {
      // Ignore.
    }
  }

  const promise =
    audio.play();

  if (
    promise &&
    typeof promise.catch ===
      "function"
  ) {
    promise.catch(() => {});
  }
}


function playSfx(
  id,
  volume = 0.60
) {

  if (!state.soundOn) {
    return;
  }

  const sound =
    document.getElementById(id);

  if (
    !sound ||
    !sound.getAttribute("src")
  ) {
    return;
  }

  sound.volume =
    volume;

  safePlay(sound);
}


/* ============================================================
   TITLE / TEAM SETUP MUSIC
============================================================ */

function startTitleMusic() {

  const music =
    document.getElementById(
      "title-screen-music"
    );

  if (
    !state.soundOn ||
    !music
  ) {
    return;
  }

  /*
    Quieter background level.

    This plays on:
    - title screen
    - team setup screen

    It does NOT restart when PRESS START
    moves us to team setup.
  */

  music.volume = 0.17;

  safePlay(
    music,
    {
      restart: false
    }
  );
}


function stopTitleMusic(
  {
    reset = false
  } = {}
) {

  const music =
    document.getElementById(
      "title-screen-music"
    );

  if (!music) {
    return;
  }

  music.pause();

  if (reset) {
    music.currentTime = 0;
  }
}


/* ============================================================
   MAIN HUB MUSIC
============================================================ */

function startMenuMusic() {

  const music =
    document.getElementById(
      "menu-music"
    );

  if (
    !state.soundOn ||
    !music
  ) {
    return;
  }

  /*
    Slightly louder than the title/setup music.
  */

  music.volume = 0.24;

  safePlay(
    music,
    {
      restart: false
    }
  );
}


function stopMenuMusic(
  {
    reset = false
  } = {}
) {

  const music =
    document.getElementById(
      "menu-music"
    );

  if (!music) {
    return;
  }

  music.pause();

  if (reset) {
    music.currentTime = 0;
  }
}


/* ============================================================
   FAMILY FEUD MUSIC
============================================================ */

function startFeudMusic() {

  const music =
    document.getElementById(
      "feud-theme-sound"
    );

  if (
    !state.soundOn ||
    !music
  ) {
    return;
  }

  /*
    Background level so Feud DING / STRIKE
    sounds remain stronger.
  */

  music.volume = 0.32;

  safePlay(
    music,
    {
      restart: true
    }
  );
}


function stopFeudMusic(
  {
    reset = true
  } = {}
) {

  const music =
    document.getElementById(
      "feud-theme-sound"
    );

  if (!music) {
    return;
  }

  music.pause();

  if (reset) {
    music.currentTime = 0;
  }
}


/* ============================================================
   STOP ALL BACKGROUND MUSIC
============================================================ */

function stopAllMusic() {

  stopTitleMusic({
    reset: true
  });

  stopMenuMusic({
    reset: true
  });

  stopFeudMusic({
    reset: true
  });

  const songAudio =
    document.getElementById(
      "song-game-audio"
    );

  if (songAudio) {
    songAudio.pause();
    songAudio.currentTime = 0;
  }
}


/* ============================================================
   SOUND TOGGLE
============================================================ */

function setSoundEnabled(enabled) {

  state.soundOn =
    Boolean(enabled);

  if (!state.soundOn) {
    stopAllMusic();
  } else {

    const titleScreen =
      $("#title-screen");

    const setupScreen =
      $("#setup-screen");

    const hubScreen =
      $("#hub-screen");

    if (
      titleScreen?.classList
        .contains("active") ||
      setupScreen?.classList
        .contains("active")
    ) {
      startTitleMusic();
    }

    if (
      hubScreen?.classList
        .contains("active")
    ) {
      startMenuMusic();
    }

    if (
      activeGame ===
      "family-feud"
    ) {
      startFeudMusic();
    }
  }

  saveState();

  updateSoundLabels();
}


function updateSoundLabels() {

  const label =
    state.soundOn
      ? "SOUND ON"
      : "SOUND OFF";

  const master =
    $("#master-sound-toggle");

  const game =
    $("#game-sound-button");

  if (master) {
    master.textContent =
      label;
  }

  if (game) {
    game.textContent =
      label;
  }
}


/* ============================================================
   TEAMS
============================================================ */

function activeTeams() {

  return state.teams.slice(
    0,
    state.teamCount
  );
}


/* ============================================================
   SCORE SYSTEM
============================================================ */

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

  state.teams[teamIndex].score +=
    Number(amount);

  saveState();

  updateScoreboards();
  updateHub();
}


function updateScoreboards() {

  for (
    let index = 0;
    index < 3;
    index++
  ) {

    const team =
      state.teams[index];

    const card =
      document.querySelector(
        `.score-card[data-team="${index + 1}"]`
      );

    if (card) {

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
        name.textContent =
          team.name;
      }

      if (score) {
        score.textContent =
          team.score;
      }
    }
  }

  const scoreboard =
    $("#master-scoreboard");

  if (scoreboard) {

    scoreboard.classList.toggle(
      "two-teams",
      state.teamCount === 2
    );
  }

  renderGameScoreboard();
}


/* ============================================================
   IN-GAME SCOREBOARD
============================================================ */

function renderGameScoreboard() {

  const container =
    $("#game-scoreboard-container");

  if (!container) {
    return;
  }

  if (
    !$("#game-screen")
      ?.classList
      .contains("active")
  ) {
    container.innerHTML = "";
    return;
  }

  const scoreboard =
    document.createElement("div");

  scoreboard.className =
    "scoreboard";

  if (state.teamCount === 2) {
    scoreboard.classList.add(
      "two-teams"
    );
  }

  activeTeams()
    .forEach(
      (team, index) => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          `score-card team-${index + 1}-card`;

        card.dataset.team =
          index + 1;

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

        scoreboard.appendChild(
          card
        );
      }
    );

  container.innerHTML = "";

  container.appendChild(
    scoreboard
  );

  container
    .querySelectorAll(
      ".manual-score-button"
    )
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
   GAME COMPLETION
============================================================ */

function markGameComplete(
  gameId
) {

  state.completedGames[
    gameId
  ] = true;

  saveState();

  updateHub();
}


function completedGameCount() {

  return GAME_IDS
    .filter(
      gameId =>
        state.completedGames[
          gameId
        ]
    )
    .length;
}


/* ============================================================
   HUB RENDERING
============================================================ */

function updateHub() {

  const completed =
    completedGameCount();

  const counter =
    $("#games-complete-counter");

  if (counter) {
    counter.textContent =
      `${completed} / ${GAME_IDS.length} COMPLETE`;
  }

  $$(".game-card")
    .forEach(card => {

      const id =
        card.dataset.game;

      card.classList.toggle(
        "complete",
        Boolean(
          state.completedGames[id]
        )
      );
    });

  const finalButton =
    $("#final-results-button");

  if (finalButton) {

    finalButton.disabled =
      completed <
      GAME_IDS.length;
  }
}


/* ============================================================
   CORRECT / WRONG FEEDBACK
============================================================ */

function flashCorrect() {

  if (
    activeGame ===
    "family-feud"
  ) {

    playSfx(
      "feud-ding-sound",
      0.64
    );

  } else {

    playSfx(
      "correct-sound",
      0.62
    );
  }


  /*
    Only these games receive the giant
    full-screen colour flash.
  */

  const visualGames = [
    "pub-trivia",
    "category-trivia",
    "family-feud"
  ];

  if (
    !visualGames.includes(
      activeGame
    )
  ) {
    return;
  }

  document.body.classList
    .remove(
      "wrong-flash"
    );

  document.body.classList
    .add(
      "correct-flash"
    );

  setTimeout(
    () => {

      document.body.classList
        .remove(
          "correct-flash"
        );

    },
    650
  );
}


function flashWrong() {

  if (
    activeGame ===
    "family-feud"
  ) {

    playSfx(
      "feud-strike-sound",
      0.66
    );

  } else {

    playSfx(
      "wrong-sound",
      0.62
    );
  }


  const visualGames = [
    "pub-trivia",
    "category-trivia",
    "family-feud"
  ];

  if (
    !visualGames.includes(
      activeGame
    )
  ) {
    return;
  }

  document.body.classList
    .remove(
      "correct-flash"
    );

  document.body.classList
    .add(
      "wrong-flash"
    );

  setTimeout(
    () => {

      document.body.classList
        .remove(
          "wrong-flash"
        );

    },
    650
  );
}


/* ============================================================
   GENERIC COUNTDOWN TIMER
============================================================ */

function makeTimer({
  duration,
  element,
  onFinish = null
}) {

  let remaining =
    duration;

  let intervalId =
    null;

  let paused =
    false;


  function render() {

    if (!element) {
      return;
    }

    element.textContent =
      remaining;

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


  function stop() {

    if (intervalId) {

      clearInterval(
        intervalId
      );

      intervalId = null;
    }
  }


  function finish() {

    stop();

    remaining = 0;

    render();

    playSfx(
      "time-up-sound",
      0.65
    );

    if (
      typeof onFinish ===
      "function"
    ) {
      onFinish();
    }
  }


  function start() {

    if (intervalId) {
      return;
    }

    paused = false;

    intervalId =
      setInterval(
        () => {

          if (paused) {
            return;
          }

          remaining -= 1;

          if (
            remaining === 10
          ) {

            playSfx(
              "timer-warning-sound",
              0.58
            );
          }

          if (
            remaining <= 0
          ) {
            finish();
            return;
          }

          render();

        },
        1000
      );
  }


  function pause() {

    paused = true;
  }


  function resume() {

    paused = false;
  }


  function reset(
    value = duration
  ) {

    stop();

    remaining =
      value;

    paused =
      false;

    render();
  }


  render();


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
   INITIAL PAGE SETUP
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initialiseTitleScreen();

    initialiseTeamSetup();

    initialiseHostControls();

    initialiseMasterScoreButtons();

    initialiseGameHub();

    initialiseFinalResults();

    updateScoreboards();

    updateHub();

    updateSoundLabels();


    /*
      Browsers often block autoplay until
      the first user interaction.

      We try immediately, then also unlock
      music on the first interaction.
    */

    startTitleMusic();


    const unlockAudio =
      () => {

        if (
          $("#title-screen")
            ?.classList
            .contains("active") ||
          $("#setup-screen")
            ?.classList
            .contains("active")
        ) {
          startTitleMusic();
        }

        document.removeEventListener(
          "pointerdown",
          unlockAudio
        );

        document.removeEventListener(
          "keydown",
          unlockAudio
        );
      };


    document.addEventListener(
      "pointerdown",
      unlockAudio,
      {
        once: true
      }
    );

    document.addEventListener(
      "keydown",
      unlockAudio,
      {
        once: true
      }
    );
  }
);


/* ============================================================
   TITLE SCREEN
============================================================ */

function initialiseTitleScreen() {

  const button =
    $("#press-start-button");

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {

      /*
        START SFX plays over the title music.

        IMPORTANT:
        title music DOES NOT stop here.
      */

      playSfx(
        "game-start-sound",
        0.76
      );

      startTitleMusic();

      showScreen(
        "setup-screen"
      );

      initialiseSetupFields();
    }
  );
}


/* ============================================================
   TEAM SETUP
============================================================ */

function initialiseTeamSetup() {

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
            .forEach(item => {

              item.classList.toggle(
                "selected",
                item === button
              );
            });

          updateSetupTeamVisibility();

          saveState();
        }
      );
    });


  const startButton =
    $("#start-game-button");

  if (startButton) {

    startButton.addEventListener(
      "click",
      () => {

        saveTeamNamesFromSetup();


        /*
          Second START sound.

          It plays BEFORE title/setup
          music stops.
        */

        playSfx(
          "game-start-sound",
          0.76
        );


        /*
          Now leave title/setup music.
        */

        stopTitleMusic({
          reset: false
        });


        updateScoreboards();

        updateHub();

        showScreen(
          "hub-screen"
        );


        /*
          Main menu music is slightly louder
          than title/setup music.
        */

        startMenuMusic();
      }
    );
  }
}


function initialiseSetupFields() {

  const buttons =
    $$(".team-count-button");

  buttons.forEach(
    button => {

      const count =
        Number(
          button.dataset.teamCount
        );

      button.classList.toggle(
        "selected",
        count === state.teamCount
      );
    }
  );


  state.teams.forEach(
    (team, index) => {

      const input =
        document.getElementById(
          `team-name-${index + 1}`
        );

      if (input) {
        input.value =
          team.name;
      }
    }
  );


  updateSetupTeamVisibility();
}


function updateSetupTeamVisibility() {

  for (
    let index = 0;
    index < 3;
    index++
  ) {

    const row =
      document.querySelector(
        `.team-name-row[data-team="${index + 1}"]`
      );

    if (!row) {
      continue;
    }

    row.style.display =
      index < state.teamCount
        ? ""
        : "none";
  }
}


function saveTeamNamesFromSetup() {

  for (
    let index = 0;
    index < state.teamCount;
    index++
  ) {

    const input =
      document.getElementById(
        `team-name-${index + 1}`
      );

    if (!input) {
      continue;
    }

    const value =
      input.value.trim();

    state.teams[index].name =
      value ||
      `Team ${index + 1}`;
  }


  saveState();
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
          ?.classList.add(
            "hidden"
          );
      }
    );


  $("#host-modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "host-modal"
        ) {

          $("#host-modal")
            .classList.add(
              "hidden"
            );
        }
      }
    );


  $("#master-sound-toggle")
    ?.addEventListener(
      "click",
      () => {

        setSoundEnabled(
          !state.soundOn
        );
      }
    );


  $("#game-sound-button")
    ?.addEventListener(
      "click",
      () => {

        setSoundEnabled(
          !state.soundOn
        );
      }
    );


  $("#reset-game-button")
    ?.addEventListener(
      "click",
      () => {

        $("#host-modal")
          ?.classList.add(
            "hidden"
          );

        $("#reset-confirmation-modal")
          ?.classList.remove(
            "hidden"
          );
      }
    );


  $("#cancel-reset-button")
    ?.addEventListener(
      "click",
      () => {

        $("#reset-confirmation-modal")
          ?.classList.add(
            "hidden"
          );
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

  if (!controls) {
    return;
  }

  controls.innerHTML = "";


  activeTeams()
    .forEach(
      (team, index) => {

        const row =
          document.createElement(
            "div"
          );

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
          row.querySelector(
            "input"
          );


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


        controls.appendChild(
          row
        );
      }
    );


  $("#host-modal")
    ?.classList.remove(
      "hidden"
    );


  updateSoundLabels();
}


/* ============================================================
   MASTER SCORE BUTTONS
============================================================ */

function initialiseMasterScoreButtons() {

  $$(".manual-score-button")
    .forEach(
      button => {

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
      }
    );
}


/* ============================================================
   GAME HUB
============================================================ */

function initialiseGameHub() {

  $$(".game-card")
    .forEach(
      card => {

        card.addEventListener(
          "click",
          () => {

            const gameId =
              card.dataset.game;

            openGame(
              gameId
            );
          }
        );
      }
    );


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


/* ============================================================
   OPEN GAME
============================================================ */

function openGame(gameId) {

  activeGame =
    gameId;


  /*
    Stop main hub music.
  */

  stopMenuMusic({
    reset: false
  });


  /*
    Every game gets the game-open sound.
  */

  playSfx(
    "game-open-sound",
    0.62
  );


  /*
    Family Feud additionally gets
    its own looping theme.
  */

  if (
    gameId ===
    "family-feud"
  ) {

    startFeudMusic();
  }


  const title =
    document.querySelector(
      `.game-card[data-game="${gameId}"] .game-card-title`
    )?.textContent ||
    "GAME";


  const heading =
    $("#current-game-title");

  if (heading) {
    heading.textContent =
      title;
  }


  showScreen(
    "game-screen"
  );


  renderGameScoreboard();


  const container =
    $("#game-content");

  if (!container) {
    return;
  }


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


    default:

      console.warn(
        "Unknown game:",
        gameId
      );

      returnToHub();

      break;
  }
}


/* ============================================================
   RETURN TO HUB
============================================================ */

function returnToHub() {

  /*
    Stop any game-specific audio first.
  */

  stopFeudMusic({
    reset: true
  });


  const songAudio =
    document.getElementById(
      "song-game-audio"
    );

  if (songAudio) {

    songAudio.pause();

    songAudio.currentTime = 0;
  }


  activeGame = null;


  showScreen(
    "hub-screen"
  );


  updateHub();

  updateScoreboards();


  /*
    Return main menu music without
    unnecessarily starting from zero.
  */

  startMenuMusic();
}
/* ============================================================
   PUB TRIVIA DATA
============================================================ */

const PUB_QUESTIONS = [
  {
    q:
      "What is the maximum possible score in a standard game of ten-pin bowling?",
    a:
      "300",
    why:
      "A perfect game is 12 consecutive strikes, producing a score of 300."
  },

  {
    q:
      "Which continent lies in all four hemispheres?",
    a:
      "Africa",
    why:
      "The Equator and the Prime Meridian both pass through Africa."
  },

  {
    q:
      "Which artist created the Campbell's Soup Cans artwork?",
    a:
      "Andy Warhol",
    why:
      "Andy Warhol's Campbell's Soup Cans became one of the defining works of American Pop Art."
  },

  {
    q:
      "Which chemical element has the symbol Au?",
    a:
      "Gold",
    why:
      "Au comes from the Latin word aurum, meaning gold."
  },

  {
    q:
      "Which Shakespeare play opens with three witches meeting during thunder and lightning?",
    a:
      "Macbeth",
    why:
      "Macbeth opens with the Weird Sisters planning their next meeting."
  },

  {
    q:
      "Who was the first Roman emperor?",
    a:
      "Augustus",
    why:
      "Augustus became Rome's first emperor after the fall of the Roman Republic."
  },

  {
    q:
      "Which rock band took its name from a brand of sewing machine?",
    a:
      "The White Stripes",
    why:
      "The name was influenced by Meg White's interest in peppermint candy and the band's surname rather than a sewing-machine brand."
  },

  {
    q:
      "Which berry is traditionally used to flavour gin?",
    a:
      "Juniper berry",
    why:
      "Juniper is the defining botanical flavour of gin."
  },

  {
    q:
      "Which Australian animal has fingerprints remarkably similar to humans?",
    a:
      "Koala",
    why:
      "Koalas have fingerprints that can appear strikingly similar to human fingerprints."
  },

  {
    q:
      "What is the name of the fishing technique where an artificial fly is used as bait?",
    a:
      "Fly fishing",
    why:
      "Fly fishing uses an artificial fly cast with specialised line and tackle."
  }
];


/* ============================================================
   PUB TRIVIA
============================================================ */

function initialisePubTrivia() {

  const container =
    $("#game-content");

  const fragment =
    cloneTemplate(
      "pub-trivia-template"
    );

  if (
    !container ||
    !fragment
  ) {
    return;
  }

  container.appendChild(
    fragment
  );


  let questionIndex = 0;


  function showQuestion() {

    const item =
      PUB_QUESTIONS[
        questionIndex
      ];


    $("#pub-question-number")
      .textContent =
      questionIndex + 1;


    $("#pub-question")
      .textContent =
      item.q;


    $("#pub-answer")
      .textContent =
      item.a;


    $("#pub-explanation")
      .textContent =
      item.why;


    $("#pub-answer-section")
      .classList.add(
        "hidden"
      );


    $("#pub-reveal-button")
      .classList.remove(
        "hidden"
      );


    $("#pub-next-button")
      .classList.add(
        "hidden"
      );
  }


  $("#pub-reveal-button")
    .onclick =
    () => {

      $("#pub-answer-section")
        .classList.remove(
          "hidden"
        );


      $("#pub-reveal-button")
        .classList.add(
          "hidden"
        );


      $("#pub-next-button")
        .classList.remove(
          "hidden"
        );


      playSfx(
        "reveal-sound",
        0.58
      );
    };


  $("#pub-next-button")
    .onclick =
    () => {

      if (
        questionIndex ===
        PUB_QUESTIONS.length - 1
      ) {

        markGameComplete(
          "pub-trivia"
        );

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
    category:
      "GEOGRAPHY",

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
    category:
      "ENTERTAINMENT",

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
    category:
      "HISTORY",

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
          "Who painted The Persistence of Memory?",

        a:
          "Salvador Dalí",

        why:
          "Salvador Dalí painted the surrealist work, famous for its melting clocks, in 1931.",

        image:
          "assets/images/salvador dali.jpeg"
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
      "SCIENCE & NATURE",

    questions: [

      {
        value: 10,

        q:
          "What gas do plants absorb from the atmosphere during photosynthesis?",

        a:
          "Carbon dioxide",

        why:
          "Plants use carbon dioxide, water and light energy to produce glucose during photosynthesis."
      },

      {
        value: 20,

        q:
          "What is the largest organ in the human body?",

        a:
          "The skin",

        why:
          "The skin is the body's largest organ by surface area and overall mass."
      },

      {
        value: 30,

        q:
          "What is the boundary around a black hole beyond which nothing can escape called?",

        a:
          "The event horizon",

        why:
          "The event horizon marks the point beyond which escape would require travelling faster than light."
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
  }
];


/* ============================================================
   CATEGORY TRIVIA
============================================================ */

function initialiseCategoryTrivia() {

  const container =
    $("#game-content");

  const fragment =
    cloneTemplate(
      "category-trivia-template"
    );

  if (
    !container ||
    !fragment
  ) {
    return;
  }

  container.appendChild(
    fragment
  );


  let currentQuestion = null;

  let currentCategoryIndex =
    null;

  let currentQuestionIndex =
    null;

  let currentTeamIndex =
    state.category.currentTurn %
    state.teamCount;

  let answerTimer =
    null;

  let stealTimer =
    null;

  let stealTeamIndex =
    null;


  function tileKey(
    categoryIndex,
    questionIndex
  ) {

    return (
      `${categoryIndex}-${questionIndex}`
    );
  }


  function renderBoard() {

    const board =
      $("#category-board");

    const questionView =
      $("#category-question-view");


    questionView
      .classList.add(
        "hidden"
      );


    board
      .classList.remove(
        "hidden"
      );


    board.innerHTML = "";


    CATEGORY_DATA.forEach(
      (
        category,
        categoryIndex
      ) => {

        const column =
          document.createElement(
            "div"
          );

        column.className =
          "category-column";


        const heading =
          document.createElement(
            "div"
          );

        heading.className =
          "category-name";

        heading.textContent =
          category.category;


        column.appendChild(
          heading
        );


        category.questions.forEach(
          (
            question,
            questionIndex
          ) => {

            const button =
              document.createElement(
                "button"
              );

            button.type =
              "button";

            button.className =
              "category-tile";

            button.textContent =
              question.value;


            const key =
              tileKey(
                categoryIndex,
                questionIndex
              );


            if (
              state.category.tiles[
                key
              ]
            ) {

              button.classList.add(
                "used"
              );
            }


            button.addEventListener(
              "click",
              () => {

                if (
                  state.category.tiles[
                    key
                  ]
                ) {
                  return;
                }


                currentCategoryIndex =
                  categoryIndex;

                currentQuestionIndex =
                  questionIndex;

                currentQuestion =
                  question;


                openQuestion();
              }
            );


            column.appendChild(
              button
            );
          }
        );


        board.appendChild(
          column
        );
      }
    );
  }


  function openQuestion() {

    const board =
      $("#category-board");

    const questionView =
      $("#category-question-view");


    board
      .classList.add(
        "hidden"
      );


    questionView
      .classList.remove(
        "hidden"
      );


    currentTeamIndex =
      state.category.currentTurn %
      state.teamCount;


    $("#category-turn-indicator")
      .textContent =
      `${state.teams[currentTeamIndex].name}'S QUESTION`;


    $("#category-question")
      .textContent =
      currentQuestion.q;


    $("#category-answer")
      .textContent =
      currentQuestion.a;


    $("#category-explanation")
      .textContent =
      currentQuestion.why;


    renderCategoryImage();


    $("#category-answer-section")
      .classList.add(
        "hidden"
      );


    $("#category-steal-panel")
      .classList.add(
        "hidden"
      );


    $("#category-host-controls")
      .classList.remove(
        "hidden"
      );


    answerTimer =
      makeTimer({
        duration: 30,
        element:
          $("#category-timer")
      });


    answerTimer.start();
  }


  function renderCategoryImage() {

    const wrapper =
      $("#category-question-image-wrap");

    const image =
      $("#category-question-image");


    if (
      !wrapper ||
      !image
    ) {
      return;
    }


    if (
      currentQuestion.image
    ) {

      image.src =
        currentQuestion.image;

      image.alt =
        currentQuestion.q;

      wrapper.classList
        .remove(
          "hidden"
        );

    } else {

      image.removeAttribute(
        "src"
      );

      wrapper.classList
        .add(
          "hidden"
        );
    }
  }


  function markCurrentTileUsed() {

    if (
      currentCategoryIndex ===
        null ||
      currentQuestionIndex ===
        null
    ) {
      return;
    }


    const key =
      tileKey(
        currentCategoryIndex,
        currentQuestionIndex
      );


    state.category.tiles[
      key
    ] = true;


    saveState();
  }


  function advanceTurn() {

    state.category.currentTurn =
      (
        state.category.currentTurn +
        1
      ) %
      state.teamCount;


    saveState();
  }


  function finishQuestion() {

    if (answerTimer) {
      answerTimer.stop();
    }

    if (stealTimer) {
      stealTimer.stop();
    }


    markCurrentTileUsed();

    advanceTurn();


    if (
      categoryIsComplete()
    ) {

      markGameComplete(
        "category-trivia"
      );

      returnToHub();

      return;
    }


    renderBoard();
  }


  function categoryIsComplete() {

    const totalQuestions =
      CATEGORY_DATA.reduce(
        (
          total,
          category
        ) =>
          total +
          category.questions.length,
        0
      );


    const usedQuestions =
      Object.values(
        state.category.tiles
      )
      .filter(Boolean)
      .length;


    return (
      usedQuestions >=
      totalQuestions
    );
  }


  function revealAnswer() {

    if (answerTimer) {
      answerTimer.stop();
    }


    $("#category-answer-section")
      .classList.remove(
        "hidden"
      );


    playSfx(
      "reveal-sound",
      0.58
    );
  }


  function correctAnswer() {

    if (answerTimer) {
      answerTimer.stop();
    }


    changeScore(
      currentTeamIndex,
      currentQuestion.value
    );


    flashCorrect();

    finishQuestion();
  }


  function beginSteal() {

    if (answerTimer) {
      answerTimer.stop();
    }


    flashWrong();


    $("#category-host-controls")
      .classList.add(
        "hidden"
      );


    $("#category-steal-panel")
      .classList.remove(
        "hidden"
      );


    renderStealButtons();


    stealTimer =
      makeTimer({
        duration: 15,

        element:
          $("#category-steal-timer"),

        onFinish:
          () => {

            finishQuestion();
          }
      });


    stealTimer.start();
  }


  function renderStealButtons() {

    const container =
      $("#category-steal-team-buttons");


    container.innerHTML = "";


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          if (
            index ===
            currentTeamIndex
          ) {
            return;
          }


          const button =
            document.createElement(
              "button"
            );

          button.className =
            "team-button";

          button.type =
            "button";

          button.textContent =
            team.name;


          button.addEventListener(
            "click",
            () => {

              stealTeamIndex =
                index;


              playSfx(
                "team-buzz-sound",
                0.62
              );


              Array.from(
                container.children
              )
              .forEach(
                child => {

                  child.disabled =
                    true;
                }
              );


              button.disabled =
                false;


              button.style
                .borderColor =
                "white";
            }
          );


          container.appendChild(
            button
          );
        }
      );


    const correct =
      document.createElement(
        "button"
      );

    correct.className =
      "correct-button";

    correct.type =
      "button";

    correct.textContent =
      "STEAL CORRECT";


    correct.addEventListener(
      "click",
      () => {

        if (
          stealTeamIndex ===
          null
        ) {
          return;
        }


        if (stealTimer) {
          stealTimer.stop();
        }


        changeScore(
          stealTeamIndex,
          currentQuestion.value
        );


        flashCorrect();

        finishQuestion();
      }
    );


    const wrong =
      document.createElement(
        "button"
      );

    wrong.className =
      "wrong-button";

    wrong.type =
      "button";

    wrong.textContent =
      "NO STEAL";


    wrong.addEventListener(
      "click",
      () => {

        if (stealTimer) {
          stealTimer.stop();
        }


        if (
          stealTeamIndex !==
          null
        ) {
          flashWrong();
        }


        finishQuestion();
      }
    );


    container.appendChild(
      correct
    );

    container.appendChild(
      wrong
    );
  }


  $("#category-correct-button")
    .onclick =
    correctAnswer;


  $("#category-wrong-button")
    .onclick =
    beginSteal;


  $("#category-reveal-button")
    .onclick =
    revealAnswer;


  renderBoard();
}
/* ============================================================
   WHO'S THAT DATA
============================================================ */

const WHOS_THAT_DATA = [
  {
    name: "Round 1",
    image:
      "assets/images/whos-that/1.png"
  },
  {
    name: "Round 2",
    image:
      "assets/images/whos-that/2.png"
  },
  {
    name: "Round 3",
    image:
      "assets/images/whos-that/3.png"
  },
  {
    name: "Round 4",
    image:
      "assets/images/whos-that/4.png"
  },
  {
    name: "Round 5",
    image:
      "assets/images/whos-that/5.png"
  },
  {
    name: "Round 6",
    image:
      "assets/images/whos-that/6.png"
  },
  {
    name: "Round 7",
    image:
      "assets/images/whos-that/7.png"
  },
  {
    name: "Round 8",
    image:
      "assets/images/whos-that/8.png"
  },
  {
    name: "Round 9",
    image:
      "assets/images/whos-that/9.png"
  },
  {
    name: "Round 10",
    image:
      "assets/images/whos-that/10.png"
  }
];


/* ============================================================
   WHO'S THAT
============================================================ */

function initialiseWhosThat() {

  const container =
    $("#game-content");

  const fragment =
    cloneTemplate(
      "whos-that-template"
    );

  if (
    !container ||
    !fragment
  ) {
    return;
  }

  container.appendChild(
    fragment
  );


  let round = 0;

  let buzzedTeam =
    null;

  let timer =
    null;


  function renderRound() {

    const item =
      WHOS_THAT_DATA[
        round
      ];


    $("#whos-round-number")
      .textContent =
      round + 1;


    $("#whos-image")
      .src =
      item.image;


    $("#whos-reveal-name")
      .textContent =
      item.name;


    $("#whos-reveal-name")
      .classList.add(
        "hidden"
      );


    $("#whos-next-button")
      .classList.add(
        "hidden"
      );


    buzzedTeam =
      null;


    renderTeamButtons();


    timer =
      makeTimer({
        duration: 30,
        element:
          $("#whos-timer")
      });


    timer.start();
  }


  function renderTeamButtons() {

    const holder =
      $("#whos-team-buttons");

    holder.innerHTML = "";


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          const button =
            document.createElement(
              "button"
            );

          button.className =
            "team-button";

          button.type =
            "button";

          button.textContent =
            team.name;


          button.addEventListener(
            "click",
            () => {

              if (
                buzzedTeam !==
                null
              ) {
                return;
              }


              buzzedTeam =
                index;


              playSfx(
                "team-buzz-sound",
                0.62
              );


              Array.from(
                holder.children
              )
              .forEach(
                child => {

                  child.disabled =
                    true;
                }
              );


              button.disabled =
                false;


              button.style
                .borderColor =
                "white";
            }
          );


          holder.appendChild(
            button
          );
        }
      );
  }


  $("#whos-pause-button")
    .onclick =
    () => {

      if (!timer) {
        return;
      }


      if (
        timer.paused
      ) {

        timer.resume();

        $("#whos-pause-button")
          .textContent =
          "PAUSE";

      } else {

        timer.pause();

        $("#whos-pause-button")
          .textContent =
          "RESUME";
      }
    };


  $("#whos-correct-button")
    .onclick =
    () => {

      if (
        buzzedTeam ===
        null
      ) {
        return;
      }


      timer?.stop();


      changeScore(
        buzzedTeam,
        10
      );


      flashCorrect();


      $("#whos-reveal-name")
        .classList.remove(
          "hidden"
        );


      $("#whos-next-button")
        .classList.remove(
          "hidden"
        );
    };


  $("#whos-wrong-button")
    .onclick =
    () => {

      if (
        buzzedTeam ===
        null
      ) {
        return;
      }


      flashWrong();


      buzzedTeam =
        null;


      renderTeamButtons();
    };


  $("#whos-reveal-button")
    .onclick =
    () => {

      timer?.stop();


      $("#whos-reveal-name")
        .classList.remove(
          "hidden"
        );


      $("#whos-next-button")
        .classList.remove(
          "hidden"
        );


      playSfx(
        "reveal-sound",
        0.58
      );
    };


  $("#whos-next-button")
    .onclick =
    () => {

      if (
        round ===
        WHOS_THAT_DATA.length - 1
      ) {

        markGameComplete(
          "whos-that"
        );


        returnToHub();

        return;
      }


      round += 1;

      renderRound();
    };


  renderRound();
}


/* ============================================================
   MOVIE REVIEWS DATA
============================================================ */

const REVIEW_DATA = [
  {
    stars: "★☆☆☆☆",

    review:
      "Absolutely terrible. Everyone just keeps running around and screaming.",

    author:
      "1-star review",

    title:
      "Movie 1",

    poster:
      "assets/images/movie-reviews/1.jpg"
  },

  {
    stars: "★★☆☆☆",

    review:
      "The main character made every possible bad decision and somehow survived.",

    author:
      "2-star review",

    title:
      "Movie 2",

    poster:
      "assets/images/movie-reviews/2.jpg"
  },

  {
    stars: "★☆☆☆☆",

    review:
      "Way too long. Could have been solved in five minutes if anyone communicated.",

    author:
      "1-star review",

    title:
      "Movie 3",

    poster:
      "assets/images/movie-reviews/3.jpg"
  },

  {
    stars: "★★☆☆☆",

    review:
      "A lot of explosions for something that made very little sense.",

    author:
      "2-star review",

    title:
      "Movie 4",

    poster:
      "assets/images/movie-reviews/4.jpg"
  },

  {
    stars: "★☆☆☆☆",

    review:
      "I don't understand why everyone loves this. The villain was more interesting.",

    author:
      "1-star review",

    title:
      "Movie 5",

    poster:
      "assets/images/movie-reviews/5.jpg"
  },

  {
    stars: "★★☆☆☆",

    review:
      "This could have been an email.",

    author:
      "2-star review",

    title:
      "Movie 6",

    poster:
      "assets/images/movie-reviews/6.jpg"
  },

  {
    stars: "★☆☆☆☆",

    review:
      "Nothing about this situation felt safe or reasonable.",

    author:
      "1-star review",

    title:
      "Movie 7",

    poster:
      "assets/images/movie-reviews/7.jpg"
  },

  {
    stars: "★★☆☆☆",

    review:
      "Too many characters and I couldn't remember half their names.",

    author:
      "2-star review",

    title:
      "Movie 8",

    poster:
      "assets/images/movie-reviews/8.jpg"
  },

  {
    stars: "★☆☆☆☆",

    review:
      "Everyone desperately needed therapy.",

    author:
      "1-star review",

    title:
      "Movie 9",

    poster:
      "assets/images/movie-reviews/9.jpg"
  },

  {
    stars: "★★☆☆☆",

    review:
      "I watched the whole thing and I'm still not sure what the plan was.",

    author:
      "2-star review",

    title:
      "Movie 10",

    poster:
      "assets/images/movie-reviews/10.jpg"
  }
];


/* ============================================================
   MOVIE REVIEWS
============================================================ */

function initialiseMovieReviews() {

  const container =
    $("#game-content");

  const fragment =
    cloneTemplate(
      "movie-reviews-template"
    );

  if (
    !container ||
    !fragment
  ) {
    return;
  }

  container.appendChild(
    fragment
  );


  let round = 0;

  let revealed =
    false;

  let timer =
    null;


  function render() {

    revealed =
      false;


    const item =
      REVIEW_DATA[
        round
      ];


    $("#review-round-number")
      .textContent =
      round + 1;


    $("#review-stars")
      .textContent =
      item.stars;


    $("#review-text")
      .textContent =
      item.review;


    $("#review-author")
      .textContent =
      item.author;


    $("#review-reveal")
      .classList.add(
        "hidden"
      );


    $("#review-reveal-button")
      .classList.remove(
        "hidden"
      );


    $("#review-next-button")
      .classList.add(
        "hidden"
      );


    $("#review-scoring")
      ?.remove();


    $("#review-timer-button")
      .textContent =
      "START TIMER";


    timer =
      makeTimer({
        duration: 30,

        element:
          $("#review-timer"),

        onFinish:
          () => {

            $("#review-timer-button")
              .textContent =
              "PENS DOWN";
          }
      });
  }


  $("#review-timer-button")
    .onclick =
    () => {

      const button =
        $("#review-timer-button");


      if (
        button.textContent ===
        "START TIMER"
      ) {

        timer.start();

        button.textContent =
          "PAUSE TIMER";

      } else if (
        button.textContent ===
        "PAUSE TIMER"
      ) {

        timer.pause();

        button.textContent =
          "RESUME TIMER";

      } else if (
        button.textContent ===
        "RESUME TIMER"
      ) {

        timer.resume();

        button.textContent =
          "PAUSE TIMER";
      }
    };


  $("#review-reveal-button")
    .onclick =
    () => {

      if (revealed) {
        return;
      }


      revealed =
        true;


      timer.stop();


      const item =
        REVIEW_DATA[
          round
        ];


      $("#review-poster")
        .src =
        item.poster;


      $("#review-movie-title")
        .textContent =
        item.title;


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


      playSfx(
        "reveal-sound",
        0.58
      );


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


      activeTeams()
        .forEach(
          (
            team,
            index
          ) => {

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


            button.onclick =
              () => {

                if (
                  button.dataset.awarded ===
                  "true"
                ) {
                  return;
                }


                button.dataset.awarded =
                  "true";


                button.disabled =
                  true;


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
        .appendChild(
          scoring
        );
    };


  $("#review-next-button")
    .onclick =
    () => {

      $("#review-scoring")
        ?.remove();


      if (
        round ===
        REVIEW_DATA.length - 1
      ) {

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
    category:
      "WILDCARD",

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
      "assets/audio/songs/Gimme Gimme Gimme.mp3"
  },

  {
    category:
      "2000s",

    title:
      "Pump It",

    artist:
      "The Black Eyed Peas",

    file:
      "assets/audio/songs/Pump It.mp3"
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
      "Celine Dion",

    file:
      "assets/audio/songs/My Heart Will Go On.mp3"
  },

  {
    category:
      "ONE HIT WONDERS",

    title:
      "Mambo No. 5",

    artist:
      "Lou Bega",

    file:
      "assets/audio/songs/Mambo No. 5.mp3"
  },

  {
    category:
      "POP CULTURE",

    title:
      "Gangnam Style",

    artist:
      "PSY",

    file:
      "assets/audio/songs/Gangnam Style.mp3"
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

  const container =
    $("#game-content");

  const fragment =
    cloneTemplate(
      "song-game-template"
    );

  if (
    !container ||
    !fragment
  ) {
    return;
  }

  container.appendChild(
    fragment
  );


  let round =
    state.song.round || 0;


  if (
    round >=
    SONG_DATA.length
  ) {
    round = 0;
  }


  let bettingTeam = 0;

  let selectedWager =
    null;

  let currentBets =
    [];

  let buzzedTeam =
    null;


  const audio =
    $("#song-game-audio");


  /* ------------------------------------------------------------
     START ROUND
  ------------------------------------------------------------ */

  function beginRound() {

    const item =
      SONG_DATA[round];


    currentBets = [];

    bettingTeam = 0;

    selectedWager =
      null;

    buzzedTeam =
      null;


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


    $("#song-round-controls")
      .classList.add(
        "hidden"
      );


    $("#song-answer")
      .classList.add(
        "hidden"
      );


    $("#song-next-button")
      .classList.add(
        "hidden"
      );


    if (audio) {

      audio.pause();

      audio.currentTime = 0;

      audio.src =
        item.file;

      audio.volume =
        0.72;

      audio.load();
    }


    renderBetting();
  }


  /* ------------------------------------------------------------
     WAGER SELECTION
  ------------------------------------------------------------ */

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


      button.type =
        "button";


      button.className =
        "wager-button";


      button.textContent =
        value;


      const used =
        state.song
          .usedWagers[
            bettingTeam
          ] || [];


      if (
        used.includes(
          value
        )
      ) {

        button.classList.add(
          "used"
        );

        button.disabled =
          true;
      }


      button.onclick =
        () => {

          selectedWager =
            value;


          track
            .querySelectorAll(
              ".wager-button"
            )
            .forEach(
              item => {

                item.classList
                  .remove(
                    "selected"
                  );
              }
            );


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
    .onclick =
    () => {

      if (
        selectedWager ===
        null
      ) {

        alert(
          "Choose a wager first."
        );

        return;
      }


      currentBets[
        bettingTeam
      ] =
        selectedWager;


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
        "lock-in-sound",
        0.58
      );


      bettingTeam += 1;


      selectedWager =
        null;


      if (
        bettingTeam <
        state.teamCount
      ) {

        renderBetting();

      } else {

        beginSongStage();
      }
    };


  /* ------------------------------------------------------------
     SONG STAGE
  ------------------------------------------------------------ */

  function beginSongStage() {

    $("#song-private-betting")
      .classList.add(
        "hidden"
      );


    $("#song-round-controls")
      .classList.remove(
        "hidden"
      );


    renderSongTeamButtons();
  }


  /* ------------------------------------------------------------
     PLAY SONG
  ------------------------------------------------------------ */

  function playSongClip() {

    if (!audio) {
      return;
    }


    audio.currentTime = 0;


    safePlay(
      audio,
      {
        restart: false
      }
    );
  }


  $("#song-play-button")
    .onclick =
    playSongClip;


  $("#song-replay-button")
    .onclick =
    playSongClip;


  /* ------------------------------------------------------------
     BUZZ BUTTONS
  ------------------------------------------------------------ */

  function renderSongTeamButtons() {

    const holder =
      $("#song-team-buttons");


    holder.innerHTML = "";


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "team-button";


          button.textContent =
            `${team.name} BUZZ`;


          button.onclick =
            () => {

              if (
                buzzedTeam !==
                null
              ) {
                return;
              }


              buzzedTeam =
                index;


              playSfx(
                "team-buzz-sound",
                0.62
              );


              if (audio) {
                audio.pause();
              }


              Array.from(
                holder.children
              )
              .forEach(
                child => {

                  child.disabled =
                    true;
                }
              );


              button.disabled =
                false;


              button.style
                .borderColor =
                "white";


              showSongMarkingButtons(
                index
              );
            };


          holder.appendChild(
            button
          );
        }
      );
  }


  /* ------------------------------------------------------------
     MARK ANSWER
  ------------------------------------------------------------ */

  function showSongMarkingButtons(
    teamIndex
  ) {

    $("#song-mark-controls")
      ?.remove();


    const holder =
      document.createElement(
        "div"
      );


    holder.id =
      "song-mark-controls";


    holder.className =
      "game-controls";


    const correct =
      document.createElement(
        "button"
      );


    correct.type =
      "button";


    correct.className =
      "correct-button";


    correct.textContent =
      "CORRECT";


    const wrong =
      document.createElement(
        "button"
      );


    wrong.type =
      "button";


    wrong.className =
      "wrong-button";


    wrong.textContent =
      "WRONG";


    correct.onclick =
      () => {

        /*
          Wagers 1–10 become
          10–100 scoreboard points.
        */

        const points =
          currentBets[
            teamIndex
          ] * 10;


        changeScore(
          teamIndex,
          points
        );


        flashCorrect();


        revealSongAnswer();
      };


    wrong.onclick =
      () => {

        flashWrong();


        buzzedTeam =
          null;


        holder.remove();


        renderSongTeamButtons();
      };


    holder.append(
      correct,
      wrong
    );


    $("#song-round-controls")
      .appendChild(
        holder
      );
  }


  /* ------------------------------------------------------------
     REVEAL
  ------------------------------------------------------------ */

  $("#song-reveal-button")
    .onclick =
    revealSongAnswer;


  function revealSongAnswer() {

    if (audio) {
      audio.pause();
    }


    $("#song-mark-controls")
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


    $("#song-next-button")
      .classList.remove(
        "hidden"
      );


    playSfx(
      "reveal-sound",
      0.58
    );
  }


  /* ------------------------------------------------------------
     NEXT SONG
  ------------------------------------------------------------ */

  $("#song-next-button")
    .onclick =
    () => {

      if (audio) {

        audio.pause();

        audio.currentTime = 0;
      }


      if (
        round ===
        SONG_DATA.length - 1
      ) {

        state.song.round =
          SONG_DATA.length;


        saveState();


        markGameComplete(
          "song-game"
        );


        returnToHub();

        return;
      }


      round += 1;


      state.song.round =
        round;


      saveState();


      beginRound();
    };


  beginRound();
}


/* ============================================================
   SWITCH TENNIS
============================================================ */

function initialiseTennis() {

  const container =
    $("#game-content");


  const fragment =
    cloneTemplate(
      "switch-tennis-template"
    );


  if (
    !container ||
    !fragment
  ) {
    return;
  }


  container.appendChild(
    fragment
  );


  /*
    Tennis is treated as its own
    small tournament.

    2 teams:
    best of three matches.

    3 teams:
    round robin.
  */


  state.tennis = {
    wins:
      [0, 0, 0],

    matchIndex:
      0
  };


  let matches;


  if (
    state.teamCount === 2
  ) {

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
      state.tennis
        .matchIndex;


    if (
      index >=
      matches.length
    ) {

      renderFinalStandings();

      return;
    }


    const [
      teamA,
      teamB
    ] =
      matches[index];


    $("#tennis-matchup")
      .innerHTML = `
        ${escapeHtml(
          state.teams[
            teamA
          ].name
        )}

        <span>
          VS
        </span>

        ${escapeHtml(
          state.teams[
            teamB
          ].name
        )}
      `;


    renderWinnerButtons(
      teamA,
      teamB
    );


    renderStandings();
  }


  /* ------------------------------------------------------------
     WINNER BUTTONS
  ------------------------------------------------------------ */

  function renderWinnerButtons(
    teamA,
    teamB
  ) {

    const holder =
      $("#tennis-winner-buttons");


    holder.innerHTML = "";


    [
      teamA,
      teamB
    ]
    .forEach(
      teamIndex => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "team-button";


        button.textContent =
          `${state.teams[
            teamIndex
          ].name} WON`;


        button.onclick =
          () => {

            state.tennis
              .wins[
                teamIndex
              ] += 1;


            state.tennis
              .matchIndex += 1;


            /*
              Tennis winner gets +10
              on the overall scoreboard
              for each match.
            */

            changeScore(
              teamIndex,
              10
            );


            flashCorrect();


            saveState();


            render();
          };


        holder.appendChild(
          button
        );
      }
    );
  }


  /* ------------------------------------------------------------
     STANDINGS
  ------------------------------------------------------------ */

  function renderStandings() {

    const holder =
      $("#tennis-standings");


    holder.innerHTML = "";


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          const row =
            document.createElement(
              "div"
            );


          row.className =
            "tennis-standing-row";


          row.innerHTML = `
            <div class="tennis-standing-team">
              ${escapeHtml(
                team.name
              )}
            </div>

            <div class="tennis-standing-wins">
              ${
                state.tennis
                  .wins[
                    index
                  ]
              }
              WIN${
                state.tennis
                  .wins[
                    index
                  ] === 1
                  ? ""
                  : "S"
              }
            </div>
          `;


          holder.appendChild(
            row
          );
        }
      );
  }


  /* ------------------------------------------------------------
     TOURNAMENT COMPLETE
  ------------------------------------------------------------ */

  function renderFinalStandings() {

    $("#tennis-matchup")
      .textContent =
      "TOURNAMENT COMPLETE";


    $("#tennis-winner-buttons")
      .innerHTML =
      "";


    renderStandings();


    $("#finish-tennis-button")
      .classList.remove(
        "hidden"
      );
  }


  $("#finish-tennis-button")
    .onclick =
    () => {

      markGameComplete(
        "switch-tennis"
      );


      returnToHub();
    };


  /*
    Hide until matches are finished.
  */

  $("#finish-tennis-button")
    .classList.add(
      "hidden"
    );


  render();
}
/* ============================================================
   PIXEL MOVIE DATA

   Order:
   1. Pretty Woman
   2. The Lord of the Rings: The Fellowship of the Ring
   3. Fantastic Mr. Fox
   4. The Dark Knight
   5. The Matrix
   6. Troy
   7. Tropic Thunder
   8. Jaws
   9. Knives Out
   10. The Hunger Games

   Image order:
   most pixelated → clearer → original
============================================================ */

const PIXEL_MOVIES = [

  {
    title:
      "Pretty Woman",

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
    title:
      "Troy",

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
    title:
      "Jaws",

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

  const container =
    $("#game-content");


  const fragment =
    cloneTemplate(
      "pixel-movie-template"
    );


  if (
    !container ||
    !fragment
  ) {
    return;
  }


  container.appendChild(
    fragment
  );


  let round =
    state.pixel.round || 0;


  if (
    round >=
    PIXEL_MOVIES.length
  ) {
    round = 0;
  }


  let stage = 0;

  let revealed =
    false;


  /*
    Each team locks in at whatever
    point value is currently showing.

    Once locked, that team cannot
    change its wager/value.
  */

  let locks =
    new Array(
      state.teamCount
    ).fill(null);


  const values = [
    50,
    40,
    30,
    20,
    10
  ];


/* ------------------------------------------------------------
   RENDER ROUND
------------------------------------------------------------ */

  function render() {

    const movie =
      PIXEL_MOVIES[
        round
      ];


    $("#pixel-round-number")
      .textContent =
      round + 1;


    $("#pixel-current-value")
      .textContent =
      `${values[stage]} POINTS`;


    $("#pixel-movie-image")
      .src =
      movie.images[
        stage
      ];


    $("#pixel-movie-image")
      .alt =
      `Pixel Movie round ${round + 1}`;


    $("#pixel-final-reveal")
      .classList.add(
        "hidden"
      );


    $("#pixel-clearer-button")
      .disabled =
      stage >=
      values.length - 1;


    renderLockButtons();
  }


/* ------------------------------------------------------------
   LOCK BUTTONS
------------------------------------------------------------ */

  function renderLockButtons() {

    const holder =
      $("#pixel-lock-buttons");


    holder.innerHTML = "";


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "team-button";


          button.dataset.team =
            index + 1;


          if (
            locks[index] !==
            null
          ) {

            button.textContent =
              `${team.name} — LOCKED ${locks[index]}`;


            button.disabled =
              true;

          } else {

            button.textContent =
              `${team.name} — LOCK ${values[stage]}`;


            button.onclick =
              () => {

                locks[index] =
                  values[stage];


                playSfx(
                  "lock-in-sound",
                  0.58
                );


                renderLockButtons();
              };
          }


          holder.appendChild(
            button
          );
        }
      );
  }


/* ------------------------------------------------------------
   REVEAL MORE
------------------------------------------------------------ */

  $("#pixel-clearer-button")
    .onclick =
    () => {

      if (
        stage >=
        values.length - 1
      ) {
        return;
      }


      stage += 1;


      playSfx(
        "reveal-sound",
        0.52
      );


      render();
    };


/* ------------------------------------------------------------
   FULL REVEAL
------------------------------------------------------------ */

  $("#pixel-reveal-button")
    .onclick =
    () => {

      if (revealed) {
        return;
      }


      revealed =
        true;


      const movie =
        PIXEL_MOVIES[
          round
        ];


      /*
        Always show the original image
        on the final reveal.
      */

      $("#pixel-movie-image")
        .src =
        movie.images[
          movie.images.length - 1
        ];


      $("#pixel-movie-title")
        .textContent =
        movie.title;


      $("#pixel-final-reveal")
        .classList.remove(
          "hidden"
        );


      $("#pixel-clearer-button")
        .disabled =
        true;


      $("#pixel-reveal-button")
        .disabled =
        true;


      $("#pixel-lock-buttons")
        .querySelectorAll(
          "button"
        )
        .forEach(
          button => {

            button.disabled =
              true;
          }
        );


      playSfx(
        "reveal-sound",
        0.58
      );


      renderMarkingButtons();
    };


/* ------------------------------------------------------------
   MARK EACH TEAM
------------------------------------------------------------ */

  function renderMarkingButtons() {

    const holder =
      $("#pixel-marking-buttons");


    holder.innerHTML = "";


    const marked =
      new Set();


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

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


          if (
            locks[index] ===
            null
          ) {

            label.textContent =
              `${team.name} — DID NOT LOCK`;

          } else {

            label.textContent =
              `${team.name} — ${locks[index]} POINTS`;
          }


          const correct =
            document.createElement(
              "button"
            );


          correct.type =
            "button";


          correct.className =
            "correct-button";


          correct.textContent =
            "CORRECT";


          const wrong =
            document.createElement(
              "button"
            );


          wrong.type =
            "button";


          wrong.className =
            "wrong-button";


          wrong.textContent =
            "WRONG";


          /*
            If a team never locked,
            there is nothing to score.
          */

          if (
            locks[index] ===
            null
          ) {

            correct.disabled =
              true;


            wrong.disabled =
              true;


            marked.add(
              index
            );
          }


          function mark(
            isCorrect
          ) {

            if (
              marked.has(
                index
              )
            ) {
              return;
            }


            marked.add(
              index
            );


            if (isCorrect) {

              changeScore(
                index,
                locks[index]
              );


              /*
                Pixel Movie gets sound feedback,
                but NOT the giant green screen flash.
              */

              flashCorrect();

            } else {

              flashWrong();
            }


            correct.disabled =
              true;


            wrong.disabled =
              true;


            checkDone();
          }


          correct.onclick =
            () => {

              mark(true);
            };


          wrong.onclick =
            () => {

              mark(false);
            };


          wrapper.append(
            label,
            correct,
            wrong
          );


          holder.appendChild(
            wrapper
          );
        }
      );


    checkDone();


/* ------------------------------------------------------------
   NEXT ROUND
------------------------------------------------------------ */

    function checkDone() {

      if (
        marked.size !==
        state.teamCount
      ) {
        return;
      }


      /*
        Avoid creating more than one
        NEXT MOVIE button.
      */

      if (
        $("#pixel-next-round-button")
      ) {
        return;
      }


      const next =
        document.createElement(
          "button"
        );


      next.id =
        "pixel-next-round-button";


      next.type =
        "button";


      next.className =
        "primary-button";


      next.textContent =
        round ===
        PIXEL_MOVIES.length - 1

          ? "FINISH PIXEL MOVIE"

          : "NEXT MOVIE";


      next.onclick =
        () => {

          if (
            round ===
            PIXEL_MOVIES.length - 1
          ) {

            state.pixel.round =
              PIXEL_MOVIES.length;


            saveState();


            markGameComplete(
              "pixel-movie"
            );


            returnToHub();

            return;
          }


          round += 1;


          state.pixel.round =
            round;


          saveState();


          stage = 0;


          revealed =
            false;


          locks =
            new Array(
              state.teamCount
            ).fill(null);


          $("#pixel-reveal-button")
            .disabled =
            false;


          $("#pixel-clearer-button")
            .disabled =
            false;


          render();
        };


      holder.appendChild(
        next
      );
    }
  }


  render();
}
/* ============================================================
   GEOGUESSR DATA
============================================================ */

const GEO_DATA = [

  {
    name:
      "Uluru, Northern Territory",

    image:
      "assets/images/geoguessr/1 Uluru.png",

    lat:
      -25.301444,

    lng:
      130.998151
  },


  {
    name:
      "Niagara Falls, Canada",

    image:
      "assets/images/geoguessr/02 Niagra Falls.png",

    lat:
      43.0848518,

    lng:
      -79.0844662
  },


  {
    name:
      "Dubai, United Arab Emirates",

    image:
      "assets/images/geoguessr/03 Dubai.png",

    lat:
      25.2065062,

    lng:
      55.2433251
  },


  {
    name:
      "Phuket, Thailand",

    image:
      "assets/images/geoguessr/04 Phuket.png",

    lat:
      7.893752,

    lng:
      98.296152
  },


  {
    name:
      "Easter Island, Chile",

    image:
      "assets/images/geoguessr/05 Easter Island.png",

    lat:
      -27.1269102,

    lng:
      -109.2779372
  },


  {
    name:
      "Chernobyl / Pripyat, Ukraine",

    image:
      "assets/images/geoguessr/06 Chernobyl.png",

    lat:
      51.4020348,

    lng:
      30.0523949
  }

];


/* ============================================================
   GEOGUESSR
============================================================ */

function initialiseGeoGuessr() {

  const container =
    $("#game-content");


  const fragment =
    cloneTemplate(
      "geoguessr-template"
    );


  if (
    !container ||
    !fragment
  ) {
    return;
  }


  container.appendChild(
    fragment
  );


  let round =
    state.geo.round || 0;


  if (
    round >=
    GEO_DATA.length
  ) {
    round = 0;
  }


  let observationTimer =
    null;

  let map =
    null;

  let currentTeam =
    0;

  let selectedLatLng =
    null;

  let temporaryMarker =
    null;

  let guesses =
    [];


/* ------------------------------------------------------------
   RENDER ROUND
------------------------------------------------------------ */

  function renderRound() {

    const location =
      GEO_DATA[
        round
      ];


    $("#geo-round-number")
      .textContent =
      round + 1;


    $("#geo-mystery-image")
      .src =
      location.image;


    $("#geo-mystery-image")
      .alt =
      `Mystery location ${round + 1}`;


    $("#geo-results")
      .classList.add(
        "hidden"
      );


    $("#geo-results")
      .innerHTML =
      "";


    $("#geo-map-stage")
      .classList.add(
        "hidden"
      );


    $("#geo-observation-controls")
      .classList.remove(
        "hidden"
      );


    $("#geo-next-button")
      .classList.add(
        "hidden"
      );


    $("#geo-start-button")
      .disabled =
      false;


    $("#geo-start-button")
      .textContent =
      "START 60 SEC";


    $("#geo-begin-guesses-button")
      .disabled =
      false;


    currentTeam =
      0;


    selectedLatLng =
      null;


    guesses =
      [];


    if (map) {

      map.remove();

      map =
        null;
    }


    observationTimer =
      makeTimer({

        duration:
          60,

        element:
          $("#geo-timer"),

        onFinish:
          () => {

            $("#geo-start-button")
              .textContent =
              "TIME UP";
          }
      });
  }


/* ------------------------------------------------------------
   START OBSERVATION TIMER
------------------------------------------------------------ */

  $("#geo-start-button")
    .onclick =
    () => {

      observationTimer
        ?.reset(
          60
        );


      observationTimer
        ?.start();


      $("#geo-start-button")
        .textContent =
        "OBSERVING...";
    };


/* ------------------------------------------------------------
   BEGIN MAP GUESSES
------------------------------------------------------------ */

  $("#geo-begin-guesses-button")
    .onclick =
    () => {

      observationTimer
        ?.stop();


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


/* ------------------------------------------------------------
   MAP
------------------------------------------------------------ */

  function initialiseMap() {

    if (map) {

      map.remove();

      map =
        null;
    }


    map =
      L.map(
        "geoguessr-map",
        {
          worldCopyJump:
            true
        }
      )
      .setView(
        [15, 10],
        1
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {

        maxZoom:
          19,

        attribution:
          "&copy; OpenStreetMap contributors"
      }
    )
    .addTo(
      map
    );


    map.on(
      "click",
      event => {

        selectedLatLng =
          event.latlng;


        if (
          temporaryMarker
        ) {

          temporaryMarker
            .remove();
        }


        temporaryMarker =
          L.marker(
            selectedLatLng
          )
          .addTo(
            map
          );
      }
    );


    setTimeout(
      () => {

        map.invalidateSize();

      },
      100
    );
  }


/* ------------------------------------------------------------
   CURRENT TEAM
------------------------------------------------------------ */

  function renderGeoTeam() {

    $("#geo-current-team")
      .textContent =
      `${state.teams[currentTeam].name.toUpperCase()} — PLACE YOUR GUESS`;


    selectedLatLng =
      null;


    if (
      temporaryMarker
    ) {

      temporaryMarker
        .remove();


      temporaryMarker =
        null;
    }


    map.setView(
      [15, 10],
      1
    );
  }


/* ------------------------------------------------------------
   LOCK GUESS
------------------------------------------------------------ */

  $("#geo-lock-button")
    .onclick =
    () => {

      if (
        !selectedLatLng
      ) {

        alert(
          "Click somewhere on the map first."
        );

        return;
      }


      guesses[
        currentTeam
      ] = {

        lat:
          selectedLatLng.lat,

        lng:
          selectedLatLng.lng
      };


      playSfx(
        "lock-in-sound",
        0.58
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


/* ------------------------------------------------------------
   DISTANCE
------------------------------------------------------------ */

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
      Math.sin(
        dLat / 2
      ) *
      Math.sin(
        dLat / 2
      ) +

      Math.cos(
        toRad(lat1)
      ) *

      Math.cos(
        toRad(lat2)
      ) *

      Math.sin(
        dLon / 2
      ) *

      Math.sin(
        dLon / 2
      );


    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(
          1 - a
        )
      );


    return (
      radius *
      c
    );
  }


/* ------------------------------------------------------------
   RESULTS
------------------------------------------------------------ */

  function revealGeoResults() {

    const location =
      GEO_DATA[
        round
      ];


    $("#geo-current-team")
      .textContent =
      `ANSWER — ${location.name}`;


    if (
      temporaryMarker
    ) {

      temporaryMarker
        .remove();


      temporaryMarker =
        null;
    }


    L.marker(
      [
        location.lat,
        location.lng
      ]
    )
    .addTo(
      map
    )
    .bindPopup(
      `ACTUAL: ${location.name}`
    )
    .openPopup();


    const ranking =
      guesses.map(
        (
          guess,
          index
        ) => {

          const distance =
            distanceKm(
              guess.lat,
              guess.lng,
              location.lat,
              location.lng
            );


          L.marker(
            [
              guess.lat,
              guess.lng
            ]
          )
          .addTo(
            map
          )
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
          )
          .addTo(
            map
          );


          return {

            index,

            distance
          };
        }
      );


    ranking.sort(
      (
        a,
        b
      ) =>
        a.distance -
        b.distance
    );


    /*
      Existing scoring:

      3 teams:
      1st +30
      2nd +10
      3rd 0

      2 teams:
      1st +30
      2nd +10
    */

    const awards =
      state.teamCount === 2

        ? [30, 10]

        : [30, 10, 0];


    ranking.forEach(
      (
        entry,
        place
      ) => {

        if (
          awards[place] >
          0
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
        padding:
          [60, 60]
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
      (
        entry,
        place
      ) => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "geo-result-row";


        row.innerHTML = `
          <div class="geo-result-name">
            ${place + 1}.
            ${escapeHtml(
              state.teams[
                entry.index
              ].name
            )}
          </div>

          <div class="geo-result-distance">
            ${Math.round(
              entry.distance
            ).toLocaleString()}
            km
          </div>

          <div class="geo-result-points">
            ${
              awards[place] > 0
                ? `+${awards[place]}`
                : "0"
            }
          </div>
        `;


        results.appendChild(
          row
        );
      }
    );


    results.classList
      .remove(
        "hidden"
      );


    $("#geo-lock-button")
      .disabled =
      true;


    $("#geo-next-button")
      .classList.remove(
        "hidden"
      );


    playSfx(
      "reveal-sound",
      0.58
    );
  }


/* ------------------------------------------------------------
   NEXT LOCATION
------------------------------------------------------------ */

  $("#geo-next-button")
    .onclick =
    () => {

      if (
        round ===
        GEO_DATA.length - 1
      ) {

        state.geo.round =
          GEO_DATA.length;


        saveState();


        markGameComplete(
          "geoguessr"
        );


        if (map) {

          map.remove();

          map =
            null;
        }


        returnToHub();

        return;
      }


      round += 1;


      state.geo.round =
        round;


      saveState();


      renderRound();
    };


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


/* ============================================================
   FAST MONEY DATA
============================================================ */

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

  const container =
    $("#game-content");


  const fragment =
    cloneTemplate(
      "family-feud-template"
    );


  if (
    !container ||
    !fragment
  ) {
    return;
  }


  container.appendChild(
    fragment
  );


  /*
    Internal Feud scores are separate from
    the main Mental Combat scoreboard until
    the standard Feud rounds are finished.
  */

  state.feud.internalScores =
    new Array(
      3
    ).fill(0);


  let round = 0;

  let bank = 0;

  let strikes = 0;

  let controllingTeam = 0;

  let bankAwarded = false;

  let revealedAnswers =
    new Set();


/* ------------------------------------------------------------
   ROUND
------------------------------------------------------------ */

  function renderRound() {

    const data =
      FEUD_ROUNDS[
        round
      ];


    bank = 0;

    strikes = 0;

    bankAwarded =
      false;


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
      .textContent =
      "0";


    $("#feud-strikes")
      .textContent =
      "0";


    $("#feud-next-round-button")
      .textContent =
      round ===
      FEUD_ROUNDS.length - 1
        ? "FINISH MAIN GAME"
        : "NEXT ROUND";


    renderFeudBoard();

    renderFeudTeamControls();
  }


/* ------------------------------------------------------------
   ANSWER BOARD
------------------------------------------------------------ */

  function renderFeudBoard() {

    const data =
      FEUD_ROUNDS[
        round
      ];


    const board =
      $("#feud-board");


    board.innerHTML =
      "";


    data.answers.forEach(
      (
        answer,
        index
      ) => {

        const slot =
          document.createElement(
            "div"
          );


        slot.className =
          "feud-answer";


        const number =
          document.createElement(
            "div"
          );


        number.className =
          "feud-answer-number";


        number.textContent =
          index + 1;


        const text =
          document.createElement(
            "button"
          );


        text.type =
          "button";


        text.className =
          "feud-answer-text";


        const points =
          document.createElement(
            "div"
          );


        points.className =
          "feud-answer-points";


        if (
          revealedAnswers.has(
            index
          )
        ) {

          slot.classList.add(
            "revealed"
          );


          text.textContent =
            answer[0];


          points.textContent =
            answer[1] *
            data.multiplier;

        } else {

          slot.classList.add(
            "hidden-answer"
          );


          text.textContent =
            "";
        }


        text.onclick =
          () => {

            if (
              revealedAnswers.has(
                index
              )
            ) {
              return;
            }


            revealedAnswers.add(
              index
            );


            const value =
              answer[1] *
              data.multiplier;


            bank +=
              value;


            $("#feud-bank")
              .textContent =
              bank;


            /*
              Exact Family Feud answer sound.

              We deliberately call this once here
              instead of flashCorrect(), so a simple
              answer reveal doesn't double-play the ding.
            */

            playSfx(
              "feud-ding-sound",
              0.66
            );


            renderFeudBoard();
          };


        slot.append(
          number,
          text,
          points
        );


        board.appendChild(
          slot
        );
      }
    );
  }


/* ------------------------------------------------------------
   CONTROLLING TEAM
------------------------------------------------------------ */

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
        .after(
          section
        );
    }


    section.innerHTML =
      "";


    const label =
      document.createElement(
        "strong"
      );


    label.textContent =
      "CONTROLLING TEAM:";


    section.appendChild(
      label
    );


    activeTeams()
      .forEach(
        (
          team,
          index
        ) => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "team-button";


          button.textContent =
            team.name;


          if (
            index ===
            controllingTeam
          ) {

            button.style
              .boxShadow =
              `0 0 18px ${TEAM_COLOURS[index]}`;


            button.style
              .borderColor =
              TEAM_COLOURS[index];
          }


          button.onclick =
            () => {

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


/* ------------------------------------------------------------
   STRIKE
------------------------------------------------------------ */

  $("#feud-strike-button")
    .onclick =
    () => {

      strikes += 1;


      $("#feud-strikes")
        .textContent =
        strikes;


      /*
        Family Feud gets its own buzzer
        + red screen response.
      */

      flashWrong();


      if (
        strikes >= 3
      ) {

        $("#feud-strike-button")
          .disabled =
          true;


        $("#feud-steal-button")
          .classList.add(
            "feud-steal-ready"
          );
      }
    };


/* ------------------------------------------------------------
   PLAY / PASS
------------------------------------------------------------ */

  $("#feud-play-pass-button")
    .onclick =
    () => {

      /*
        Host chooses the team that has control.
        This button simply refreshes the selector.
      */

      renderFeudTeamControls();
    };


/* ------------------------------------------------------------
   AWARD BANK / STEAL
------------------------------------------------------------ */

  $("#feud-steal-button")
    .onclick =
    () => {

      if (
        bankAwarded
      ) {
        return;
      }


      /*
        Create on-screen team buttons rather
        than using a browser prompt.
      */

      $("#feud-bank-award-controls")
        ?.remove();


      const controls =
        document.createElement(
          "div"
        );


      controls.id =
        "feud-bank-award-controls";


      controls.className =
        "team-action-buttons";


      const heading =
        document.createElement(
          "strong"
        );


      heading.textContent =
        `AWARD ${bank} FEUD POINTS TO:`;


      controls.appendChild(
        heading
      );


      activeTeams()
        .forEach(
          (
            team,
            index
          ) => {

            const button =
              document.createElement(
                "button"
              );


            button.type =
              "button";


            button.className =
              "team-button";


            button.textContent =
              team.name;


            button.onclick =
              () => {

                state.feud
                  .internalScores[
                    index
                  ] += bank;


                bankAwarded =
                  true;


                saveState();


                /*
                  Successful steal/bank award:
                  Feud ding + green screen feedback.
                */

                flashCorrect();


                controls.innerHTML =
                  `<strong>${escapeHtml(
                    team.name
                  )} WINS THE BANK — ${bank}</strong>`;
              };


            controls.appendChild(
              button
            );
          }
        );


      $(".feud-panel > .game-controls")
        .after(
          controls
        );
    };


/* ------------------------------------------------------------
   NEXT ROUND
------------------------------------------------------------ */

  $("#feud-next-round-button")
    .onclick =
    () => {

      /*
        If the bank wasn't manually awarded
        through STEAL, it goes to the
        controlling team.
      */

      if (
        !bankAwarded
      ) {

        state.feud
          .internalScores[
            controllingTeam
          ] += bank;
      }


      saveState();


      $("#feud-bank-award-controls")
        ?.remove();


      if (
        round <
        FEUD_ROUNDS.length - 1
      ) {

        round += 1;


        controllingTeam =
          (
            controllingTeam +
            1
          ) %
          state.teamCount;


        $("#feud-strike-button")
          .disabled =
          false;


        $("#feud-steal-button")
          .classList.remove(
            "feud-steal-ready"
          );


        renderRound();

      } else {

        finishMainFeud();
      }
    };


/* ============================================================
   END MAIN FEUD
============================================================ */

  function finishMainFeud() {

    const ranking =
      activeTeams()
        .map(
          (
            team,
            index
          ) => ({

            index,

            score:
              state.feud
                .internalScores[
                  index
                ]
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        );


    /*
      Main Feud placement bonuses.
    */

    const awards =
      state.teamCount === 2

        ? [100, 50]

        : [100, 50, 20];


    ranking.forEach(
      (
        entry,
        place
      ) => {

        changeScore(
          entry.index,
          awards[place]
        );
      }
    );


    const winner =
      ranking[0].index;


    showFeudMainResults(
      ranking,
      winner
    );
  }


/* ------------------------------------------------------------
   MAIN FEUD RESULTS
------------------------------------------------------------ */

  function showFeudMainResults(
    ranking,
    winner
  ) {

    $("#feud-question")
      .textContent =
      `${state.teams[winner].name.toUpperCase()} WINS FAMILY FEUD!`;


    $("#feud-board")
      .innerHTML =
      "";


    ranking.forEach(
      (
        entry,
        place
      ) => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "feud-answer revealed";


        row.innerHTML = `
          <div class="feud-answer-number">
            ${place + 1}
          </div>

          <div class="feud-answer-text">
            ${escapeHtml(
              state.teams[
                entry.index
              ].name
            )}
          </div>

          <div class="feud-answer-points">
            ${entry.score}
          </div>
        `;


        $("#feud-board")
          .appendChild(
            row
          );
      }
    );


    $(".feud-status")
      ?.classList.add(
        "hidden"
      );


    $(".feud-panel > .game-controls")
      ?.classList.add(
        "hidden"
      );


    $("#feud-team-controls")
      ?.classList.add(
        "hidden"
      );


    $("#feud-round-label")
      .textContent =
      "MAIN GAME COMPLETE";


    playSfx(
      "feud-win-sound",
      0.68
    );


    const startFastMoney =
      document.createElement(
        "button"
      );


    startFastMoney.type =
      "button";


    startFastMoney.className =
      "primary-button";


    startFastMoney.textContent =
      "START FAST MONEY";


    startFastMoney.onclick =
      () => {

        initialiseFastMoney(
          winner
        );
      };


    $("#feud-board")
      .appendChild(
        startFastMoney
      );
  }


/* ============================================================
   FAST MONEY
============================================================ */

  function initialiseFastMoney(
    winner
  ) {

    $("#feud-board")
      .classList.add(
        "hidden"
      );


    $(".feud-status")
      ?.classList.add(
        "hidden"
      );


    $(".feud-panel > .game-controls")
      ?.classList.add(
        "hidden"
      );


    $("#feud-question")
      .classList.add(
        "hidden"
      );


    $("#feud-round-label")
      .classList.add(
        "hidden"
      );


    $("#feud-team-controls")
      ?.classList.add(
        "hidden"
      );


    const section =
      $("#fast-money-section");


    section.classList.remove(
      "hidden"
    );


    /*
      We rebuild this section because Fast Money
      needs two players, score entry fields,
      reveal controls and a running total.
    */

    section.innerHTML = `
      <h2>
        FAST MONEY
      </h2>

      <p>
        ${escapeHtml(
          state.teams[
            winner
          ].name
        )}
      </p>

      <div
        id="fast-money-player"
        class="round-counter"
      >
        PLAYER 1
      </div>

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
        id="fast-money-entry"
      >
      </div>

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
      makeTimer({

        duration:
          30,

        element:
          $("#fast-money-timer")
      });


    $("#fast-money-start")
      .onclick =
      () => {

        timer.reset(
          30
        );


        timer.start();
      };


    renderFastMoneyFields();


/* ------------------------------------------------------------
   FAST MONEY QUESTIONS
------------------------------------------------------------ */

    function renderFastMoneyFields() {

      const entry =
        $("#fast-money-entry");


      entry.innerHTML =
        "";


      FAST_MONEY.forEach(
        (
          question,
          index
        ) => {

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
              Enter survey score for the player's answer:
            </p>

            <input
              type="number"
              min="0"
              max="100"
              value="0"
              style="
                width:100px;
                padding:10px;
                margin-top:10px;
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


      reveal.type =
        "button";


      reveal.className =
        "primary-button";


      reveal.textContent =
        `REVEAL PLAYER ${player} SCORES`;


      reveal.onclick =
        () => {

          timer.stop();


          const values =
            Array.from(
              entry.querySelectorAll(
                "input"
              )
            )
            .map(
              input =>
                Math.max(
                  0,
                  Number(
                    input.value
                  ) || 0
                )
            );


          reveal.disabled =
            true;


          let delay = 0;


          values.forEach(
            (
              value,
              index
            ) => {

              setTimeout(
                () => {

                  grandTotal +=
                    value;


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


                  /*
                    Feud score reveal ding.
                  */

                  playSfx(
                    "feud-ding-sound",
                    0.62
                  );

                },
                delay
              );


              delay +=
                700;
            }
          );


          setTimeout(
            () => {

              if (
                player === 1
              ) {

                player = 2;


                $("#fast-money-player")
                  .textContent =
                  "PLAYER 2";


                timer.reset(
                  30
                );


                $("#fast-money-start")
                  .textContent =
                  "START 30 SEC";


                renderFastMoneyFields();

              } else {

                finishFastMoney();
              }

            },
            delay + 500
          );
        };


      entry.appendChild(
        reveal
      );
    }


/* ------------------------------------------------------------
   FAST MONEY RESULT
------------------------------------------------------------ */

    function finishFastMoney() {

      timer.stop();


      const entry =
        $("#fast-money-entry");


      entry.innerHTML =
        "";


      const result =
        document.createElement(
          "div"
        );


      result.className =
        "answer-section";


      if (
        grandTotal >=
        200
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


        playSfx(
          "feud-win-sound",
          0.68
        );

      } else {

        result.innerHTML = `
          <h2>
            ${grandTotal} POINTS
          </h2>

          <p>
            TARGET: 200
          </p>
        `;
      }


      const finish =
        document.createElement(
          "button"
        );


      finish.type =
        "button";


      finish.className =
        "primary-button";


      finish.textContent =
        "FINISH FAMILY FEUD";


      finish.onclick =
        () => {

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

function initialiseFinalResults() {

  $("#reveal-results-button")
    ?.addEventListener(
      "click",
      beginFinalReveal
    );


  $("#close-game-button")
    ?.addEventListener(
      "click",
      closeGameSequence
    );


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


        setTimeout(
          () => {

            const thanks =
              $("#thanks-for-playing");


            if (thanks) {
              thanks.style.opacity =
                "0";
            }

          },
          4000
        );
      }
    );
}


/* ============================================================
   OPEN FINAL RESULTS
============================================================ */

function openFinalResults() {

  stopMenuMusic({
    reset: false
  });


  stopFeudMusic({
    reset: true
  });


  activeGame =
    null;


  showScreen(
    "final-results-screen"
  );


  const first =
    $("#podium-first");

  const second =
    $("#podium-second");

  const third =
    $("#podium-third");


  if (first) {

    first.innerHTML =
      "";

    first.classList.remove(
      "winner-celebration"
    );
  }


  if (second) {
    second.innerHTML =
      "";
  }


  if (third) {

    third.innerHTML =
      "";

    third.style.display =
      state.teamCount === 2
        ? "none"
        : "";
  }


  $("#final-results-heading")
    .textContent =
    "THE SCORES ARE IN...";


  $("#reveal-results-button")
    .classList.remove(
      "hidden"
    );


  $("#reveal-results-button")
    .disabled =
    false;


  $("#close-game-button")
    .classList.add(
      "hidden"
    );
}


/* ============================================================
   BEGIN PODIUM REVEAL
============================================================ */

function beginFinalReveal() {

  const revealButton =
    $("#reveal-results-button");


  if (revealButton) {

    revealButton.disabled =
      true;


    revealButton.classList.add(
      "hidden"
    );
  }


  const rankings =
    activeTeams()
      .map(
        (
          team,
          index
        ) => ({

          index,

          name:
            team.name,

          score:
            team.score
        })
      )
      .sort(
        (
          a,
          b
        ) => {

          /*
            Higher score wins.

            If tied, lower original
            team index stays first.
          */

          if (
            b.score !==
            a.score
          ) {

            return (
              b.score -
              a.score
            );
          }


          return (
            a.index -
            b.index
          );
        }
      );


  /*
    TWO-TEAM ENDING
  */

  if (
    state.teamCount === 2
  ) {

    $("#final-results-heading")
      .textContent =
      "RUNNER-UP...";


    revealPodiumPosition(
      "podium-second",
      rankings[1],
      2
    );


    setTimeout(
      () => {

        $("#final-results-heading")
          .textContent =
          "WHICH MEANS YOUR MENTAL COMBAT CHAMPION IS...";


        setTimeout(
          () => {

            countdownWinner(
              rankings[0]
            );

          },
          1200
        );

      },
      2500
    );


    return;
  }


  /*
    THREE-TEAM ENDING
  */

  $("#final-results-heading")
    .textContent =
    "IN THIRD PLACE...";


  revealPodiumPosition(
    "podium-third",
    rankings[2],
    3
  );


  setTimeout(
    () => {

      $("#final-results-heading")
        .textContent =
        "IN SECOND PLACE...";


      revealPodiumPosition(
        "podium-second",
        rankings[1],
        2
      );

    },
    2600
  );


  setTimeout(
    () => {

      $("#final-results-heading")
        .textContent =
        "WHICH MEANS YOUR MENTAL COMBAT CHAMPION IS...";

    },
    5200
  );


  setTimeout(
    () => {

      countdownWinner(
        rankings[0]
      );

    },
    7000
  );
}


/* ============================================================
   PODIUM POSITION
============================================================ */

function revealPodiumPosition(
  id,
  team,
  place
) {

  const podium =
    document.getElementById(
      id
    );


  if (
    !podium ||
    !team
  ) {
    return;
  }


  const placeText =
    place === 2
      ? "2ND PLACE"
      : "3RD PLACE";


  podium.innerHTML = `

    <div class="podium-place-label">
      ${placeText}
    </div>

    <div class="podium-team-name">
      ${escapeHtml(
        team.name
      )}
    </div>

    <div class="podium-score">
      ${team.score} POINTS
    </div>
  `;
}


/* ============================================================
   WINNER COUNTDOWN
============================================================ */

function countdownWinner(
  winner
) {

  const heading =
    $("#final-results-heading");


  if (
    !heading ||
    !winner
  ) {
    return;
  }


  /*
    Finale fanfare/tadaa starts
    as the countdown begins.
  */

  playSfx(
    "podium-tadaa-sound",
    0.70
  );


  let number =
    3;


  heading.textContent =
    number;


  const interval =
    setInterval(
      () => {

        number -= 1;


        if (
          number > 0
        ) {

          heading.textContent =
            number;

        } else {

          clearInterval(
            interval
          );


          revealWinner(
            winner
          );
        }

      },
      900
    );
}


/* ============================================================
   CHAMPION
============================================================ */

function revealWinner(
  winner
) {

  $("#final-results-heading")
    .textContent =
    `${winner.name.toUpperCase()}!`;


  const podium =
    $("#podium-first");


  if (!podium) {
    return;
  }


  podium.innerHTML = `

    <div class="podium-place-label">
      1ST PLACE
    </div>

    <div class="podium-team-name">
      ${escapeHtml(
        winner.name
      )}
    </div>

    <div class="podium-score">
      ${winner.score} POINTS
    </div>

    <div class="podium-champion-label">
      MENTAL COMBAT CHAMPION
    </div>
  `;


  podium.classList.add(
    "winner-celebration"
  );


  spawnConfetti();


  /*
    Full winner sound when
    the champion actually appears.
  */

  playSfx(
    "winner-sound",
    0.72
  );


  setTimeout(
    () => {

      $("#close-game-button")
        .classList.remove(
          "hidden"
        );

    },
    2200
  );
}


/* ============================================================
   CONFETTI
============================================================ */

function spawnConfetti() {

  for (
    let index = 0;
    index < 90;
    index++
  ) {

    const piece =
      document.createElement(
        "div"
      );


    piece.className =
      "confetti-piece";


    piece.style.position =
      "fixed";


    piece.style.zIndex =
      "500";


    piece.style.top =
      "-20px";


    piece.style.left =
      `${Math.random() * 100}vw`;


    piece.style.width =
      `${6 + Math.random() * 7}px`;


    piece.style.height =
      `${10 + Math.random() * 10}px`;


    piece.style.pointerEvents =
      "none";


    piece.style.background =
      TEAM_COLOURS[
        Math.floor(
          Math.random() *
          TEAM_COLOURS.length
        )
      ];


    piece.style.opacity =
      "0.95";


    piece.style.transform =
      `rotate(${Math.random() * 360}deg)`;


    piece.style.transition =
      `top ${
        2.6 +
        Math.random() * 2.4
      }s linear,
      transform ${
        2.6 +
        Math.random() * 2.4
      }s linear`;


    document.body.appendChild(
      piece
    );


    requestAnimationFrame(
      () => {

        requestAnimationFrame(
          () => {

            piece.style.top =
              "110vh";


            piece.style.transform =
              `rotate(${
                720 +
                Math.random() *
                1080
              }deg)`;
          }
        );
      }
    );


    setTimeout(
      () => {

        piece.remove();

      },
      6000
    );
  }
}


/* ============================================================
   CLOSE GAME / GAME OVER
============================================================ */

function closeGameSequence() {

  /*
    GAME OVER sound happens before
    the glitch/CONTINUE transition.
  */

  playSfx(
    "game-over-sound",
    0.70
  );


  document.body.classList.add(
    "glitching"
  );


  setTimeout(
    () => {

      document.body.classList.remove(
        "glitching"
      );


      showScreen(
        "continue-screen"
      );

    },
    1600
  );
}
