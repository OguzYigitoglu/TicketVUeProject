<template>
  <div class="container">
    <div class="input-group mb-4">
      <select
        v-model="selectedProduct"
        @change="handleProductChange"
        class="form-select"
        aria-label="Select a product"
      >
        <option value="" disabled>{{ $t("ticket.select_product") }}</option>
        <option value="1">Yeni Ürün Talebi</option>
        <option v-for="product in products" :key="product.id" :value="product">
          {{ product.name }}
        </option>
      </select>
    </div>

    <div v-if="newProductRequest || selectedProduct" class="mb-4">
      <form @submit.prevent="handleClick">

        <div class="form-floating">
        <textarea
          class="form-control"
          placeholder="{{ $t('ticket.enter_request') }}"
          id="floatingTextarea2"
          style="height: 100px"
          v-model="request"
        ></textarea>
        <label for="floatingTextarea2">{{ $t("ticket.your_request") }}</label>
        <div v-if="trimmedRequest.length < 30" class="character-limit">
          {{ trimmedRequest.length }} / 30
        </div>
      </div>

      <div class="d-grid gap-2 col-6 mx-auto mb-4">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="!selectedProduct || trimmedRequest.length < 30"
          style="
            background-color: rgb(100, 116, 139);
            border-color: rgb(100, 116, 139);
            margin-top: 30px;;
          "
        >
          {{ $t("ticket.add_ticket") }}
        </button>
      </div>
      </form>
    </div>

    <hr />
    <h1 class="mb-4">{{ $t("ticket.current_tickets") }}</h1>

    <h2 class="mb-4" v-if="newProductTickets.length">Yeni Ürün Talepleri</h2>
    <div class="mb-4" v-if="newProductTickets.length">
      <ol class="list-group list-group-numbered">
        <li
          v-for="ticket in newProductTickets"
          :key="ticket.id"
          class="list-group-item d-flex justify-content-between align-items-start"
          style="margin-bottom: 10px"
        >
          <div class="ms-2 me-auto text-break">
            <div class="fw-bold text-break">
              <strong>{{ $t("ticket.product") }}</strong
              >{{ "Yeni Ürün Talebi" }}
            </div>
            <div class="text-break">
              <strong>{{ $t("ticket.ticket") }}</strong
              >{{ ticket.request }}
            </div>
            <div>
              <strong>{{ $t("ticket.response") }}</strong>
              {{ ticket.response || $t("ticket.no_response_yet") }}
            </div>
            <div>
              {{ $t("ticket.date") }}
              {{ ticket.date ? ticket.date.toDate().toLocaleString() : "N/A" }}
            </div>
          </div>
          <span
            :class="['badge rounded-pill', ticketStatusClass(ticket.status)]"
          >
            {{ $t(`status.${ticket.status}`) }}
          </span>
          <span
            v-if="ticket.status !== 'completed'"
            @click="editTicket(ticket)"
            class="badge bgen-warning mx-2"
          >
            <i class="bi bi-pencil"></i>
          </span>
          <span
            @click="handleDelete(ticket.id)"
            class="badge bg-danger mx-2"
            :disabled="ticket.status === 'completed'"
          >
            <i class="bi bi-x cursor-pointer"></i>
          </span>
        </li>
      </ol>
    </div>

   
    <div
      class="modal fade"
      id="editModal"
      tabindex="-1"
      aria-labelledby="editModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editModalLabel">Edit Ticket</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <textarea
              v-model="editRequest"
              class="form-control"
              placeholder="Edit your request"
            ></textarea>
            <label for="floatingTextarea2">{{ $t("ticket.your_request") }}</label>
        <div v-if="trimmedRequest.length < 30" class="character-limit">
          {{ trimmedRequest.length }} / 30
        </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button type="button" class="btn btn-primary" @click="submitEdit">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>

    <h2 class="mb-4" v-if="existingProductTickets.length">
      Mevcut Ürün Talepleri
    </h2>
    <div class="mb-4" v-if="existingProductTickets.length">
      <ol class="list-group list-group-numbered">
        <li
          v-for="ticket in existingProductTickets"
          :key="ticket.id"
          class="list-group-item d-flex justify-content-between align-items-start"
          style="margin-bottom: 10px"
        >
          <div class="ms-2 me-auto text-break">
            <div class="fw-bold text-break">
              <strong>{{ $t("ticket.product") }}</strong
              >{{ ticket.product.name }}
            </div>
            <div class="text-break">
              <strong>{{ $t("ticket.ticket") }}</strong
              >{{ ticket.request }}
            </div>
            <div>
              <strong>{{ $t("ticket.response") }}</strong>
              {{ ticket.response || $t("ticket.no_response_yet") }}
            </div>
            <div>
              {{ $t("ticket.date") }}
              {{ ticket.date ? ticket.date.toDate().toLocaleString() : "N/A" }}
            </div>
          </div>
          <span
            :class="['badge rounded-pill', ticketStatusClass(ticket.status)]"
          >
            {{ $t(`status.${ticket.status}`) }}
          </span>
          <span
            v-if="ticket.status !== 'completed'"
            @click="editTicket(ticket)"
            class="badge bgen-warning mx-2"
          >
            <i class="bi bi-pencil"></i>
          </span>
          <span
            @click="handleDelete(ticket.id)"
            class="badge bg-danger mx-2"
            :disabled="ticket.status === 'completed'"
          >
            <i class="bi bi-x"></i>
          </span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/main";

