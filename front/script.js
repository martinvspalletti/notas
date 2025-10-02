document.addEventListener("DOMContentLoaded", function () {
  var carreraSelect = document.getElementById("carrera");
  var anioSelect = document.getElementById("anio");
  var cursoSelect = document.getElementById("curso");
  var tablaNotasBody = document.querySelector("#tablaNotas tbody");

  var filtroDniInput = document.getElementById("filtroDni");
  var paginador = document.getElementById("paginador");
  var datosOriginales = [];
  var paginaActual = 1;
  var registrosPorPagina = 10;

  // Cargar carreras
  fetch("http://localhost:3000/api/carreras")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      carreraSelect.innerHTML =
        '<option value="">Selecciona una carrera</option>';
      data.forEach(function (carrera) {
        var option = document.createElement("option");
        option.value = carrera.id_carrera;
        option.textContent = carrera.nombre;
        carreraSelect.appendChild(option);
      });
    })
    .catch(function (err) {
      console.error("Error al cargar carreras:", err);
    });

  // Cargar años
  fetch("http://localhost:3000/api/anios")
    .then(function (res) {
      return res.json();
    })
    .then(function (anios) {
      anioSelect.innerHTML = '<option value="">Selecciona un año</option>';
      anios.forEach(function (anio) {
        var option = document.createElement("option");
        option.value = anio;
        option.textContent = "Año " + anio;
        anioSelect.appendChild(option);
      });
    })
    .catch(function (err) {
      console.error("Error al cargar años:", err);
    });

  // Cargar cursos
  function cargarCursos() {
    var carrera = carreraSelect.value;
    var anio = anioSelect.value;
    if (!carrera || !anio) {
      cursoSelect.innerHTML = '<option value="">Selecciona un curso</option>';
      return;
    }
    fetch(
      "http://localhost:3000/api/cursos?carrera=" +
        encodeURIComponent(carrera) +
        "&anio=" +
        encodeURIComponent(anio)
    )
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        cursoSelect.innerHTML = '<option value="">Selecciona un curso</option>';
        data.forEach(function (curso) {
          var option = document.createElement("option");
          option.value = curso.id_curso;
          option.textContent = curso.nombre;
          cursoSelect.appendChild(option);
        });
      })
      .catch(function (err) {
        console.error("Error al cargar cursos:", err);
      });
  }
  carreraSelect.addEventListener("change", cargarCursos);
  anioSelect.addEventListener("change", cargarCursos);

  // parseo robusto
  function parseGradeText(text) {
    if (text === undefined || text === null) return NaN;
    var t = String(text).trim().replace(",", ".");
    if (t === "" || t === "-") return NaN;
    var v = parseFloat(t);
    return isNaN(v) ? NaN : v;
  }

  // Submit
  document
    .getElementById("formulario")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      var dni = filtroDniInput.value.trim();
      var data = [];
      if (dni) {
        fetch(
          "http://localhost:3000/api/notas-dni?dni=" + encodeURIComponent(dni)
        )
          .then(function (res) {
            if (!res.ok) throw new Error("Error al obtener notas por DNI");
            return res.json();
          })
          .then(function (json) {
            datosOriginales = json;
            paginaActual = 1;
            renderizarTabla(datosOriginales, paginaActual);
            renderizarPaginacion(datosOriginales.length, registrosPorPagina);
          })
          .catch(function (err) {
            console.error("Error al obtener notas:", err);
            tablaNotasBody.innerHTML =
              '<tr><td colspan=10" class="text-danger text-center">Error al cargar las notas.</td></tr>';
          });
      } else {
        var curso = cursoSelect.value;
        if (!curso) {
          alert("Debes seleccionar un curso o ingresar un DNI.");
          return;
        }
        fetch(
          "http://localhost:3000/api/notas?curso=" + encodeURIComponent(curso)
        )
          .then(function (res) {
            if (!res.ok) throw new Error("Error al obtener notas por curso");
            return res.json();
          })
          .then(function (json) {
            datosOriginales = json;
            paginaActual = 1;
            renderizarTabla(datosOriginales, paginaActual);
            renderizarPaginacion(datosOriginales.length, registrosPorPagina);
          })
          .catch(function (err) {
            console.error("Error al obtener notas:", err);
            tablaNotasBody.innerHTML =
              '<tr><td colspan="10" class="text-danger text-center">Error al cargar las notas.</td></tr>';
          });
      }
    });

  // renderizar tabla
  function renderizarTabla(datos, pagina) {
    tablaNotasBody.innerHTML = "";
    if (!datos || datos.length === 0) {
      var row = document.createElement("tr");
      var cell = document.createElement("td");
      cell.setAttribute("colspan", "10");
      cell.className = "text-center text-muted";
      cell.textContent = "No hay notas disponibles.";
      row.appendChild(cell);
      tablaNotasBody.appendChild(row);
      return;
    }
    var inicio = (pagina - 1) * registrosPorPagina;
    var fin = inicio + registrosPorPagina;
    var datosPagina = datos.slice(inicio, fin);
    datosPagina.forEach(function (nota) {
      var row = document.createElement("tr");

      // Carrera, Año, Curso, Nombre, DNI
      var cellCarrera = document.createElement("td");
      cellCarrera.textContent = nota.carrera_nombre || "-";
      row.appendChild(cellCarrera);

      var cellAnio = document.createElement("td");
      cellAnio.textContent =
        nota.anio !== undefined && nota.anio !== null ? nota.anio : "-";
      row.appendChild(cellAnio);

      var cellCurso = document.createElement("td");
      cellCurso.textContent = nota.curso_nombre || "-";
      row.appendChild(cellCurso);

      var cellNombre = document.createElement("td");
      cellNombre.textContent =
        [nota.apellido, nota.nombre].filter(Boolean).join(" ") || "-";
      row.appendChild(cellNombre);

      var cellDni = document.createElement("td");
      cellDni.textContent = nota.dni || "-";
      row.appendChild(cellDni);

      crearCeldaEditable(row, nota, "nota_primer_cuatrimestre");
      crearCeldaEditable(row, nota, "nota_segundo_cuatrimestre");
      crearCeldaEditable(row, nota, "nota_final");

      // Promedio
      var cellPromedio = document.createElement("td");
      var spanPromedio = document.createElement("span");
      var n1 = parseGradeText(nota.nota_primer_cuatrimestre);
      var n2 = parseGradeText(nota.nota_segundo_cuatrimestre);
      var promedio = NaN;
      if (!isNaN(n1) && !isNaN(n2)) promedio = (n1 + n2) / 2;
      else if (!isNaN(n1)) promedio = n1;
      else if (!isNaN(n2)) promedio = n2;
      spanPromedio.textContent = isNaN(promedio) ? "-" : promedio.toFixed(1);
      cellPromedio.appendChild(spanPromedio);
      row.appendChild(cellPromedio);

      // Estado
      var cellEstado = document.createElement("td");
      var spanEstado = document.createElement("span");
      spanEstado.textContent = calcularEstadoDesdeFinal(nota.nota_final);
      aplicarEstiloEstado(spanEstado, spanEstado.textContent);
      cellEstado.appendChild(spanEstado);
      row.appendChild(cellEstado);

      tablaNotasBody.appendChild(row);
    });
  }

  function crearCeldaEditable(row, nota, campo) {
    var cell = document.createElement("td");
    var span = document.createElement("span");
    span.textContent =
      nota[campo] !== null && nota[campo] !== undefined
        ? parseFloat(nota[campo]).toFixed(1)
        : "-";

    var input = document.createElement("input");
    input.type = "number";
    input.className = "form-control form-control-sm";
    input.value =
      nota[campo] !== null && nota[campo] !== undefined
        ? parseFloat(nota[campo]).toFixed(1)
        : "";
    input.dataset.alumnoId = nota.id_alumno;
    input.dataset.cursoId = nota.id_curso;
    input.style.display = "none";

    var btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn btn-outline-primary btn-sm ms-2";
    btnEditar.addEventListener("click", function () {
      span.style.display = "none";
      input.style.display = "inline-block";
      btnGuardar.style.display = "inline-block";
      btnEditar.style.display = "none";
    });

    var btnGuardar = document.createElement("button");
    btnGuardar.type = "button";
    btnGuardar.textContent = "Guardar";
    btnGuardar.className = "btn btn-success btn-sm ms-1";
    btnGuardar.style.display = "none";
    btnGuardar.addEventListener("click", function () {
      guardarNota(input, btnEditar, btnGuardar, span, campo, row);
    });

    cell.appendChild(span);
    cell.appendChild(btnEditar);
    cell.appendChild(input);
    cell.appendChild(btnGuardar);
    row.appendChild(cell);
  }

  function guardarNota(input, btnEditar, btnGuardar, span, campo, row) {
    var idAlumno = parseInt(input.dataset.alumnoId, 10);
    var idCurso = parseInt(input.dataset.cursoId, 10);
    if (isNaN(idCurso)) {
      var selVal = document.getElementById("curso").value;
      idCurso = selVal ? parseInt(selVal, 10) : NaN;
    }
    var valor = parseFloat(input.value);

    if (isNaN(idCurso)) {
      alert("Error: No se pudo identificar el curso.");
      return;
    }

    fetch("http://localhost:3000/api/guardar-nota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_alumno: idAlumno,
        id_curso: idCurso,
        [campo]: isNaN(valor) ? null : valor,
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Error en la petición");
        return res.json();
      })
      .then(function () {
        span.textContent = !isNaN(valor) ? valor.toFixed(1) : "-";
        span.style.display = "inline-block";
        input.style.display = "none";
        btnGuardar.style.display = "none";
        btnEditar.style.display = "inline-block";

        // actualizar datosOriginales
        for (var i = 0; i < datosOriginales.length; i++) {
          var d = datosOriginales[i];
          if (
            parseInt(d.id_alumno) === idAlumno &&
            parseInt(d.id_curso) === idCurso
          ) {
            d[campo] = isNaN(valor) ? null : valor;
            break;
          }
        }

        actualizarPromedioYEstado(row);
      })
      .catch(function (err) {
        console.error("Error al guardar nota:", err);
        alert("No se pudo guardar la nota");
      });
  }

  function actualizarPromedioYEstado(row) {
    var tds = row.querySelectorAll("td");
    var n1 = parseGradeText(
      tds[5] && tds[5].querySelector("span")
        ? tds[5].querySelector("span").textContent
        : undefined
    );
    var n2 = parseGradeText(
      tds[6] && tds[6].querySelector("span")
        ? tds[6].querySelector("span").textContent
        : undefined
    );
    var finalVal = parseGradeText(
      tds[7] && tds[7].querySelector("span")
        ? tds[7].querySelector("span").textContent
        : undefined
    );
    var promSpan =
      tds[8] && tds[8].querySelector("span")
        ? tds[8].querySelector("span")
        : null;
    var estadoSpan =
      tds[9] && tds[9].querySelector("span")
        ? tds[9].querySelector("span")
        : null;

    var promedio = NaN;
    if (!isNaN(n1) && !isNaN(n2)) promedio = (n1 + n2) / 2;
    else if (!isNaN(n1)) promedio = n1;
    else if (!isNaN(n2)) promedio = n2;
    if (promSpan)
      promSpan.textContent = isNaN(promedio) ? "-" : promedio.toFixed(1);

    var estado = calcularEstadoDesdeFinal(finalVal);
    if (estadoSpan) {
      estadoSpan.textContent = estado;
      aplicarEstiloEstado(estadoSpan, estado);
    }
  }

  function calcularEstadoDesdeFinal(notaFinal) {
    var final = parseFloat(notaFinal);
    if (isNaN(final)) return "Libre";
    if (final >= 8) return "Promovido";
    if (final >= 6) return "Regular";
    return "Libre";
  }

  function aplicarEstiloEstado(span, estado) {
    span.className = "";
    if (estado === "Promovido")
      span.classList.add("bg-success", "text-white", "p-1", "rounded");
    else if (estado === "Regular")
      span.classList.add("bg-warning", "text-dark", "p-1", "rounded");
    else span.classList.add("bg-danger", "text-white", "p-1", "rounded");
  }

  // filtro DNI local
  filtroDniInput.addEventListener("input", function () {
    var dniFiltro = filtroDniInput.value.trim().toLowerCase();
    if (!datosOriginales || datosOriginales.length === 0) return;
    var filtrados = dniFiltro
      ? datosOriginales.filter(function (n) {
          return (
            (n.dni || "").toString().toLowerCase().indexOf(dniFiltro) !== -1
          );
        })
      : datosOriginales.slice();
    paginaActual = 1;
    renderizarTabla(filtrados, paginaActual);
    renderizarPaginacion(filtrados.length, registrosPorPagina);
  });

  // exportar a excel
  document
    .getElementById("exportarExcel")
    .addEventListener("click", function (e) {
      e.preventDefault();
      var filas = document.querySelectorAll("#tablaNotas tbody tr");
      var datos = [];
      filas.forEach(function (fila) {
        var celdas = fila.querySelectorAll("td");
        if (celdas.length === 10) {
          datos.push([
            celdas[0].textContent,
            celdas[1].textContent,
            celdas[2].textContent,
            celdas[3].textContent,
            celdas[4].textContent,
            celdas[5].querySelector("span")
              ? celdas[5].querySelector("span").textContent
              : "",
            celdas[6].querySelector("span")
              ? celdas[6].querySelector("span").textContent
              : "",
            celdas[7].querySelector("span")
              ? celdas[7].querySelector("span").textContent
              : "",
            celdas[8].textContent,
            celdas[9].querySelector("span")
              ? celdas[9].querySelector("span").textContent
              : "",
          ]);
        }
      });
      var ws = XLSX.utils.aoa_to_sheet(
        [
          [
            "Carrera",
            "Año",
            "Curso",
            "Nombre",
            "DNI",
            "1er Cuat.",
            "2do Cuat.",
            "Nota Final",
            "Promedio",
            "Estado",
          ],
        ].concat(datos)
      );
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Notas");
      XLSX.writeFile(
        wb,
        "notas-" + new Date().toISOString().split("T")[0] + ".xlsx"
      );
    });

  // paginacion
  function renderizarPaginacion(totalRegistros, registrosPorPagina) {
    paginador.innerHTML = "";
    var totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    if (totalPaginas <= 1) return;
    for (var i = 1; i <= totalPaginas; i++) {
      var li = document.createElement("li");
      li.className = "page-item";
      if (i === paginaActual) li.classList.add("active");
      var a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = i;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        paginaActual = parseInt(this.textContent, 10);
        renderizarTabla(datosOriginales, paginaActual);
        Array.from(paginador.children).forEach(function (c) {
          c.classList.remove("active");
        });
        li.classList.add("active");
      });
      li.appendChild(a);
      paginador.appendChild(li);
    }
  }
});
