document.addEventListener("DOMContentLoaded", () => {
  const carreraSelect = document.getElementById("carrera");
  const anioSelect = document.getElementById("anio");
  const cursoSelect = document.getElementById("curso");
  const tablaNotasBody = document.querySelector("#tablaNotas tbody");

  // Elementos nuevos
  const filtroDniInput = document.getElementById("filtroDni");
  const paginador = document.getElementById("paginador");
  let datosOriginales = [];
  let paginaActual = 1;
  const registrosPorPagina = 10;

  // Cargar carreras
  fetch("http://localhost:3000/api/carreras")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((carrera) => {
        const option = document.createElement("option");
        option.value = carrera.id_carrera;
        option.textContent = carrera.nombre;
        carreraSelect.appendChild(option);
      });
    })
    .catch((err) => console.error("Error al cargar carreras:", err));

  // Cargar años desde la base de datos
  fetch("http://localhost:3000/api/anios")
    .then((res) => res.json())
    .then((anios) => {
      anioSelect.innerHTML = "";
      anioSelect.innerHTML += `<option value="">Selecciona un año</option>`;
      anios.forEach((anio) => {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = `Año ${anio}`;
        anioSelect.appendChild(option);
      });
    })
    .catch((err) => console.error("Error al cargar años:", err));

  // Cargar cursos al seleccionar carrera o año
  function cargarCursos() {
    const carrera = carreraSelect.value;
    const anio = anioSelect.value;

    if (!carrera || !anio) return;

    fetch(`http://localhost:3000/api/cursos?carrera=${carrera}&anio=${anio}`)
      .then((res) => res.json())
      .then((data) => {
        cursoSelect.innerHTML = "";
        data.forEach((curso) => {
          const option = document.createElement("option");
          option.value = curso.id_curso;
          option.textContent = curso.nombre;
          cursoSelect.appendChild(option);
        });
      })
      .catch((err) => console.error("Error al cargar cursos:", err));
  }

  carreraSelect.addEventListener("change", cargarCursos);
  anioSelect.addEventListener("change", cargarCursos);

  // Buscar notas y mostrar en tabla editable
  document
    .getElementById("formulario")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const curso = cursoSelect.value;

      try {
        const res = await fetch(
          `http://localhost:3000/api/notas?curso=${curso}`
        );
        const data = await res.json();

        datosOriginales = data;
        paginaActual = 1;

        renderizarTabla(datosOriginales, paginaActual);
        renderizarPaginacion(datosOriginales.length, registrosPorPagina);
      } catch (err) {
        console.error("Error al obtener notas:", err);
        tablaNotasBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-danger text-center">Error al cargar las notas.</td>
        </tr>
      `;
      }
    });

  // Renderizar tabla
  function renderizarTabla(datos, pagina) {
    tablaNotasBody.innerHTML = "";

    if (datos.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.setAttribute("colspan", "7");
      cell.className = "text-center text-muted";
      cell.textContent = "No hay notas disponibles.";
      row.appendChild(cell);
      tablaNotasBody.appendChild(row);
      return;
    }

    const inicio = (pagina - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const datosPagina = datos.slice(inicio, fin);

    datosPagina.forEach((nota) => {
      const row = document.createElement("tr");

      // Nombre completo (sin coma inicial si falta apellido)
      const cellNombre = document.createElement("td");
      const nombreCompleto = [nota.apellido, nota.nombre]
        .filter(Boolean)
        .join(" ");
      cellNombre.textContent = nombreCompleto || "-";
      row.appendChild(cellNombre);

      // DNI
      const cellDni = document.createElement("td");
      cellDni.textContent = nota.dni ?? "-";
      row.appendChild(cellDni);

      // Primer cuatrimestre
      const cellCuatri1 = document.createElement("td");
      const spanCuatri1 = document.createElement("span");
      spanCuatri1.textContent =
        nota.nota_primer_cuatrimestre?.toFixed(1) ?? "-";

      const inputCuatri1 = document.createElement("input");
      inputCuatri1.type = "number";
      inputCuatri1.className = "form-control form-control-sm";
      inputCuatri1.value = nota.nota_primer_cuatrimestre?.toFixed(1) ?? "";
      inputCuatri1.dataset.alumnoId = nota.id_alumno;
      inputCuatri1.dataset.cursoId = curso;
      inputCuatri1.style.display = "none";

      const btnEditar1 = document.createElement("button");
      btnEditar1.textContent = "Editar";
      btnEditar1.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditar1.addEventListener("click", () => {
        spanCuatri1.style.display = "none";
        inputCuatri1.style.display = "inline-block";
        btnGuardar1.style.display = "inline-block";
        btnEditar1.style.display = "none";
      });

      const btnGuardar1 = document.createElement("button");
      btnGuardar1.textContent = "Guardar";
      btnGuardar1.className = "btn btn-success btn-sm ms-1";
      btnGuardar1.style.display = "none";
      btnGuardar1.addEventListener("click", () =>
        guardarNota(
          inputCuatri1,
          btnEditar1,
          btnGuardar1,
          spanCuatri1,
          "nota_primer_cuatrimestre",
          nota,
          row
        )
      );

      cellCuatri1.appendChild(spanCuatri1);
      cellCuatri1.appendChild(btnEditar1);
      cellCuatri1.appendChild(inputCuatri1);
      cellCuatri1.appendChild(btnGuardar1);
      row.appendChild(cellCuatri1);

      // Segundo cuatrimestre
      const cellCuatri2 = document.createElement("td");
      const spanCuatri2 = document.createElement("span");
      spanCuatri2.textContent =
        nota.nota_segundo_cuatrimestre?.toFixed(1) ?? "-";

      const inputCuatri2 = document.createElement("input");
      inputCuatri2.type = "number";
      inputCuatri2.className = "form-control form-control-sm";
      inputCuatri2.value = nota.nota_segundo_cuatrimestre ?? "";
      inputCuatri2.dataset.alumnoId = nota.id_alumno;
      inputCuatri2.dataset.cursoId = curso;
      inputCuatri2.style.display = "none";

      const btnEditar2 = document.createElement("button");
      btnEditar2.textContent = "Editar";
      btnEditar2.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditar2.addEventListener("click", () => {
        spanCuatri2.style.display = "none";
        inputCuatri2.style.display = "inline-block";
        btnGuardar2.style.display = "inline-block";
        btnEditar2.style.display = "none";
      });

      const btnGuardar2 = document.createElement("button");
      btnGuardar2.textContent = "Guardar";
      btnGuardar2.className = "btn btn-success btn-sm ms-1";
      btnGuardar2.style.display = "none";
      btnGuardar2.addEventListener("click", () =>
        guardarNota(
          inputCuatri2,
          btnEditar2,
          btnGuardar2,
          spanCuatri2,
          "nota_segundo_cuatrimestre",
          nota,
          row
        )
      );

      cellCuatri2.appendChild(spanCuatri2);
      cellCuatri2.appendChild(btnEditar2);
      cellCuatri2.appendChild(inputCuatri2);
      cellCuatri2.appendChild(btnGuardar2);
      row.appendChild(cellCuatri2);

      // Nota final
      const cellFinal = document.createElement("td");
      const spanFinal = document.createElement("span");
      spanFinal.textContent = nota.nota_final?.toFixed(1) ?? "-";

      const inputFinal = document.createElement("input");
      inputFinal.type = "number";
      inputFinal.className = "form-control form-control-sm";
      inputFinal.value = nota.nota_final ?? "";
      inputFinal.dataset.alumnoId = nota.id_alumno;
      inputFinal.dataset.cursoId = curso;
      inputFinal.style.display = "none";

      const btnEditarFinal = document.createElement("button");
      btnEditarFinal.textContent = "Editar";
      btnEditarFinal.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditarFinal.addEventListener("click", () => {
        spanFinal.style.display = "none";
        inputFinal.style.display = "inline-block";
        btnGuardarFinal.style.display = "inline-block";
        btnEditarFinal.style.display = "none";
      });

      const btnGuardarFinal = document.createElement("button");
      btnGuardarFinal.textContent = "Guardar";
      btnGuardarFinal.className = "btn btn-success btn-sm ms-1";
      btnGuardarFinal.style.display = "none";
      btnGuardarFinal.addEventListener("click", () =>
        guardarNota(
          inputFinal,
          btnEditarFinal,
          btnGuardarFinal,
          spanFinal,
          "nota_final",
          nota,
          row
        )
      );

      cellFinal.appendChild(spanFinal);
      cellFinal.appendChild(btnEditarFinal);
      cellFinal.appendChild(inputFinal);
      cellFinal.appendChild(btnGuardarFinal);
      row.appendChild(cellFinal);

      // Promedio
      const cellPromedio = document.createElement("td");
      const spanPromedio = document.createElement("span");
      const n1 = parseFloat(nota.nota_primer_cuatrimestre) || 0;
      const n2 = parseFloat(nota.nota_segundo_cuatrimestre) || 0;
      const promedio = (n1 + n2) / 2;
      spanPromedio.textContent = isNaN(promedio) ? "-" : promedio.toFixed(1);
      cellPromedio.appendChild(spanPromedio);
      row.appendChild(cellPromedio);

      // Estado
      const cellEstado = document.createElement("td");
      const spanEstado = document.createElement("span");
      spanEstado.id = `estado-${nota.id_alumno}-${nota.id_curso}`;
      spanEstado.textContent = calcularEstadoDesdeFinal(nota.nota_final);
      aplicarEstiloEstado(spanEstado, spanEstado.textContent);
      cellEstado.appendChild(spanEstado);
      row.appendChild(cellEstado);

      tablaNotasBody.appendChild(row);
    });
  }

  // Guardar cualquier campo editado
  function guardarNota(
    input,
    btnEditar,
    btnGuardar,
    span,
    campo,
    notaOriginal,
    fila
  ) {
    const nuevaNota = parseFloat(input.value);

    if (isNaN(nuevaNota)) {
      alert("La nota debe ser un número válido.");
      return;
    }

    if (nuevaNota < 0 || nuevaNota > 10) {
      alert("La nota debe estar entre 0 y 10.");
      input.focus();
      return;
    }

    fetch("http://localhost:3000/api/guardar-nota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_alumno: parseInt(input.dataset.alumnoId),
        id_curso: parseInt(input.dataset.cursoId),
        [campo]: nuevaNota,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          span.textContent = nuevaNota.toFixed(1);
          span.style.display = "inline-block";
          input.style.display = "none";
          btnGuardar.style.display = "none";
          btnEditar.style.display = "inline-block";

          const nuevaNotaFinal =
            campo === "nota_final"
              ? nuevaNota
              : parseFloat(notaOriginal.nota_final) || 0;

          const spanEstado = fila.cells[6].querySelector("span"); // Índice de 'Estado'
          const nuevoEstado = calcularEstadoDesdeFinal(nuevaNotaFinal);

          spanEstado.textContent = nuevoEstado;
          spanEstado.className = ""; // Limpiar clase anterior
          aplicarEstiloEstado(spanEstado, nuevoEstado);
        } else {
          alert("❌ No se pudo guardar la nota.");
        }
      })
      .catch((err) => {
        console.error("Error al guardar:", err);
        alert("⚠️ Error al guardar la nota.");
      });
  }

  // Calcular estado basado en nota_final
  function calcularEstadoDesdeFinal(notaFinal) {
    const final = parseFloat(notaFinal);

    if (isNaN(final)) return "Libre";
    if (final >= 8) return "Promovido";
    if (final >= 6) return "Regular";
    return "Libre";
  }

  // Aplicar estilo visual al estado
  function aplicarEstiloEstado(span, estado) {
    span.classList.remove(
      "bg-success",
      "bg-warning",
      "bg-danger",
      "text-white",
      "p-1",
      "rounded"
    );

    if (estado === "Promovido") {
      span.classList.add("bg-success", "text-white", "p-1", "rounded");
    } else if (estado === "Regular") {
      span.classList.add("bg-warning", "text-dark", "p-1", "rounded");
    } else {
      span.classList.add("bg-danger", "text-white", "p-1", "rounded");
    }
  }

  // Filtro por DNI
  filtroDniInput.addEventListener("input", () => {
    const dniFiltro = filtroDniInput.value.trim().toLowerCase();

    if (!datosOriginales || datosOriginales.length === 0) return;

    let filtrados = [];

    if (dniFiltro) {
      filtrados = datosOriginales.filter((nota) => {
        const dni = (nota.dni || "").toString().toLowerCase();
        return dni.includes(dniFiltro);
      });
    } else {
      // Si el campo está vacío, muestra todas las notas
      filtrados = [...datosOriginales];
    }

    paginaActual = 1;
    renderizarTabla(filtrados, paginaActual);
    renderizarPaginacion(filtrados.length, registrosPorPagina);
  });

  // Exportar a Excel
  document.getElementById("exportarExcel").addEventListener("click", () => {
    /* Obtener datos de la tabla visible */
    const filas = document.querySelectorAll("#tablaNotas tbody tr");
    const datos = [];

    filas.forEach((fila) => {
      const celdas = fila.querySelectorAll("td");
      if (celdas.length === 7) {
        datos.push([
          celdas[0].textContent,
          celdas[1].textContent,
          celdas[2].querySelector("span")?.textContent,
          celdas[3].querySelector("span")?.textContent,
          celdas[4].querySelector("span")?.textContent,
          celdas[5].textContent,
          celdas[6].querySelector("span")?.textContent,
        ]);
      }
    });

    /* Exportar a Excel */
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Nombre",
        "DNI",
        "1er Cuat.",
        "2do Cuat.",
        "Nota Final",
        "Promedio",
        "Estado",
      ],
      ...datos,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notas");
    XLSX.writeFile(wb, `notas-${new Date().toISOString().split("T")[0]}.xlsx`);
  });

  // Paginación
  function renderizarPaginacion(totalRegistros, registrosPorPagina) {
    paginador.innerHTML = "";

    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

    for (let i = 1; i <= totalPaginas; i++) {
      const li = document.createElement("li");
      li.className = "page-item";
      const a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = i;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        paginaActual = i;
        renderizarTabla(datosOriginales, paginaActual);
      });

      li.appendChild(a);
      paginador.appendChild(li);
    }
  }

  function renderizarTabla(datos, pagina) {
    tablaNotasBody.innerHTML = "";

    if (datos.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.setAttribute("colspan", "7");
      cell.className = "text-center text-muted";
      cell.textContent = "No hay notas disponibles.";
      row.appendChild(cell);
      tablaNotasBody.appendChild(row);
      return;
    }

    const inicio = (pagina - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const datosPagina = datos.slice(inicio, fin);

    datosPagina.forEach((nota) => {
      const row = document.createElement("tr");

      // Nombre completo
      const cellNombre = document.createElement("td");
      const nombreCompleto = [nota.apellido, nota.nombre]
        .filter(Boolean)
        .join(" ");
      cellNombre.textContent = nombreCompleto || "-";
      row.appendChild(cellNombre);

      // DNI – Aquí estaba el problema
      const cellDni = document.createElement("td");
      const dni = nota.dni ? nota.dni.toString() : "";
      cellDni.textContent = dni || "-";
      row.appendChild(cellDni);

      // Primer cuatrimestre
      const cellCuatri1 = document.createElement("td");
      const spanCuatri1 = document.createElement("span");
      spanCuatri1.textContent =
        nota.nota_primer_cuatrimestre?.toFixed(1) ?? "-";

      const inputCuatri1 = document.createElement("input");
      inputCuatri1.type = "number";
      inputCuatri1.className = "form-control form-control-sm";
      inputCuatri1.value = nota.nota_primer_cuatrimestre?.toFixed(1) ?? "";
      inputCuatri1.dataset.alumnoId = nota.id_alumno;
      inputCuatri1.dataset.cursoId = nota.id_curso;
      inputCuatri1.style.display = "none";

      const btnEditar1 = document.createElement("button");
      btnEditar1.textContent = "Editar";
      btnEditar1.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditar1.addEventListener("click", () => {
        spanCuatri1.style.display = "none";
        inputCuatri1.style.display = "inline-block";
        btnGuardar1.style.display = "inline-block";
        btnEditar1.style.display = "none";
      });

      const btnGuardar1 = document.createElement("button");
      btnGuardar1.textContent = "Guardar";
      btnGuardar1.className = "btn btn-success btn-sm ms-1";
      btnGuardar1.style.display = "none";
      btnGuardar1.addEventListener("click", () =>
        guardarNota(
          inputCuatri1,
          btnEditar1,
          btnGuardar1,
          spanCuatri1,
          "nota_primer_cuatrimestre",
          nota,
          row
        )
      );

      cellCuatri1.appendChild(spanCuatri1);
      cellCuatri1.appendChild(btnEditar1);
      cellCuatri1.appendChild(inputCuatri1);
      cellCuatri1.appendChild(btnGuardar1);
      row.appendChild(cellCuatri1);

      // Segundo cuatrimestre
      const cellCuatri2 = document.createElement("td");
      const spanCuatri2 = document.createElement("span");
      spanCuatri2.textContent =
        nota.nota_segundo_cuatrimestre?.toFixed(1) ?? "-";

      const inputCuatri2 = document.createElement("input");
      inputCuatri2.type = "number";
      inputCuatri2.className = "form-control form-control-sm";
      inputCuatri2.value = nota.nota_segundo_cuatrimestre ?? "";
      inputCuatri2.dataset.alumnoId = nota.id_alumno;
      inputCuatri2.dataset.cursoId = nota.id_curso;
      inputCuatri2.style.display = "none";

      const btnEditar2 = document.createElement("button");
      btnEditar2.textContent = "Editar";
      btnEditar2.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditar2.addEventListener("click", () => {
        spanCuatri2.style.display = "none";
        inputCuatri2.style.display = "inline-block";
        btnGuardar2.style.display = "inline-block";
        btnEditar2.style.display = "none";
      });

      const btnGuardar2 = document.createElement("button");
      btnGuardar2.textContent = "Guardar";
      btnGuardar2.className = "btn btn-success btn-sm ms-1";
      btnGuardar2.style.display = "none";
      btnGuardar2.addEventListener("click", () =>
        guardarNota(
          inputCuatri2,
          btnEditar2,
          btnGuardar2,
          spanCuatri2,
          "nota_segundo_cuatrimestre",
          nota,
          row
        )
      );

      cellCuatri2.appendChild(spanCuatri2);
      cellCuatri2.appendChild(btnEditar2);
      cellCuatri2.appendChild(inputCuatri2);
      cellCuatri2.appendChild(btnGuardar2);
      row.appendChild(cellCuatri2);

      // Nota final
      const cellFinal = document.createElement("td");
      const spanFinal = document.createElement("span");
      spanFinal.textContent = nota.nota_final?.toFixed(1) ?? "-";

      const inputFinal = document.createElement("input");
      inputFinal.type = "number";
      inputFinal.className = "form-control form-control-sm";
      inputFinal.value = nota.nota_final ?? "";
      inputFinal.dataset.alumnoId = nota.id_alumno;
      inputFinal.dataset.cursoId = nota.id_curso;
      inputFinal.style.display = "none";

      const btnEditarFinal = document.createElement("button");
      btnEditarFinal.textContent = "Editar";
      btnEditarFinal.className = "btn btn-outline-primary btn-sm ms-2";
      btnEditarFinal.addEventListener("click", () => {
        spanFinal.style.display = "none";
        inputFinal.style.display = "inline-block";
        btnGuardarFinal.style.display = "inline-block";
        btnEditarFinal.style.display = "none";
      });

      const btnGuardarFinal = document.createElement("button");
      btnGuardarFinal.textContent = "Guardar";
      btnGuardarFinal.className = "btn btn-success btn-sm ms-1";
      btnGuardarFinal.style.display = "none";
      btnGuardarFinal.addEventListener("click", () =>
        guardarNota(
          inputFinal,
          btnEditarFinal,
          btnGuardarFinal,
          spanFinal,
          "nota_final",
          nota,
          row
        )
      );

      cellFinal.appendChild(spanFinal);
      cellFinal.appendChild(btnEditarFinal);
      cellFinal.appendChild(inputFinal);
      cellFinal.appendChild(btnGuardarFinal);
      row.appendChild(cellFinal);

      // Promedio
      const cellPromedio = document.createElement("td");
      const spanPromedio = document.createElement("span");
      const n1 = parseFloat(nota.nota_primer_cuatrimestre) || 0;
      const n2 = parseFloat(nota.nota_segundo_cuatrimestre) || 0;
      const promedio = (n1 + n2) / 2;
      spanPromedio.textContent = isNaN(promedio) ? "-" : promedio.toFixed(1);
      cellPromedio.appendChild(spanPromedio);
      row.appendChild(cellPromedio);

      // Estado
      const cellEstado = document.createElement("td");
      const spanEstado = document.createElement("span");
      spanEstado.id = `estado-${nota.id_alumno}-${nota.id_curso}`;
      spanEstado.textContent = calcularEstadoDesdeFinal(nota.nota_final);
      aplicarEstiloEstado(spanEstado, spanEstado.textContent);
      cellEstado.appendChild(spanEstado);
      row.appendChild(cellEstado);

      tablaNotasBody.appendChild(row);
    });
  }
});