export default {
  setup() {
    const auth = getAuth();
    const user = ref(auth.currentUser);
    const request = ref("");
    const tickets = ref([]);
    const products = ref([]);
    const selectedProduct = ref("");
    const selectedTicket = ref(null);
    const response = ref("");
    const editRequest = ref("");

    const newProductRequest = ref(false);
    const newProductTickets = ref([]); 
    const existingProductTickets = ref([]); 
    const firmName = JSON.parse(localStorage.getItem("user")).firmName;
    const trimmedRequest = computed(() =>
      request.value.replace(/\s+/g, "").trim()
    );
    const trimmedEditRequest = computed(() =>
      editRequest.value.replace(/\s+/g, "").trim()
    );

    const handleProductChange = () => {
      newProductRequest.value = selectedProduct.value === "1";
    };

    const handleClick = async () => {
      if (
        user.value &&
        selectedProduct.value &&
        trimmedRequest.value.length >= 30
      ) {
        await addDoc(collection(db, "tickets"), {
          id: user.value.uid,
          request: request.value,
          date: serverTimestamp(),
          status: "pending",
          product:
            selectedProduct.value === "1"
              ? { name: "Yeni Ürün Talebi", id: "1" }
              : selectedProduct.value,
          firmName: firmName,
        });

        request.value = "furkan";
        selectedProduct.value = "";
        fetchTickets();
        newProductRequest.value = false;
      }
    };

    const fetchTickets = async () => {
      tickets.value = [];
      newProductTickets.value = [];
      existingProductTickets.value = [];
      if (user.value) {
        const q = query(
          collection(db, "tickets"),
          where("id", "==", user.value.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const ticket = { ...doc.data(), id: doc.id };
          if (ticket.product.id === "1") {
            newProductTickets.value.push(ticket);
          } else {
            existingProductTickets.value.push(ticket);
          }
        });
      }
    };

    const fetchProducts = async () => {
      let temp = [];
      products.value = [];
      const querySnapshot = await getDocs(collection(db, "products"));
      querySnapshot.forEach((doc) => {
        temp.push({ ...doc.data(), id: doc.id });
      });
      temp.forEach((item) => {
        item.firms.forEach((items) => {
          if (items === firmName) products.value.push(item);
        });
      });
    };

    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "tickets", id));
      fetchTickets();
    };

    const updateTicketStatus = async (ticket, newStatus) => {
      if (ticket.status !== "completed") {
        await updateDoc(doc(db, "tickets", ticket.id), { status: newStatus });
        fetchTickets();
      }
    };

    const editTicket = (ticket) => {
      if (ticket.status !== "completed") {
        selectedTicket.value = ticket;
        editRequest.value = ticket.request;
        const modalElement = document.getElementById("editModal");
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    };

    const submitEdit = async () => {
      if (
        selectedTicket.value &&
        trimmedEditRequest.value.length >= 30 &&
        selectedTicket.value.status !== "completed"
      ) {
        await updateDoc(doc(db, "tickets", selectedTicket.value.id), {
          request: editRequest.value,
        });
        fetchTickets();
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editModal")
        );
        modal.hide();
        selectedTicket.value = null;
        editRequest.value = "";
      }
    };

    onMounted(() => {
      fetchTickets();
      fetchProducts();
    });

    const ticketStatusClass = (status) => {
      return {
        "bg-warning": status === "pending",
        "bg-info": status === "inProgress",
        "bg-success": status === "completed",
      };
    };

    return {
      request,
      handleClick,
      tickets,
      products,
      selectedProduct,
      handleDelete,
      updateTicketStatus,
      selectedTicket,
      editTicket,
      editRequest,
      submitEdit,
      ticketStatusClass,
      trimmedRequest,
      trimmedEditRequest,
      firmName,
      newProductRequest,
      handleProductChange,
      newProductTickets,
      existingProductTickets,
    };
  },
};
</script>


<style scoped>
.container {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
}

input,
select,
textarea {
  border-radius: 5px;
}

.form-select,
.form-control {
  border: 1px solid #ced4da;
  border-radius: 5px;
}

.form-control:focus,
.form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(38, 143, 255, 0.25);
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.character-limit {
  font-size: 14px;
  color: #6c757d;
}

.modal-dialog {
  display: flex;
  align-items: center;
}

.modal-content {
  border-radius: 10px;
  overflow: hidden;
}

.modal-header {
  background-color: #3a4856;
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.bg-warning {
  background-color: #ffc107 !important;
}

.bg-info {
  background-color: #17a2b8 !important;
}

.bg-success {
  background-color: #28a745 !important;
}

.badge {
  border-radius: 50px;
  padding: 0.5rem 1rem;
}

.badge.bg-warning {
  background-color: #ffc107;
}

.badge.bg-danger {
  background-color: #dc3545;
}
.bgen-warning {
  background-color: gray;
}
</style>
