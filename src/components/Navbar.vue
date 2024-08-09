<template>
  <nav
    v-if="!loading"
    class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top"
  >
    <div class="container-fluid">
      <a class="navbar-brand" href="/">{{ t("customer_request_form") }}</a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" aria-current="page" href="/">
              <span class="bi bi-house-door"></span> {{ t("home") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && !isAdmin">
            <a class="nav-link" aria-current="page" href="/ticket">
              <span class="bi bi-file-earmark-plus"></span> {{ t("create_request") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && !isAdmin">
            <a class="nav-link" aria-current="page" href="/request">
              <span class="bi bi-card-list"></span> {{ t("my_requests") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && isAdmin">
            <a class="nav-link" aria-current="page" href="/adminticket">
              <span class="bi bi-card-list"></span> {{ t("requests") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && isAdmin">
            <a class="nav-link" aria-current="page" href="/product">
              <span class="bi bi-file-earmark-code"></span> {{ t("services") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && !isAdmin">
            <a class="nav-link" aria-current="page" href="/communication">
              <span  class="bi bi-chat-right-dots"></span> {{ t("communication") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && isAdmin">
            <a class="nav-link" aria-current="page" href="/feedback">
              <span  class="bi bi-chat-right-dots"></span> {{ t("feedback") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && isAdmin">
            <a class="nav-link" aria-current="page" href="/firm">
              <span class="bi bi-people"></span> {{ t("company_name") }}
            </a>
          </li>
          <li class="nav-item" v-show="isAuthenticated && isAdmin">
            <a class="nav-link" aria-current="page" href="/register">
              <span class="bi bi-person-plus"></span> {{ t("create_account") }}
            </a>
          </li>
          <li class="nav-item dropdown cursor-pointer">
            <a
              class="nav-link dropdown-"
              href="#"
              id="languageDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ currentLanguage }}
            </a>
            <ul class="dropdown-menu" aria-labelledby="languageDropdown">
              <li>
                <a class="dropdown-item" @click="changeLanguage('tr')">Türkçe</a>
              </li>
              <li>
                <a class="dropdown-item" @click="changeLanguage('en')">İngilizce</a>
              </li>
            </ul>
          </li>
          <li class="nav-item" v-show="isAuthenticated">
            <a class="nav-link" aria-current="page" href="/profile">
              <span class="bi bi-person"></span> {{ t("")  }}
            </a>
          </li>
          <li class="nav-item">
            <router-link
              to="/sign-in"
              v-show="!isAuthenticated"
              class="nav-link btn btn-outline-success"
              type="submit"
            >
              <i class="bi bi-box-arrow-in-right"></i>
              <span class="d-lg-none d-inline">{{ t("sign_in") }}</span>
            </router-link>
          </li>
          <li class="nav-item" v-show="isAuthenticated">
            <button
              class="nav-link btn btn-outline-danger"
              type="button"
              @click.prevent="handleLogout"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span class="d-lg-none d-inline">{{ t("sign_out") }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

export default {
  setup() {
    const auth = getAuth();
    const router = useRouter();
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const loading = ref(true);
    const companies = ref("");
    const { t, locale } = useI18n();

    const currentLanguage = computed(() => locale.value.toUpperCase());

    const changeLanguage = (lang) => {
      locale.value = lang;
    };

    onMounted(() => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          isAuthenticated.value = true;
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            isAdmin.value = userDoc.data().role === "admin";
            companies.value = userDoc.data().companies || t("company_name");
          }
        } else {
          isAuthenticated.value = false;
          isAdmin.value = false;
        }
        loading.value = false;
      });
    });

    const handleLogout = async () => {
      try {
        await signOut(auth);
        isAuthenticated.value = false;
        isAdmin.value = false;
        router.push("/");
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    };

    return {
      t,
      companies,
      
      currentLanguage,
      changeLanguage,
      isAuthenticated,
      isAdmin,
      handleLogout,
      loading,
    };
  },
};
</script>

<style scoped>
.navbar {
  background-color: #3a4856;
}

.nav-link {
  display: flex;
  align-items: center;
}

.nav-link i, .nav-link span.bi {
  margin-right: 12px; 
}

.nav-link i {
  transition: color 0.3s ease, transform 0.3s ease;
}

.nav-link:hover span {
  color: #f0f0f0;
  transform: scale(1.2);
  cursor: pointer;
}

.navbar-toggler {
  border: none;
}

.navbar-toggler:focus {
  outline: none;
  box-shadow: none;
}

.cursor-pointer {
  cursor: pointer;
}

.dropdown-item {
  cursor: pointer;
}
</style>
