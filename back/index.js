const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../front")));

// Configuración de conexión
const config = {
  user: process.env.DB_USER || "osiris",
  password: process.env.DB_PASSWORD || "martinspa33+",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "GestionNotas",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

sql
  .connect(config)
  .then((connectedPool) => {
    pool = connectedPool;
    console.log("✅ Conexión a la base de datos establecida");
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err);
  });

// Ruta: Carreras
app.get("/api/carreras", async (req, res) => {
  if (!pool) {
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });
  }

  try {
    const result = await pool
      .request()
      .query("SELECT id_carrera, nombre FROM Carrera");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener carreras:", err);
    res.status(500).json({ error: "Error al obtener carreras" });
  }
});

// Ruta: Años
app.get("/api/anios", async (req, res) => {
  if (!pool) {
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });
  }

  try {
    const result = await pool
      .request()
      .query("SELECT DISTINCT anio FROM Curso ORDER BY anio");
    res.json(result.recordset.map((row) => row.anio));
  } catch (err) {
    console.error("Error al obtener años:", err);
    res.status(500).json({ error: "Error al obtener años" });
  }
});

// Ruta: Cursos por carrera y año
app.get("/api/cursos", async (req, res) => {
  if (!pool) {
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });
  }

  const { carrera, anio } = req.query;

  if (!carrera || !anio) {
    return res.status(400).json({ error: "Faltan parámetros: carrera y anio" });
  }

  try {
    const result = await pool
      .request()
      .input("carrera", sql.Int, carrera)
      .input("anio", sql.Int, anio)
      .query(
        "SELECT id_curso, nombre FROM Curso WHERE id_carrera = @carrera AND anio = @anio"
      );

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener cursos:", err);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

// Ruta: Notas por curso
app.get("/api/notas", async (req, res) => {
  if (!pool)
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });

  const { curso } = req.query;

  if (!curso)
    return res.status(400).json({ error: "Falta el parámetro: curso" });

  try {
    const result = await pool.request().input("curso", sql.Int, curso).query(`
        SELECT 
          Alumno.id_alumno, 
          Alumno.nombre, 
          Alumno.apellido, 
          Alumno.dni,
          Nota.id_curso,
          Nota.nota_primer_cuatrimestre,
          Nota.nota_segundo_cuatrimestre,
          Nota.nota_final,
          Curso.nombre AS curso_nombre,
          Curso.anio,
          Carrera.nombre AS carrera_nombre
        FROM Nota
        JOIN Alumno ON Nota.id_alumno = Alumno.id_alumno
        JOIN Curso ON Nota.id_curso = Curso.id_curso
        JOIN Carrera ON Curso.id_carrera = Carrera.id_carrera
        WHERE Nota.id_curso = @curso
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener notas:", err);
    res.status(500).json({ error: "Error al obtener notas" });
  }
});

// Ruta: Notas por DNI
app.get("/api/notas-dni", async (req, res) => {
  if (!pool)
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });

  const { dni } = req.query;

  if (!dni) return res.status(400).json({ error: "Falta el parámetro: dni" });

  try {
    const result = await pool.request().input("dni", sql.VarChar, dni).query(`
        SELECT 
          Alumno.id_alumno, 
          Alumno.nombre, 
          Alumno.apellido, 
          Alumno.dni,
          Nota.id_curso,
          Nota.nota_primer_cuatrimestre,
          Nota.nota_segundo_cuatrimestre,
          Nota.nota_final,
          Curso.nombre AS curso_nombre,
          Curso.anio,
          Carrera.nombre AS carrera_nombre
        FROM Nota
        JOIN Alumno ON Nota.id_alumno = Alumno.id_alumno
        JOIN Curso ON Nota.id_curso = Curso.id_curso
        JOIN Carrera ON Curso.id_carrera = Carrera.id_carrera
        WHERE Alumno.dni = @dni
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener notas por DNI:", err);
    res.status(500).json({ error: "Error al obtener notas por DNI" });
  }
});

// Ruta: Guardar nota editada
app.post("/api/guardar-nota", async (req, res) => {
  if (!pool) {
    return res
      .status(500)
      .json({ error: "No hay conexión a la base de datos" });
  }

  try {
    const {
      id_alumno,
      id_curso,
      nota_primer_cuatrimestre,
      nota_segundo_cuatrimestre,
      nota_final,
    } = req.body;

    if (!id_alumno || !id_curso) {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    const request = pool
      .request()
      .input("id_alumno", sql.Int, id_alumno)
      .input("id_curso", sql.Int, id_curso);

    let setClauses = [];

    if (typeof nota_primer_cuatrimestre !== "undefined") {
      request.input(
        "nota_primer_cuatrimestre",
        sql.Decimal(5, 2),
        parseFloat(nota_primer_cuatrimestre)
      );
      setClauses.push("nota_primer_cuatrimestre = @nota_primer_cuatrimestre");
    }

    if (typeof nota_segundo_cuatrimestre !== "undefined") {
      request.input(
        "nota_segundo_cuatrimestre",
        sql.Decimal(5, 2),
        parseFloat(nota_segundo_cuatrimestre)
      );
      setClauses.push("nota_segundo_cuatrimestre = @nota_segundo_cuatrimestre");
    }

    if (typeof nota_final !== "undefined") {
      request.input("nota_final", sql.Decimal(5, 2), parseFloat(nota_final));
      setClauses.push("nota_final = @nota_final");
    }

    if (setClauses.length === 0) {
      return res
        .status(400)
        .json({ error: "No se recibió ninguna nota válida." });
    }

    const result = await request.query(`
      UPDATE Nota SET ${setClauses.join(", ")}
      WHERE id_alumno = @id_alumno AND id_curso = @id_curso
    `);

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Nota actualizada correctamente." });
    } else {
      res
        .status(404)
        .json({ success: false, message: "No se encontró la nota." });
    }
  } catch (err) {
    console.error("Error al guardar nota:", err);
    res
      .status(500)
      .json({ success: false, error: "Error al guardar la nota." });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
