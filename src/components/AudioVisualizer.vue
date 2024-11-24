<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import WaveSurfer from "wavesurfer.js";
import { useTranscriptionStore } from "../stores/transcription";

const props = defineProps<{
  audioBlob?: Blob;
}>();

const store = useTranscriptionStore();
const waveformRef = ref<HTMLDivElement | null>(null);
const wavesurfer = ref<WaveSurfer | null>(null);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const emit = defineEmits(['timeUpdate']);

const destroyWavesurfer = () => {
  if (wavesurfer.value) {
    wavesurfer.value.destroy();
    wavesurfer.value = null;
  }
};

const createWaveform = async () => {
  if (!waveformRef.value || !props.audioBlob) return;

  try {
    // Destroy existing instance before creating a new one
    destroyWavesurfer();

    wavesurfer.value = WaveSurfer.create({
      container: waveformRef.value,
      waveColor: '#8b5cf6',
      progressColor: '#6366f1',
      cursorColor: '#f472b6',
      cursorWidth: 2,
      height: 100,
      normalize: true,
      plugins: []
    });

    wavesurfer.value.on('play', () => isPlaying.value = true);
    wavesurfer.value.on('pause', () => isPlaying.value = false);
    wavesurfer.value.on('timeupdate', (currentTime) => {
      emit('timeUpdate', currentTime);
    });

    const audioUrl = URL.createObjectURL(props.audioBlob);
    await wavesurfer.value.load(audioUrl);
    URL.revokeObjectURL(audioUrl); // Clean up the URL after loading
  } catch (error) {
    console.error('Error creating waveform:', error);
  }
};

const togglePlayPause = () => {
  if (wavesurfer.value) {
    wavesurfer.value.playPause();
  }
};

const seekTo = (time: number) => {
  if (wavesurfer.value) {
    // Convert milliseconds to seconds and set the position
    const seconds = time / 1000;
    wavesurfer.value.setTime(seconds);
    wavesurfer.value.play();
  }
};

const setPlaybackSpeed = (speed: number) => {
  if (wavesurfer.value) {
    playbackSpeed.value = speed;
    wavesurfer.value.setPlaybackRate(speed);
  }
};

// Watch for changes in audioBlob and transcription result
watch(() => props.audioBlob, createWaveform);
watch(() => store.transcriptionResult, createWaveform);

// Clean up on component unmount
onBeforeUnmount(() => {
  destroyWavesurfer();
});

defineExpose({ seekTo });
</script>

<template>
  <div class="bg-gray-900/50 backdrop-blur-lg p-6 rounded-2xl border border-purple-500/20">
    <div ref="waveformRef" class="mb-4"></div>
    <div class="flex items-center justify-between">
      <button
        @click="togglePlayPause"
        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
      >
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>

      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-400">Speed:</span>
        <select
          v-model="playbackSpeed"
          @change="setPlaybackSpeed(Number(playbackSpeed))"
          class="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-500/20"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  </div>
</template>