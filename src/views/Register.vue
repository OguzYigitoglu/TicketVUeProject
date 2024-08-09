<template>
  <main class="form-register m-auto">
    <div class="container">
      <div class="row mb-5">
        <div class="col-md-6">
          <div
            class="register-form p-4 rounded"
            style="
              background-color: rgba(var(--bs-light-rgb), var(--bs-bg-opacity));
              --bs-bg-opacity: 1;
            "
          >
            <h2 class="section-title mb-4">{{ $t("createAccount") }}</h2>
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                :placeholder="$t('firstName')"
                v-model="name"
              />
            </div>
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                :placeholder="$t('lastName')"
                v-model="surname"
              />
            </div>
            <div class="input-group mb-3">
              <input
                type="email"
                class="form-control"
                :placeholder="$t('email')"
                v-model="email"
              />
            </div>
            <div class="input-group mb-3">
              <input
                type="password"
                class="form-control"
                :placeholder="$t('password')"
                v-model="password"
              />
            </div>
            <div class="input-group mb-3">
              <select
                class="form-control"
                v-model="selectedFirm"
                :disabled="role === 'admin'"
              >
                <option value="" disabled>{{ $t("selectCompany") }}</option>
                <option v-for="firm in firms" :key="firm.id" :value="firm.id">
                  {{ firm.firmName }}
                </option>
              </select>
            </div>
            <div class="input-group mb-3">
              <select class="form-control" v-model="role">
                <option value="user">{{ $t("user") }}</option>
                <option value="admin">{{ $t("admin") }}</option>
              </select>
            </div>
            <PvButton
              :label="$t('createAccount')"
              icon="pi pi-user"
              severity="secondary"
              class="rounded w-30"
              @click="register"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="admin-list p-4 rounded bg-light">
            <h2 class="section-title mb-4">{{ $t("adminList") }}</h2>
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">{{ $t("firstName") }}</th>
                  <th scope="col">{{ $t("lastName") }}</th>
                  <th scope="col">{{ $t("email") }}</th>
                  <th scope="col">{{ $t("role") }}</th>
                  <th scope="col">{{ $t("action") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="admin in admins" :key="admin.id">
                  <td>{{ admin.name }}</td>
                  <td>{{ admin.surname }}</td>
                  <td>{{ admin.email }}</td>
                  <td>{{ admin.role }}</td>
                  <td>
                    <button
                      @click="editUser(admin)"
                      class="btn btn-warning btn-sm mx-2"
                      style="background-color: #64748b; color: white; border-color: #64748b;"
                    >
                      <span class="bi bi-gear-fill"></span>
                    </button>
                    <button
                      @click="deleteUser(admin.id)"
                      class="btn btn-danger btn-sm"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="btn-group mb-3">
        <button
          @click="clearFilter"
          class="btn btn-outline-secondary"
          style="background-color: #64748b; border-color: #64748b; color: white"
        >
          {{ $t("allUsers") }}
        </button>
        <button
          type="button"
          class="btn btn-danger dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          style="background-color: #64748b; border-color: #64748b"
        >
          {{ $t("filterCompanies") }}
        </button>
        <ul class="dropdown-menu">
          <li v-for="firm in firms" :key="firm.id">
            <button class="dropdown-item" @click="filterByFirm(firm.id)">
              {{ firm.firmName }}
            </button>
          </li>
        </ul>
      </div>
      <div class="user-list p-4 rounded bg-light">
        <h2 class="section-title mb-4">{{ $t("userList") }}</h2>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th scope="col">{{ $t("firstName") }}</th>
              <th scope="col">{{ $t("lastName") }}</th>
              <th scope="col">{{ $t("email") }}</th>
              <th scope="col">{{ $t("company") }}</th>
              <th scope="col">{{ $t("role") }}</th>
              <th scope="col">{{ $t("action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.surname }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.firmName }}</td>
              <td>{{ user.role }}</td>
              <td>
                <button
                  @click="editUser(user)"
                  class="btn btn-warning btn-sm mx-2"
                  style="background-color: #64748b; color: white; border-color: #64748b;"
                >
                  <span class="bi bi-gear-fill"></span>
                </button>
                <button
                  @click="deleteUser(user.id)"
                  class="btn btn-danger btn-sm"
                >
                  <i class="bi bi-x"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isEditModalVisible" class="modal fade show" tabindex="-1" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ $t("edit") }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                :placeholder="$t('firstName')"
                v-model="editName"
              />
            </div>
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                :placeholder="$t('lastName')"
                v-model="editSurname"
              />
            </div>
            <div class="input-group mb-3">
              <input
                type="email"
                class="form-control"
                :placeholder="$t('email')"
                v-model="editEmail"
              />
            </div>
            <div class="input-group mb-3">
              <select class="form-control" v-model="editRole">
                <option value="" disabled>{{ $t("selectRole") }}</option>
                <option value="user">{{ $t("user") }}</option>
                <option value="admin">{{ $t("admin") }}</option>
              </select>
            </div>
            <button @click="submitEdit" class="btn btn-primary w-100">
              {{ $t("update") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";

const db = getFirestore();
const auth = getAuth();
const router = useRouter();

const name = ref("");
const surname = ref("");
const email = ref("");
const password = ref("");
const firms = ref([]);
const selectedFirm = ref("");
const role = ref("user");
const users = ref([]);
const filteredUsers = ref([]);
const admins = ref([]);
const editName = ref("");
const editSurname = ref("");
const editEmail = ref("");
const editRole = ref("");
const editUserId = ref(null);
const isEditModalVisible = ref(false);
const firmNameMap = ref({});

const fetchFirms = async () => {
  const querySnapshot = await getDocs(collection(db, "firms"));
  firms.value = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  firmNameMap.value = firms.value.reduce((map, firm) => {
    map[firm.id] = firm.firmName;
    return map;
  }, {});
};

const fetchUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  users.value = [];
  admins.value = [];
  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.role === "admin") {
      admins.value.push({ id: doc.id, ...userData });
    } else {
      users.value.push({ id: doc.id, ...userData });
    }
  });
  filteredUsers.value = users.value.map((user) => ({
    ...user,
    firmName: firmNameMap.value[user.firmId] || "",
  }));
};

const register = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const userId = userCredential.user.uid;

    const userDoc = {
      name: name.value,
      surname: surname.value,
      email: email.value,
      role: role.value,
      firmId: selectedFirm.value,
      firmName: firmNameMap.value[selectedFirm.value] || "",
    };

    if (selectedFirm.value) {
      const firmRef = doc(db, "firms", selectedFirm.value);
      await updateDoc(firmRef, {
        assignedusersIds: arrayUnion(userId),
      });
    }

    await setDoc(doc(db, "users", userId), userDoc);

    name.value = "";
    surname.value = "";
    email.value = "";
    password.value = "";
    selectedFirm.value = "";
    role.value = "user";

    await fetchUsers();
  } catch (error) {
    console.error("Error creating user:", error);
  }
};

const editUser = (user) => {
  editUserId.value = user.id;
  editName.value = user.name;
  editSurname.value = user.surname;
  editEmail.value = user.email;
  editRole.value = user.role;
  isEditModalVisible.value = true;
};

const submitEdit = async () => {
  if (!editUserId.value) return;

  try {
    await updateDoc(doc(db, "users", editUserId.value), {
      name: editName.value,
      surname: editSurname.value,
      email: editEmail.value,
      role: editRole.value,
    });

    await fetchUsers();
    isEditModalVisible.value = false;
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    await fetchUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};

const filterByFirm = (firmId) => {
  filteredUsers.value = users.value
    .filter((user) => user.firmId === firmId)
    .map((user) => ({
      ...user,
      firmName: firmNameMap.value[user.firmId] || "",
    }));
};

const clearFilter = () => {
  filteredUsers.value = users.value.map((user) => ({
    ...user,
    firmName: firmNameMap.value[user.firmId] || "",
  }));
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
};

onMounted(() => {
  fetchFirms();
  fetchUsers();
});
</script>

<style scoped>
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.register-form,
.admin-list {
  background: #fff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.input-group {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.btn {
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #0056b3;
}

.btnen-warning {
  background-color: white;
}

.table {
  margin-top: 1rem;
}

.table th,
.table td {
  vertical-align: middle;
}

.table th {
  background-color: #f8f9fa;
}

.modal-body .input-group {
  margin-bottom: 1rem;
}
</style>
