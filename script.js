// ── NOTAS Y EMOJIS ──
const NOTAS = [
  { nombre: "Do", emoji: "🔴", frecuencia: 261 },
  { nombre: "Re", emoji: "🟠", frecuencia: 294 },
  { nombre: "Mi", emoji: "🟡", frecuencia: 330 },
  { nombre: "Fa", emoji: "🟢", frecuencia: 349 },
  { nombre: "Sol", emoji: "🔵", frecuencia: 392 },
  { nombre: "La", emoji: "🟣", frecuencia: 440 },
];

const NUMEROS_VOZ = {
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
};

// ── ESTADO ──
let cartas = [];
let seleccionadas = [];
let paresEncontrados = 0;
let bloqueado = false;
let audioCtx = null;
let reconocimiento = null;
let escuchando = false;

// ── ELEMENTOS ──
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaVictoria = document.getElementById("pantalla-victoria");
const tablero = document.getElementById("tablero");
const contadorPares = document.getElementById("contador-pares");
const btnIniciar = document.getElementById("btn-iniciar");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnVoz = document.getElementById("btn-voz");

// ── VOZ (síntesis) ──
function hablar(texto, alTerminar = null) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "es-AR";
  utterance.rate = 0.95;
  if (alTerminar) utterance.onend = alTerminar;
  synth.speak(utterance);
}

// ── SONIDO ──
function reproducirNota(frecuencia, duracion = 0.4) {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();
  oscilador.connect(ganancia);
  ganancia.connect(audioCtx.destination);
  oscilador.type = "sine";
  oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
  ganancia.gain.setValueAtTime(0.5, audioCtx.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duracion,
  );
  oscilador.start(audioCtx.currentTime);
  oscilador.stop(audioCtx.currentTime + duracion);
}

function reproducirVictoria() {
  const melodia = [261, 330, 392, 523];
  melodia.forEach((freq, i) => {
    setTimeout(() => reproducirNota(freq, 0.4), i * 250);
  });
}

function reproducirError() {
  reproducirNota(180, 0.35);
}

// ── MEZCLAR ──
function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── INICIAR JUEGO ──
function iniciarJuego() {
  cartas = [];
  seleccionadas = [];
  paresEncontrados = 0;
  bloqueado = false;
  tablero.innerHTML = "";
  contadorPares.textContent = "Pares: 0 / 6";

  const mazo = mezclar([...NOTAS, ...NOTAS]);

  mazo.forEach((nota, index) => {
    const numero = index + 1;
    cartas.push({
      id: index,
      nota: nota,
      volteada: false,
      encontrada: false,
    });

    const div = document.createElement("div");
    div.classList.add("carta");
    div.dataset.id = index;
    div.textContent = numero;
    div.addEventListener("click", () => alTocarCarta(index));
    tablero.appendChild(div);
  });

  mostrarPantalla("juego");
  hablar(
    "Encontrá los pares que suenan igual. Tocá una carta o decí su número.",
  );
}

// ── TOCAR CARTA ──
function alTocarCarta(id) {
  if (bloqueado) return;

  const carta = cartas[id];

  if (carta.encontrada) {
    hablar(`La carta ${id + 1} ya fue encontrada.`);
    return;
  }

  if (carta.volteada) {
    hablar(`La carta ${id + 1} ya está dada vuelta.`);
    return;
  }

  carta.volteada = true;
  const div = document.querySelector(`.carta[data-id="${id}"]`);
  div.classList.add("volteada");
  div.textContent = carta.nota.emoji;

  reproducirNota(carta.nota.frecuencia);
  hablar(`Carta ${id + 1}, nota ${carta.nota.nombre}`);

  seleccionadas.push(id);

  if (seleccionadas.length === 2) {
    bloqueado = true;
    setTimeout(verificarPar, 900);
  }
}

// ── VERIFICAR PAR ──
function verificarPar() {
  const [id1, id2] = seleccionadas;
  const carta1 = cartas[id1];
  const carta2 = cartas[id2];
  const div1 = document.querySelector(`.carta[data-id="${id1}"]`);
  const div2 = document.querySelector(`.carta[data-id="${id2}"]`);

  if (carta1.nota.nombre === carta2.nota.nombre) {
    carta1.encontrada = true;
    carta2.encontrada = true;
    div1.classList.remove("volteada");
    div2.classList.remove("volteada");
    div1.classList.add("encontrada");
    div2.classList.add("encontrada");

    paresEncontrados++;
    contadorPares.textContent = `Pares: ${paresEncontrados} / 6`;
    hablar(
      `¡Muy bien! Par de ${carta1.nota.nombre} encontrado. Pares: ${paresEncontrados} de 6.`,
    );

    if (paresEncontrados === 6) {
      setTimeout(ganar, 1500);
    } else {
      bloqueado = false;
    }
  } else {
    div1.classList.add("error");
    div2.classList.add("error");
    reproducirError();
    hablar("No es par. Intentá de nuevo.");

    setTimeout(() => {
      carta1.volteada = false;
      carta2.volteada = false;
      div1.classList.remove("volteada", "error");
      div2.classList.remove("volteada", "error");
      div1.textContent = id1 + 1;
      div2.textContent = id2 + 1;
      bloqueado = false;
    }, 1000);
  }

  seleccionadas = [];
}

// ── GANAR ──
function ganar() {
  reproducirVictoria();
  hablar("¡Felicitaciones! Encontraste todos los pares. ¡Ganaste!");
  setTimeout(() => mostrarPantalla("victoria"), 1500);
}

// ── RECONOCIMIENTO DE VOZ ──
function iniciarReconocimiento() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    hablar("Tu navegador no soporta reconocimiento de voz. Probá con Chrome.");
    return;
  }

  if (escuchando) {
    reconocimiento.stop();
    return;
  }

  reconocimiento = new SpeechRecognition();
  reconocimiento.lang = "es-AR";
  reconocimiento.interimResults = false;
  reconocimiento.maxAlternatives = 3;

  reconocimiento.onstart = () => {
    escuchando = true;
    btnVoz.classList.add("escuchando");
  };

  reconocimiento.onend = () => {
    escuchando = false;
    btnVoz.classList.remove("escuchando");
  };

  reconocimiento.onresult = (event) => {
    // Buscar en todas las alternativas
    for (let i = 0; i < event.results[0].length; i++) {
      const texto = event.results[0][i].transcript.toLowerCase().trim();
      const numero = NUMEROS_VOZ[texto];
      if (numero !== undefined) {
        alTocarCarta(numero - 1);
        return;
      }
    }
    hablar("No entendí. Decí un número del 1 al 12.");
  };

  reconocimiento.onerror = (event) => {
    escuchando = false;
    btnVoz.classList.remove("escuchando");
    if (event.error !== "no-speech") {
      hablar("Hubo un error con el micrófono. Intentá de nuevo.");
    }
  };

  reconocimiento.start();
}

// ── CAMBIAR PANTALLA ──
function mostrarPantalla(cual) {
  pantallaInicio.classList.add("oculto");
  pantallaJuego.classList.add("oculto");
  pantallaVictoria.classList.add("oculto");

  if (cual === "inicio") pantallaInicio.classList.remove("oculto");
  if (cual === "juego") pantallaJuego.classList.remove("oculto");
  if (cual === "victoria") pantallaVictoria.classList.remove("oculto");
}

// ── EVENTOS ──
btnIniciar.addEventListener("click", iniciarJuego);
btnReiniciar.addEventListener("click", iniciarJuego);
btnVoz.addEventListener("click", iniciarReconocimiento);
