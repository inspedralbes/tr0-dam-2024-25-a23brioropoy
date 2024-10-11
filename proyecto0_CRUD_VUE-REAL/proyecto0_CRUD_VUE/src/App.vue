<template>
  <div id="app">
    <ListaPreguntes />
  </div>
</template>

<script>
import ListaPreguntes from './components/ListaPreguntes.vue'; // Asegúrate de que el camino es correcto

export default {
  components: {
    ListaPreguntes, // Correcto registro del componente
  }
}
</script>

<style>
@import './assets/styles.css'; 
</style>
