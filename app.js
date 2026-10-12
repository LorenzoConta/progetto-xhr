const form = document.getElementById("meteoForm");
const inputCitta = document.getElementById("citta");
const btnCerca = document.getElementById("btnCerca");
const messaggio = document.getElementById("messaggio");
const risultato = document.getElementById("risultato");

let richiestaGeocoding = null;
let richiestaMeteo = null;

function mostraErrore(testo) {
    messaggio.textContent = testo;
    risultato.hidden = true;
}

function descriviMeteo(codice) {
    const condizioni = {
        0: "Cielo sereno",
        1: "Prevalentemente sereno",
        2: "Parzialmente nuvoloso",
        3: "Coperto",
        45: "Nebbia",
        48: "Nebbia con brina",
        51: "Pioviggine leggera",
        53: "Pioviggine moderata",
        55: "Pioviggine intensa",
        61: "Pioggia leggera",
        63: "Pioggia moderata",
        65: "Pioggia intensa",
        71: "Neve leggera",
        73: "Neve moderata",
        75: "Neve intensa",
        80: "Rovesci di pioggia leggeri",
        81: "Rovesci di pioggia moderati",
        82: "Rovesci di pioggia intensi",
        95: "Temporale"
    };

    return condizioni[codice] || "Condizioni meteorologiche variabili";
}

function mostraMeteo(nome, paese, dati) {
    const corrente = dati.current;
    const temperatura = corrente.temperature_2m;
    const vento = corrente.wind_speed_10m;
    const codice = corrente.weather_code;
    const umidita = corrente.relative_humidity_2m;

    document.getElementById("nomeCitta").textContent =
        paese ? `${nome}, ${paese}` : nome;

    document.getElementById("descrizione").textContent =
        descriviMeteo(codice);

    document.getElementById("temperatura").textContent =
        Math.round(temperatura);

    document.getElementById("vento").textContent =
        `${vento} km/h`;

    document.getElementById("umidita").textContent =
        `${umidita}%`;

    document.getElementById("aggiornamento").textContent =
        `Ultimo dato: ${corrente.time.replace("T", " ")} (ora locale della città)`;

    messaggio.textContent = "";
    risultato.hidden = false;
}

function caricaMeteo(latitudine, longitudine, nome, paese) {
    const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(latitudine)}` +
        `&longitude=${encodeURIComponent(longitudine)}` +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
        "&timezone=auto";

    const xhr = new XMLHttpRequest();
    richiestaMeteo = xhr;

    xhr.onload = function () {
        if (richiestaMeteo !== xhr) return;

        if (xhr.status === 200) {
            try {
                const dati = JSON.parse(xhr.responseText);

                if (!dati.current) {
                    mostraErrore("I dati meteo non sono disponibili.");
                    return;
                }

                mostraMeteo(nome, paese, dati);
            } catch (errore) {
                mostraErrore("Errore durante la lettura dei dati meteo.");
            }
        } else {
            mostraErrore(`Errore HTTP: ${xhr.status}`);
        }
    };

    xhr.onerror = function () {
        if (richiestaMeteo === xhr) {
            mostraErrore("Errore di rete durante il caricamento del meteo.");
        }
    };

    xhr.open("GET", url, true);
    xhr.send();
}

function cercaCitta(nomeCitta) {
    const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(nomeCitta)}` +
        "&count=1&language=it&format=json";

    const xhr = new XMLHttpRequest();
    richiestaGeocoding = xhr;

    messaggio.textContent = "Ricerca della città in corso...";
    risultato.hidden = true;
    btnCerca.disabled = true;

    xhr.onload = function () {
        if (richiestaGeocoding !== xhr) return;

        if (xhr.status === 200) {
            try {
                const dati = JSON.parse(xhr.responseText);

                if (!dati.results || dati.results.length === 0) {
                    mostraErrore("Città non trovata. Prova un altro nome.");
                    return;
                }

                const citta = dati.results[0];

                messaggio.textContent = "Caricamento del meteo...";
                caricaMeteo(
                    citta.latitude,
                    citta.longitude,
                    citta.name,
                    citta.country
                );
            } catch (errore) {
                mostraErrore("Errore durante la lettura dei dati della città.");
            }
        } else {
            mostraErrore(`Errore HTTP: ${xhr.status}`);
        }
    };

    xhr.onerror = function () {
        if (richiestaGeocoding === xhr) {
            mostraErrore("Errore di rete durante la ricerca della città.");
        }
    };

    xhr.onloadend = function () {
        if (richiestaGeocoding === xhr) {
            btnCerca.disabled = false;
        }
    };

    xhr.open("GET", url, true);
    xhr.send();
}

form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nomeCitta = inputCitta.value.trim();

    if (!nomeCitta) {
        mostraErrore("Inserisci il nome di una città.");
        return;
    }

    // Annulla le ricerche precedenti per evitare risposte fuori ordine.
    if (richiestaGeocoding) richiestaGeocoding.abort();
    if (richiestaMeteo) richiestaMeteo.abort();

    cercaCitta(nomeCitta);
});