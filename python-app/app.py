import os
from datetime import datetime, timezone

import redis
from flask import Flask, jsonify
from redis.exceptions import RedisError

app = Flask(__name__)

db = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    decode_responses=True,
    socket_connect_timeout=3,
    socket_timeout=3,
)


@app.errorhandler(RedisError)
def redis_error(error):
    app.logger.error("No se pudo completar la operación en Redis: %s", error)
    return jsonify({"error": "La base de datos no está disponible."}), 503


@app.get("/")
def inicio():
    return """
    <h1>Proyecto de Infraestructura Computacional</h1>
    <p>Aplicación Python conectada a Redis.</p>
    <p><a href="/health">Comprobar el estado del servicio</a></p>
    <p><a href="/resultados">Consultar los resultados</a></p>
    <form action="/procesar" method="post">
      <button type="submit">Procesar datos</button>
    </form>
    """


@app.post("/procesar")
def procesar():
    fecha = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with db.pipeline() as pipeline:
        pipeline.incr("visitas")
        pipeline.set("ultima_ejecucion", fecha)
        total, _ = pipeline.execute()

    return jsonify({
        "mensaje": "Datos procesados correctamente",
        "total_procesamientos": total,
        "fecha": fecha,
    })


@app.get("/resultados")
def resultados():
    total, ultima_ejecucion = db.mget("visitas", "ultima_ejecucion")
    return jsonify({
        "total_procesamientos": int(total or 0),
        "ultima_ejecucion": ultima_ejecucion,
    })


@app.get("/health")
def health():
    db.ping()
    return jsonify({"status": "ok", "database": "connected"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
