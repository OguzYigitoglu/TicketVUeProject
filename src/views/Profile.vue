<template>
  <div class="profile-container">
    <div v-if="user" class="user-info">
      <p>
        <strong>{{ $t("profile.name") }}:</strong> {{ user.name }}
      </p>
      <p>
        <strong>{{ $t("profile.surname") }}:</strong> {{ user.surname }}
      </p>
      <p>
        <strong>{{ $t("profile.email") }}:</strong> {{ user.email }}
      </p>
      <p v-if="user.firmName">
        <strong>{{ $t("profile.firmName") }}:</strong> {{ user.firmName }}
      </p>
    </div>

    <div v-else class="loading">
      <p>{{ $t("profile.loading") }}</p>
    </div>

    <!-- <button
      type="button"
      class="btn btn-primary"
      data-bs-toggle="modal"
      data-bs-target="#exampleModal"
      style="border-color: #64748b; background-color: #64748b"
    >
      {{ $t("profile.changePassword") }}
    </button> -->

    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">
              {{ $t("profile.changePassword") }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="password-change">
              <div class="input-group mb-3">
                <input
                  type="password"
                  class="form-control"
                  :placeholder="$t('profile.newPassword')"
                  v-model="newPassword"
                />
              </div>
              <div class="input-group mb-3">
                <input
                  type="password"
                  class="form-control"
                  :placeholder="$t('profile.confirmPassword')"
                  v-model="confirmPassword"
                />
              </div>
              <button @click="changePassword" class="btn btn-primary">
                {{ $t("profile.updatePassword") }}
              </button>
              <p v-if="passwordMessage" class="password-message">
                {{ passwordMessage }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const user = ref(null);
const newPassword = ref("");
const confirmPassword = ref("");
const passwordMessage = ref("");

const fetchUserData = async () => {
  const auth = getAuth();
  const db = getFirestore();

  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        user.value = userDoc.data();
        if (!user.value.isAdmin && user.value.firmId) {
          const firmDoc = await getDoc(doc(db, "firms", user.value.firmId));
          if (firmDoc.exists()) {
            user.value.firmName = firmDoc.data().firmName;
          }
        }
      }
    } else {
      user.value = null;
    }
  });
};

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    passwordMessage.value = $t("profile.passwordMismatch");
    return;
  }

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      await updatePassword(currentUser, newPassword.value);
      passwordMessage.value = $t("profile.passwordUpdated");
    } else {
      passwordMessage.value = $t("profile.sessionError");
    }
  } catch (error) {
    passwordMessage.value = $t("profile.errorUpdatingPassword", {
      error: error.message,
    });
  }
};

onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.user-info p {
  margin: 10px 0;
  font-size: 16px;
  color: #555;
}

.loading {
  text-align: center;
  font-size: 18px;
  color: #6c757d;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.password-change {
  margin-top: 20px;
}

.password-change .input-group {
  margin-bottom: 15px;
}

.password-message {
  margin-top: 10px;
}
</style>
