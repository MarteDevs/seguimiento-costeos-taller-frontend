<template>
  <v-app>
    <v-app-bar color="primary" elevation="1">
      <v-container class="d-flex align-center">
        <router-link to="/" class="text-white text-decoration-none">
          <strong>Seguimiento y Costeo</strong>
        </router-link>
      </v-container>
    </v-app-bar>
    <v-main>
      <v-container class="py-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
  
</template>

<style scoped>
.text-white { color: white; }
</style>