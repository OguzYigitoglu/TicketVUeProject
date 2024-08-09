<template>
  <div class="container my-4">
    <div class="input-group mb-4">
      <div class="form-floating w-100">
        <textarea
          class="form-control"
          :placeholder="$t('company_name')"
          id="floatingTextarea2"
          v-model="newfirmName"
        ></textarea>
        <label for="floatingTextarea2">{{ $t("company_name") }}</label>
      </div>
    </div>
    <div class="d-grid gap-2 col-6 mx-auto mb-4">
      <button
        @click="handleFirmaClick"
        class="btn btn-primary"
        type="button"
        style="background-color: #64748b; border-color: #64748b"
      >
        {{ $t("add_company") }}
      </button>
    </div>
    <hr />
    <h1 class="my-4">{{ $t("companies") }}</h1>
    <div class="mb-3">
      <ol class="list-group list-group-numbered">
        <li
          v-for="firma in filteredfirms"
          :key="firma.id"
          class="list-group-item d-flex justify-content-between align-items-start"
        >
          <div class="w-75">
            <div v-if="editFirmaId === firma.id">
              <input
                v-model="editfirmName"
                type="text"
                class="form-control"
                :placeholder="$t('new_company_name')"
              />
              <div class="mt-2">
                <button
                  @click="handleUpdateFirma(firma.id)"
                  class="btn btn-success btn-sm"
                >
                  {{ $t("update") }}
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-secondary btn-sm ms-2"
                >
                  {{ $t("cancel") }}
                </button>
              </div>
            </div>
            <div v-else>
              <span>{{ firma.firmName }}</span>
              <button
                @click="startEdit(firma)"
                class="btn btnen-warning btn-sm ms-2"
              >
                <i class="bi bi-gear-fill"></i>
              </button>
              <div
                v-if="firma.assignedusersIds && firma.assignedusersIds.length"
                class="mt-2"
              >
                <strong>{{ $t("employee_name") }}:</strong>
                <ul>
                  <li v-for="usersId in firma.assignedusersIds" :key="usersId">
                    {{ getusers(usersId).name }} {{ getusers(usersId).surname }}
                    <button
                      @click="removeusersFromFirma(firma, usersId)"
                      class="btn btn-sm btn-danger ms-2"
                    >
                      <i class=""></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <button @click="handleDelete(firma.id)" class="btn btn-danger ms-2">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </li>
      </ol>
    </div>
  </div>
  <div aria-live="polite" aria-atomic="true" class="position-relative">
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div
        v-for="(toast, index) in toasts"
        :key="index"
        class="toast show align-items-center"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style="background-color: #2dc951; color: white"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toast.message }}
          </div>
          <button
            type="button"
            class="btn-close me-2 m-auto"
            @click="removeToast(index)"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/main";
import { useI18n } from "vue-i18n";

export default {
  setup() {
    const newfirmName = ref("");
    const firms = ref([]);
    const users = ref([]);
    const currentusers = ref(null);
    const editFirmaId = ref(null);
    const editfirmName = ref("");
    const toasts = ref([]);
    const { t } = useI18n();

    const fetchfirms = async () => {
      const querySnapshot = await getDocs(collection(db, "firms"));
      firms.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    const fetchusers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      users.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    const handleFirmaClick = async () => {
      if (newfirmName.value.trim() === "") return;

      const newFirmNameLower = newfirmName.value.trim().toLowerCase();
      const existingFirma = firms.value.find(
        (firma) => firma.firmName.toLowerCase() === newFirmNameLower
      );

      if (existingFirma) {
        showToast(t("company_exists"));
        return;
      }

      await addDoc(collection(db, "firms"), {
        firmName: newfirmName.value,
        assignedusersIds: [],
      });

      newfirmName.value = "";
      showToast(t("company_added"));

    
      fetchfirms();
    };

    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "firms", id));
      showToast(t("company_deleted"));

      
      fetchfirms();
    };

    const startEdit = (firma) => {
      editFirmaId.value = firma.id;
      editfirmName.value = firma.firmName;
    };

    const handleUpdateFirma = async (id) => {
      await updateDoc(doc(db, "firms", id), { firmName: editfirmName.value });
      editFirmaId.value = null;
      editfirmName.value = "";
      showToast(t("company_updated"));


      fetchfirms();
    };

    const cancelEdit = () => {
      editFirmaId.value = null;
      editfirmName.value = "";
    };

    const removeusersFromFirma = async (firma, usersId) => {
      const firmaRef = doc(db, "firms", firma.id);
      const updatedAssignedusers = firma.assignedusersIds.filter(
        (id) => id !== usersId
      );
      await updateDoc(firmaRef, { assignedusersIds: updatedAssignedusers });
      showToast(t("employee_removed"));


      fetchfirms();
    };

    const getusers = (usersId) => {
      return users.value.find((users) => users.id === usersId) || {};
    };

    const filteredfirms = computed(() => {
      if (!currentusers.value) return firms.value;
      return firms.value.filter((firma) =>
        firma.assignedusersIds.includes(currentusers.value.id)
      );
    });

    const showToast = (message) => {
      toasts.value.push({ message });
      setTimeout(() => {
        toasts.value.shift();
      }, 3000);
    };

    onMounted(() => {
      const unsubscribefirms = onSnapshot(
        collection(db, "firms"),
        (snapshot) => {
          firms.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      );

      const unsubscribeusers = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          users.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      );

      currentusers.value = users.value[0];

      return () => {
        unsubscribefirms();
        unsubscribeusers();
      };
    });

    return {
      newfirmName,
      firms,
      users,
      currentusers,
      handleFirmaClick,
      handleDelete,
      removeusersFromFirma,
      getusers,
      editFirmaId,
      editfirmName,
      startEdit,
      handleUpdateFirma,
      cancelEdit,
      filteredfirms,
      toasts,
      showToast,
      removeToast: (index) => toasts.value.splice(index, 1),
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.input-group {
  border-radius: 10px;
  border: 1px solid #ced4da;
}

.form-floating label {
  color: #495057;
}

.form-control {
  border: 1px solid #ced4da;
  border-radius: 10px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  border-color: #00bcd4;
  box-shadow: 0 0 0 0.2rem rgba(0, 188, 212, 0.25);
}

.btn-primary {
  background-color: #00bcd4;
  border-color: #00bcd4;
  color: #ffffff;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #00a2c5;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: black;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-warning:hover {
  background-color: #e0a800;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.list-group-item {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 15px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.list-group-item div {
  text-align: left;
}

h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #343a40;
}

.toast-container {
  z-index: 1050;
}
.btnen-warning {
  background-color: white;
}
</style>
