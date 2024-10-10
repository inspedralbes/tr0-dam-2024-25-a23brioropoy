<template>
  <div class="preguntes-container">
    <header class="header">
      <h1>Joc d'Endevinar l'Any de la Pel·lícula (Anime Edition)</h1>
      <div class="estadistiques">
        <button @click="mostrarEstadistiques">Estadístiques</button>
        <div class="stats-box" v-if="showStats">
          <p>Total Preguntes: <span>{{ totalPreguntes }}</span></p>
          <p>Encerts: <span>{{ encerts }}</span></p>
          <p>Errors: <span>{{ errors }}</span></p>
        </div>
      </div>
    </header>

    <h2>Llista de Preguntes</h2>
    <div class="llistat-preguntes">
      <div class="pregunta-item" v-for="(pregunta, index) in preguntes" :key="index">
        <img :src="pregunta.imatge" alt="Imatge de la pregunta" class="pregunta-imagen" />
        <h3>{{ pregunta.pregunta }}</h3>
        <div class="pregunta-buttons">
          <button class="btn btn-edit" @click="abrirFormulario(index)">Editar</button>
          <button class="btn btn-delete" @click="eliminarPregunta(index)">Eliminar</button>
        </div>
      </div>
    </div>
    <button class="btn afegir-pregunta" @click="abrirFormulario()">Afegir Nova Pregunta</button>

    <!-- Modal del Formulario -->
    <div class="form-overlay" v-if="showForm">
      <div class="form-container">
        <button class="btn-close" @click="cancelarFormulario">X</button>
        <h2>{{ editMode ? 'Editar Pregunta' : 'Afegir Pregunta' }}</h2>
        <form @submit.prevent="submitForm">
          <label for="pregunta">Pregunta:</label>
          <input type="text" v-model="formData.pregunta" required />

          <label for="resposta_correcta">Respuesta Correcta:</label>
          <input type="text" v-model="formData.resposta_correcta" required />

          <label for="respostes_incorrectes">Respuestas Incorrectas (separadas por comas):</label>
          <input type="text" v-model="formData.respostes_incorrectes" required />

          <label for="imatge">URL de la Imagen:</label>
          <input type="text" v-model="formData.imatge" />

          <button type="submit" class="btn">{{ editMode ? 'Actualizar' : 'Añadir' }}</button>
          <button type="button" class="btn btn-cancel" @click="cancelarFormulario">Cancelar</button>
        </form>
      </div>
    </div>

    <footer>
      <div class="footer-content">
        <p>&copy; 2024 Joc d'Endevinar l'Any de la Pel·lícula.</p>
        <p>By Brian <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmRo0VZTzaSbzKZQUBGX87G0V_umOvSyz-ag&s" alt="Logo"></p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      preguntes: [],
      showStats: false,
      totalPreguntes: 0,
      encerts: 0,
      errors: 0,
      showForm: false,
      editMode: false,
      formData: {
        pregunta: '',
        resposta_correcta: '',
        respostes_incorrectes: '',
        imatge: ''
      },
      editIndex: null
    };
  },
  methods: {
    mostrarEstadistiques() {
      this.showStats = !this.showStats;
    },
    cargarPreguntes() {
      fetch('http://a23brioropoy.dam.inspedralbes.cat:26984/preguntes') // Actualizado
        .then(response => response.json())
        .then(data => {
          this.preguntes = data.preguntes;
          this.totalPreguntes = this.preguntes.length;
        })
        .catch(error => console.error('Error fetching questions:', error));
    },
    abrirFormulario(index) {
      if (index !== undefined) {
        this.editMode = true;
        this.editIndex = index;
        this.formData = {
          pregunta: this.preguntes[index].pregunta,
          resposta_correcta: this.preguntes[index].resposta_correcta,
          respostes_incorrectes: this.preguntes[index].respostes_incorrectes.join(', '),
          imatge: this.preguntes[index].imatge
        };
      } else {
        this.editMode = false;
        this.formData = {
          pregunta: '',
          resposta_correcta: '',
          respostes_incorrectes: '',
          imatge: ''
        };
      }
      this.showForm = true;
    },
    cancelarFormulario() {
      this.showForm = false;
      this.editMode = false;
      this.editIndex = null;
    },
    submitForm() {
      const { pregunta, resposta_correcta, respostes_incorrectes, imatge } = this.formData;
      const incorrectAnswers = respostes_incorrectes.split(',').map(ans => ans.trim());

      const data = {
        pregunta,
        resposta_correcta,
        respostes_incorrectes: incorrectAnswers,
        imatge
      };

      if (this.editMode) {
        fetch(`http://a23brioropoy.dam.inspedralbes.cat:26984/preguntes/${this.editIndex}`, { // Actualizado
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => {
          this.cargarPreguntes();
          this.cancelarFormulario();
        })
        .catch(error => console.error('Error updating question:', error));
      } else {
        fetch('http://a23brioropoy.dam.inspedralbes.cat:26984/preguntes', { // Actualizado
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => {
          this.cargarPreguntes();
          this.cancelarFormulario();
        })
        .catch(error => console.error('Error adding question:', error));
      }
    },
    eliminarPregunta(index) {
      fetch(`http://a23brioropoy.dam.inspedralbes.cat:26984/preguntes/${index}`, { // Actualizado
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(() => {
        this.cargarPreguntes();
      })
      .catch(error => console.error('Error deleting question:', error));
    }
  },
  mounted() {
    this.cargarPreguntes(); // Cargar preguntas cuando el componente esté montado
  }
}
</script>
