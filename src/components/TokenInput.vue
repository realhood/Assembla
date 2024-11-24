<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['token-submit']);
const tokenInput = ref('');

const handleSubmit = () => {
  if (tokenInput.value.trim()) {
    emit('token-submit', tokenInput.value.trim());
  }
};
</script>

<template>
  <div class="max-w-md mx-auto bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
    <h2 class="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
      Enter AssemblyAI Token
    </h2>
    
    <p class="text-gray-400 text-sm mb-6">
      For testing, you can use this API key:
      <code class="px-2 py-1 bg-gray-800 rounded-md text-purple-300 font-mono">
        b1e10d9dc8404755a9818b1a0cf58989
      </code>
    </p>

    <div class="space-y-4">
      <input
        v-model="tokenInput"
        type="password"
        placeholder="Your AssemblyAI Token"
        class="w-full p-3 bg-gray-800/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-500 transition-all duration-300"
      />
      
      <button
        @click="handleSubmit"
        class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Submit Token
      </button>
    </div>
  </div>
</template>