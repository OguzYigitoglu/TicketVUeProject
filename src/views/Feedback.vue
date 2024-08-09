<template>
  <div class="feedback-page">
    <h1>{{ $t("feedbacks") }}</h1>
    <div v-if="loading" class="loading">{{ $t("loading") }}</div>
    <ul v-else class="feedback-list">
      <li v-for="feedback in feedbacks" :key="feedback.id">
        <p>{{ feedback.feedback }}</p>
        <small>{{ new Date(feedback.timestamp.seconds * 1000).toLocaleString() }} - {{ feedback.firmName }}</small>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const feedbacks = ref([]);
const loading = ref(true);

const fetchFeedbacks = async () => {
  try {
    const db = getFirestore();
    const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
    feedbacks.value = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchFeedbacks);
</script>

<style scoped>
.feedback-page {
  max-width: 900px;
  margin: 3rem auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  font-size: 1.75rem;
  color: #333;
}

.feedback-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feedback-list li {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  background: #fff;
  margin-bottom: 1rem;
}

.feedback-list li:last-child {
  border-bottom: none;
}

.feedback-list p {
  margin: 0;
  font-size: 1.125rem;
}

.feedback-list small {
  display: block;
  font-size: 0.875rem;
  color: #555;
}
</style>
