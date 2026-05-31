// ── NOTAS Y EMOJIS ──
const NOTAS = [
  { nombre: "Do", emoji: "🔴", frecuencia: 261 },
  { nombre: "Re", emoji: "🟠", frecuencia: 294 },
  { nombre: "Mi", emoji: "🟡", frecuencia: 330 },
  { nombre: "Fa", emoji: "🟢", frecuencia: 349 },
  { nombre: "Sol", emoji: "🔵", frecuencia: 392 },
  { nombre: "La", emoji: "🟣", frecuencia: 440 },
];

// ── ESTADO DEL JUEGO ──
let cartas = [];
let seleccionadas = [];
let paresEncontrados = 0;
let bloqueado = false;
let audioCtx = null;

// ── ELEMENTOS ──
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaVictoria = document.getElementById("pantalla-victoria");
const tablero = document.getElementById("tablero");
const contadorPares = document.getElementById("contador-pares");
const btnIniciar = document.getElementById("btn-iniciar");
const btnReiniciar = document.getElementById("btn-reiniciar");

// ── VOZ ──
function hablar(texto) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "es-AR";
  utterance.rate = 0.95;
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

  // Crear los 12 pares (6 notas x 2)
  const mazo = mezclar([...NOTAS, ...NOTAS]);

  mazo.forEach((nota, index) => {
    const carta = {
      id: index,
      nota: nota,
      volteada: false,
      encontrada: false,
    };
    cartas.push(carta);

    const div = document.createElement("div");
    div.classList.add("carta");
    div.dataset.id = index;
    div.textContent = "🎵";
    div.addEventListener("click", () => alTocarCarta(index));
    tablero.appendChild(div);
  });

  mostrarPantalla("juego");
  hablar(
    "Encontrá los pares que suenan igual. Tocá una carta para escuchar su nota.",
  );
}

// ── TOCAR CARTA ──
function alTocarCarta(id) {
  if (bloqueado) return;

  const carta = cartas[id];
  if (carta.volteada || carta.encontrada) return;

  // Voltear carta
  carta.volteada = true;
  const div = document.querySelector(`.carta[data-id="${id}"]`);
  div.classList.add("volteada");
  div.textContent = carta.nota.emoji;

  // Sonar y hablar
  reproducirNota(carta.nota.frecuencia);
  hablar(`Nota ${carta.nota.nombre}`);

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
    // ¡Par correcto!
    carta1.encontrada = true;
    carta2.encontrada = true;
    div1.classList.remove("volteada");
    div2.classList.remove("volteada");
    div1.classList.add("encontrada");
    div2.classList.add("encontrada");

    paresEncontrados++;
    contadorPares.textContent = `Pares: ${paresEncontrados} / 6`;
    hablar(`¡Muy bien! Par de ${carta1.nota.nombre} encontrado.`);

    if (paresEncontrados === 6) {
      setTimeout(ganar, 1200);
    } else {
      bloqueado = false;
    }
  } else {
    // Error
    div1.classList.add("error");
    div2.classList.add("error");
    reproducirError();
    hablar("No es par. Intentá de nuevo.");

    setTimeout(() => {
      carta1.volteada = false;
      carta2.volteada = false;
      div1.classList.remove("volteada", "error");
      div2.classList.remove("volteada", "error");
      div1.textContent = "🎵";
      div2.textContent = "🎵";
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
