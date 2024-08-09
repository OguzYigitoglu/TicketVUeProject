<template>
  <main class="form-signin m-auto w-100">
    <div class="row">
      <div class="col-12">
        <p class="lead mb-4" style="margin-top: 85px">
          {{ $t("login.title") }}
        </p>
        <div class="form-floating mb-3">
          <input
            type="email"
            class="form-control form-control-lg"
            id="floatingInput"
            placeholder="{{ $t('login.email') }}"
            v-model="email"
            required
          />
          <label for="floatingInput">{{ $t("login.email") }}</label>
        </div>
        <div class="form-floating mb-4">
          <input
            type="password"
            class="form-control form-control-lg"
            id="floatingPassword"
            placeholder="{{ $t('login.password') }}"
            v-model="password"
            @keyup.enter="signIn"
          />
          <label for="floatingPassword">{{ $t("login.password") }}</label>
        </div>
        <button
          @click="showForgotPasswordModal"
          class="btn btn-link mt-3 w-100 forgot-password-link"
        >
          {{ $t("login.forgot_password") }}
        </button>
        <PvButton
          :label="$t('login.sign_in')"
          icon="pi pi-user"
          severity="secondary"
          class="rounded w-75"
          @click="signIn"
        />
      </div>
    </div>

    <div
      v-if="errMsg"
      class="toast align-items-center text-bg-danger border-0 show"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body">{{ errMsg }}</div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          @click="errMsg = ''"
          aria-label="Close"
        ></button>
      </div>
    </div>

    <div
      v-if="isForgotPasswordModalVisible"
      class="modal fade show"
      tabindex="-1"
      style="display: block"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ $t("login.forgot_password_modal_title") }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hideForgotPasswordModal"
            ></button>
          </div>
          <div class="modal-body">
            <p>{{ $t("login.forgot_password_modal_body") }}</p>
            <input
              type="email"
              class="form-control"
              v-model="forgotPasswordEmail"
              placeholder="E-Mail"
            />
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="hideForgotPasswordModal"
            >
              {{ $t("login.cancel") }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="resetPassword"
            
            >
              {{ $t("login.reset_password") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "vue-router";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useUserStore } from "@/stores/UserStore.js";

const email = ref("");
const password = ref("");
const errMsg = ref("");
const isForgotPasswordModalVisible = ref(false);
const forgotPasswordEmail = ref("");

const router = useRouter();
const auth = getAuth();
const db = getFirestore();
const store = useUserStore();

const signIn = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;
    const userData = await fetchUserData(user.uid);

    localStorage.setItem("user", JSON.stringify(userData));
    store.fetchUser(user.uid);
    router.push("/");
  } catch (error) {
    handleAuthError(error);
  }
};

const fetchUserData = async (uid) => {
  const userDoc = doc(db, "users", uid);
  const userSnap = await getDoc(userDoc);
  if (userSnap.exists()) return userSnap.data();
  throw new Error("Kullanıcı bulunamadı");
};

const handleAuthError = (error) => {
  switch (error.code) {
    case "auth/invalid-email":
      errMsg.value = $t("login.error.invalid_email");
      break;
    case "auth/user-not-found":
      errMsg.value = $t("login.error.user_not_found");
      break;
    case "auth/wrong-password":
      errMsg.value = $t("login.error.wrong_password");
      break;
    default:
      errMsg.value = $t("login.error.generic");
      break;
  }
};

const showForgotPasswordModal = () => {
  isForgotPasswordModalVisible.value = true;
};

const hideForgotPasswordModal = () => {
  isForgotPasswordModalVisible.value = false;
  forgotPasswordEmail.value = "";
};

const resetPassword = async () => {
  if (!forgotPasswordEmail.value) {
    errMsg.value = $t("login.error.generic");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, forgotPasswordEmail.value);
    hideForgotPasswordModal();
    alert($t("login.password_reset_email_sent"));
  } catch (error) {
    handleAuthError(error);
  }
};
</script>

<style scoped>
.form-signin {
  text-align: center;
  font-family: "Arial", sans-serif;
  font-size: 1rem;
  margin: 180px auto 0;
  max-width: 400px;
}

.lead {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-floating {
  position: relative;
  margin-bottom: 1.5rem;
}

.btn-link {
  color: #007bff;
  font-weight: bold;
}

.btn-link:hover {
  color: #0056b3;
}

.toast {
  background-color: #f8d7da;
  color: #721c24;
}

.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  border-radius: 0.375rem;
}

.modal-header .btn-close {
  filter: invert(1);
}

.forgot-password-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
