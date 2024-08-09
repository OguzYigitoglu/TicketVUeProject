<template>
    <div class="main">
      <div class="feedback-section">
        <h2>{{ $t("submit_feedback") }}</h2>
        <textarea
          v-model="feedbackText"
          placeholder="Enter your feedback here..."
          class="feedback-textarea"
        ></textarea>
        <button
          @click="submitFeedback"
          class="btn btn-primary"
          :style="{ backgroundColor: '#64748b', borderColor: '#64748b' }"
        >
          {{ $t("submit") }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    addDoc,
  } from "firebase/firestore";
  import { useI18n } from "vue-i18n";
  
  const { t } = useI18n();
  const auth = getAuth();
  const isAdmin = ref(false);
  const isAuthenticated = ref(false);
  const loading = ref(true);
  const totalRequests = ref(0);
  const pendingRequests = ref(0);
  const inProgressRequests = ref(0);
  const completedRequests = ref(0);
  const feedbackText = ref("");
  
  const submitFeedback = async () => {
    if (feedbackText.value.trim() === "") {
      alert(t("feedback_empty_error"));
      return;
    }
  
    try {
      const db = getFirestore();
      await addDoc(collection(db, "feedbacks"), {
        userId: auth.currentUser.uid,
        feedback: feedbackText.value,
        timestamp: new Date(),
      });
      feedbackText.value = "";
      alert(t("feedback_submitted_success"));
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      alert(t("feedback_submission_error"));
    }
  };
  
  onMounted(async () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        isAuthenticated.value = true;
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          isAdmin.value = userDoc.data().role === "admin";
          try {
            const requestsCollection = collection(db, "tickets");
            const q = isAdmin.value
              ? requestsCollection
              : query(requestsCollection, where("userId", "==", user.uid));
  
            const snapshot = await getDocs(q);
  
            totalRequests.value = snapshot.size;
  
            pendingRequests.value = 0;
            inProgressRequests.value = 0;
            completedRequests.value = 0;
  
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.status === "pending") {
                pendingRequests.value++;
              } else if (data.status === "in_progress") {
                inProgressRequests.value++;
              } else if (data.status === "completed") {
                completedRequests.value++;
              }
            });
          } catch (error) {
            console.error("Error fetching requests: ", error);
          }
        }
      } else {
        isAuthenticated.value = false;
        isAdmin.value = false;
      }
      loading.value = false;
    });
  });
  </script>
  
  <style scoped>
  .main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: white;
    padding: 3rem;
  }
  
  .feedback-section {
    padding: 3rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    background-color: #f0f0f0;
    width: 100%;
    max-width: 1000px;
    text-align: center;
  }
  
  .feedback-section h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }
  
  .feedback-textarea {
    width: 100%;
    min-height: 250px;
    padding: 1.5rem;
    font-size: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    resize: vertical;
    margin-bottom: 2rem;
  }
  
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 3rem;
    font-size: 1.75rem;
    font-weight: bold;
    color: #fff;
    border-radius: 0.25rem;
    text-decoration: none;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  .btn-primary:hover {
    background-color: #0056b3;
    border-color: #00408a;
  }
  </style>
  