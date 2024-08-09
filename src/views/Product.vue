<template>
  <div class="container mt-5">
    <div class="input-group mb-3">
      <input
        v-model="newProduct"
        type="text"
        class="form-control"
        :placeholder="$t('service_name')"
      />
    </div>
    <div class="d-grid gap-2 col-6 mx-auto">
      <button
        @click="addProduct"
        class="btn btn-outline-secondary"
        type="button"
      >
        {{ $t("add_service") }}
      </button>
    </div>
    <hr />
    <h1>{{ $t("services") }}</h1>
    <div class="mb-3">
      <ol class="list-group list-group-numbered">
        <li
          v-for="(product) in products"
          :key="product.id"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          <div class="ms-2 me-auto">
            <div v-if="!product.editing">{{ product.name }}</div>
            <div v-else>
              <input v-model="product.newName" class="form-control" />
            </div>
            <ul>
              <li v-for="(firm, firmIndex) in product.firms" :key="firmIndex">
                {{ firm }}
                <button
                  @click="removeFirmFromProduct(product, firm)"
                  class="btn btn-sm btn-danger ms-2"
                >
                  <i class=""></i>
                </button>
              </li>
            </ul>
          </div>
          <div>
            <button
              type="button"
              class="btn btn-primary"
              @click="selectProduct(product)"
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
            >
              +
            </button>
            <button
              v-if="!product.editing"
              @click="startEditing(product)"
              class="btn btn-outline-secondary ms-2"
              style="background-color: #6c757d; color: white"
            >
              <i class="bi bi-gear-fill"></i>
            </button>
            <button
              v-else
              @click="saveEditing(product)"
              class="btn btn-success ms-2"
            >
              {{ $t("save") }}
            </button>
            <button
              @click="handleDelete(product.id)"
              class="btn btn-danger ms-2"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </li>
      </ol>
    </div>

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
              {{ $t("add_firm") }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <select
              v-model="selectedFirm"
              class="form-select"
              aria-label="Select Firm"
            >
              <option disabled selected>{{ $t("select_firm") }}</option>
              <option
                v-for="firm in firms"
                :key="firm.id"
                :value="firm.firmName"
              >
                {{ firm.firmName }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              {{ $t("close") }}
            </button>
            <button type="button" class="btn btn-primary" @click="saveFirm">
              {{ $t("add_firm") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div aria-live="polite" aria-atomic="true" class="position-relative">
      <div class="toast-container position-fixed top-0 end-0 p-3">
        <div
          v-for="(toast, index) in toasts"
          :key="index"
          class="toast show align-items-center"
          role="alert"
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
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/main";
import { useI18n } from "vue-i18n";

export default {
  setup() {
    const { t } = useI18n();
    const newProduct = ref("");
    const products = ref([]);
    const firms = ref([]);
    const selectedFirm = ref("");
    const selectedProduct = ref(null);
    const toasts = ref([]);

    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      products.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        editing: false,
        newName: doc.data().name,
      }));
    };

    const fetchfirms = async () => {
      const querySnapshot = await getDocs(collection(db, "firms"));
      firms.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
      showToast(t("service_deleted"));
    };

    const addProduct = async () => {
      if (newProduct.value.trim()) {
        await addDoc(collection(db, "products"), {
          name: newProduct.value,
          firms: [],
          timestamp: serverTimestamp(),
        });
        newProduct.value = "";
        fetchProducts();
        showToast(t("service_added"));
      }
    };

    const selectProduct = (product) => {
      selectedProduct.value = product;
      selectedFirm.value = "";
    };

    const saveFirm = async () => {
      if (selectedProduct.value && selectedFirm.value) {
        const productDoc = doc(db, "products", selectedProduct.value.id);
        await updateDoc(productDoc, {
          firms: arrayUnion(selectedFirm.value),
        });
        fetchProducts();
        showToast(t("firm_added"));
      }
    };

    const removeFirmFromProduct = async (product, firm) => {
      const productDoc = doc(db, "products", product.id);
      await updateDoc(productDoc, {
        firms: arrayRemove(firm),
      });
      fetchProducts();
      showToast(t("firm_removed"));
    };

    const startEditing = (product) => {
      product.editing = true;
    };

    const saveEditing = async (product) => {
      const productDoc = doc(db, "products", product.id);
      await updateDoc(productDoc, {
        name: product.newName,
      });
      product.name = product.newName;
      product.editing = false;
      showToast(t("service_updated"));
    };

    const showToast = (message) => {
      toasts.value.push({ message });
      setTimeout(() => removeToast(0), 3000);
    };

    const removeToast = (index) => {
      toasts.value.splice(index, 1);
    };

    onMounted(() => {
      fetchProducts();
      fetchfirms();
    });

    return {
      newProduct,
      products,
      firms,
      selectedFirm,
      addProduct,
      handleDelete,
      selectProduct,
      saveFirm,
      removeFirmFromProduct,
      startEditing,
      saveEditing,
      toasts,
      removeToast,
      showToast,
      t,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin-top: 20px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #343a40;
}

.list-group-item {
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.modal-body {
  margin-bottom: 20px;
}

.toast-container .toast {
  background-color: #28a745;
  color: #fff;
  border-radius: 8px;
}

.toast-container .toast .btn-close {
  background: transparent;
  border: none;
  color: #fff;
  opacity: 1;
}
</style>
