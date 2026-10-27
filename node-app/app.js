const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PYTHON_URL = process.env.PYTHON_URL || "http://python:5000";

app.use(express.urlencoded({ extended: false }));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchPython(path, options) {
  const response = await fetch(`${PYTHON_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`El servicio Python respondió con HTTP ${response.status}.`);
  }
  return response;
}

function serviceUnavailable(res, error) {
  console.error("No se pudo completar la solicitud al servicio Python:", error);
  res.status(503).send(
    "El servicio de procesamiento no está disponible. Intenta nuevamente en unos momentos.",
  );
}

app.get("/", async (req, res) => {
  try {
    const response = await fetchPython("/resultados");
    const datos = await response.json();
    const ultimaEjecucion = datos.ultima_ejecucion
      ? escapeHtml(datos.ultima_ejecucion)
      : "Sin datos todavía";

    res.send(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Panel de resultados</title>
          <style>
            :root { color-scheme: light; font-family: Arial, sans-serif; }
            body { margin: 0; background: #f1f5f9; color: #172033; }
            main { max-width: 720px; margin: 4rem auto; padding: 2rem; }
            .panel { padding: 2rem; border-radius: 1rem; background: white; box-shadow: 0 12px 36px #17203318; }
            h1 { margin-top: 0; }
            .count { font-size: 1.15rem; }
            button { padding: .8rem 1.1rem; border: 0; border-radius: .5rem; background: #155eef; color: white; font-size: 1rem; cursor: pointer; }
            button:hover { background: #1047b8; }
            a { color: #155eef; }
          </style>
        </head>
        <body>
          <main>
            <section class="panel">
              <h1>Panel de resultados</h1>
              <h2>Infraestructura y Seguridad Computacional</h2>
              <p class="count">Procesamientos realizados: <strong>${Number(datos.total_procesamientos) || 0}</strong></p>
              <p>Última ejecución: <time>${ultimaEjecucion}</time></p>
              <form action="/procesar" method="post">
                <button type="submit">Procesar nuevos datos</button>
              </form>
              <p><a href="/">Actualizar resultados</a></p>
            </section>
          </main>
        </body>
      </html>`);
  } catch (error) {
    serviceUnavailable(res, error);
  }
});

app.post("/procesar", async (req, res) => {
  try {
    await fetchPython("/procesar", { method: "POST" });
    res.redirect(303, "/");
  } catch (error) {
    serviceUnavailable(res, error);
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Aplicación Node.js disponible en el puerto ${PORT}`);
});
