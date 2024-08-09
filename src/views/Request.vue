<template>
  <div class="container">
    <div class="header">
      <h1 class="mb-4">{{ $t("ticket.current_tickets") }}</h1>
      <div class="filter-buttons">
        <button
          @click="filterTickets('pending')"
          class="btn btn-warning"
          style="color: white"
        >
          {{ $t("pending") }}
        </button>
        <button
          @click="filterTickets('inProgress')"
          class="btn btn-info"
          style="color: white"
        >
          {{ $t("in_progress") }}
        </button>
        <button @click="filterTickets('completed')" class="btn btn-success">
          {{ $t("completed") }}
        </button>
        <button @click="filterTickets(null)" class="btn btn-secondary">
          {{ $t("all") }}
        </button>
      </div>
    </div>

    <hr />


    <h2 class="mb-4" v-if="filteredExistingProductTickets.length">
      {{ $t("ticket.existing_product_requests") }}
    </h2>
    <div class="mb-4" v-if="filteredExistingProductTickets.length">
      <ol class="list-group list-group-numbered">
        <li
          v-for="ticket in filteredExistingProductTickets"
          :key="ticket.id"
          class="list-group-item d-flex justify-content-between align-items-start mb-2"
        >
          <div class="ms-2 me-auto text-break">
            <div class="fw-bold text-break">
              <strong>{{ $t("ticket.product") }}: </strong>
              {{ ticket.product.name }}
            </div>
            <div class="text-break">
              <strong>{{ $t("ticket.ticket") }}: </strong>{{ ticket.request }}
            </div>
            <div>
              <strong>{{ $t("ticket.response") }}: </strong>
              {{ ticket.response || $t("ticket.no_response_yet") }}
            </div>
            <div>
              {{ $t("ticket.date") }}:
              {{ ticket.date ? new Date(ticket.date.seconds * 1000).toLocaleString() : "N/A" }}
            </div>
          </div>
          <span :class="['badge rounded-pill', ticketStatusClass(ticket.status)]">
            {{ $t(`status.${ticket.status}`) }}
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


    <h2 class="mb-4" v-if="filteredNewProductTickets.length">
      {{ $t("ticket.new_product_requests") }}
    </h2>
    <div class="mb-4" v-if="filteredNewProductTickets.length">
      <ol class="list-group list-group-numbered">
        <li
          v-for="ticket in filteredNewProductTickets"
          :key="ticket.id"
          class="list-group-item d-flex justify-content-between align-items-start mb-2"
        >
          <div class="ms-2 me-auto text-break">
            <div class="fw-bold text-break">
              <strong>{{ $t("ticket.product") }}: </strong>
              {{ ticket.product.name }}
            </div>
            <div class="text-break">
              <strong>{{ $t("ticket.ticket") }}: </strong>{{ ticket.request }}
            </div>
            <div>
              <strong>{{ $t("ticket.response") }}: </strong>
              {{ ticket.response || $t("ticket.no_response_yet") }}
            </div>
            <div>
              {{ $t("ticket.date") }}:
              {{ ticket.date ? new Date(ticket.date.seconds * 1000).toLocaleString() : "N/A" }}
            </div>
          </div>
          <span :class="['badge rounded-pill', ticketStatusClass(ticket.status)]">
            {{ $t(`status.${ticket.status}`) }}
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
    const localFirmName = localStorage.getItem("user");
    const firmName = JSON.parse(localFirmName).firmName;
    const trimmedRequest = computed(() => request.value.replace(/\s+/g, "").trim());
    const trimmedEditRequest = computed(() => editRequest.value.replace(/\s+/g, "").trim());
    const statusFilter = ref(null);

    const handleClick = async () => {
      if (user.value && selectedProduct.value && trimmedRequest.value.length >= 30) {
        await addDoc(collection(db, "tickets"), {
          id: user.value.uid,
          request: request.value,
          date: serverTimestamp(),
          status: "pending",
          product: selectedProduct.value,
        });
        request.value = "";
        selectedProduct.value = "";
        fetchTickets();
      }
    };

    const fetchTickets = async () => {
      tickets.value = [];
      if (user.value) {
        const q = query(collection(db, "tickets"), where("id", "==", user.value.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          tickets.value.push({ ...doc.data(), id: doc.id });
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
        if (item.firms.includes(firmName)) {
          products.value.push(item);
        }
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

    const showResponseModal = (ticket) => {
      selectedTicket.value = ticket;
      response.value = ticket.response || "";
      const modal = new bootstrap.Modal(document.getElementById("responseModal"));
      modal.show();
    };

    const submitResponse = async () => {
      if (selectedTicket.value) {
        await updateDoc(doc(db, "tickets", selectedTicket.value.id), {
          response: response.value,
          status: "completed",
        });
        fetchTickets();
        const modal = bootstrap.Modal.getInstance(document.getElementById("responseModal"));
        modal.hide();
        selectedTicket.value = null;
        response.value = "";
      }
    };

    const editTicket = (ticket) => {
      if (ticket.status !== "completed") {
        selectedTicket.value = ticket;
        editRequest.value = ticket.request;
        const modal = new bootstrap.Modal(document.getElementById("editModal"));
        modal.show();
      }
    };

    const submitEdit = async () => {
      if (selectedTicket.value && trimmedEditRequest.value.length >= 30 && selectedTicket.value.status !== "completed") {
        await updateDoc(doc(db, "tickets", selectedTicket.value.id), {
          request: editRequest.value,
        });
        fetchTickets();
        const modal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
        modal.hide();
        selectedTicket.value = null;
        editRequest.value = "";
      }
    };

    const filterTickets = (status) => {
      statusFilter.value = status;
    };

    const filteredTickets = computed(() => {
      if (statusFilter.value === null) {
        return tickets.value;
      }
      return tickets.value.filter((ticket) => ticket.status === statusFilter.value);
    });

    const newProductTickets = computed(() => {
      return tickets.value.filter(ticket => products.value.some(product => product.id === ticket.product.id));
    });

    const existingProductTickets = computed(() => {
      return tickets.value.filter(ticket => !products.value.some(product => product.id === ticket.product.id));
    });

    const filteredNewProductTickets = computed(() => {
      return filteredTickets.value.filter(ticket => newProductTickets.value.some(t => t.id === ticket.id));
    });

    const filteredExistingProductTickets = computed(() => {
      return filteredTickets.value.filter(ticket => existingProductTickets.value.some(t => t.id === ticket.id));
    });

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
      showResponseModal,
      selectedTicket,
      response,
      submitResponse,
      editTicket,
      editRequest,
      submitEdit,
      filterTickets,
      filteredTickets,
      ticketStatusClass,
      trimmedRequest,
      trimmedEditRequest,
      newProductTickets,
      existingProductTickets,
      filteredNewProductTickets,
      filteredExistingProductTickets,
    };
  },
};
</script>




<style scoped>
.container {
  max-width: 1300px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-buttons .btn {
  border-radius: 50px;
  padding: 0.5rem 1rem;
}

.list-group-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.bg-warning {
  background-color: #ffc107 !important;
}
.bg-info {
  background-color: #56d9ed !important;
}
.bg-success {
  background-color: #14da42 !important;
}

.modal-dialog-centered {
  display: flex;
  align-items: center;
}
.modal-content {
  max-height: 80vh;
  overflow-y: auto;
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
}
</style>
