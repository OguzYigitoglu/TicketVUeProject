<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="title">{{ $t('tickets') }}</span>
      <div class="filter-buttons" >
        <button @click="filterTickets('pending')" class="btn btn-warning" style="color: white;">{{ $t('pending') }}</button>
        <button @click="filterTickets('inProgress')" class="btn btn-info" style="color: white;">{{ $t('in_progress') }}</button>
        <button @click="filterTickets('completed')" class="btn btn-success">{{ $t('completed') }}</button>
        <button @click="filterTickets(null)" class="btn btn-secondary">{{ $t('all') }}</button>
      </div>
    </div>

    <hr />

    <div class="mb-3">
      <ol class="list-group list-group-numbered">
        <li
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="list-group-item d-flex justify-content-between align-items-start"
        >
          <div class="ms-2 me-auto">
            <div class="fw-bold text-break"><strong>{{ $t('product') }}: </strong> {{ ticket.product.name }}</div>
            <div class="fw-bold text-break"><strong>{{ $t('company') }}: </strong> {{ ticket.firmName }}</div>
            <div class="fw-bold text-break"><strong>{{ $t('ticket') }}: </strong> {{ ticket.request }}</div>
            <div class="fw-bold text-break"><strong>{{ $t('response') }}: </strong> {{ ticket.response || $t('no_response') }}</div>
            <div class="fw-bold text-break">{{ $t('date') }}: {{ ticket.date ? ticket.date.toDate().toLocaleString() : "N/A" }}</div>
          </div>
          <div class="ms-auto d-flex align-items-center">
            <span :class="['badge rounded-pill', ticketStatusClass(ticket.status)]">{{ ticketStatusText(ticket.status) }}</span>
            <div class="dropdown ms-2">
              <button class="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false" :disabled="ticket.status === 'completed'">
                <i class="bi bi-gear-fill"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" @click="updateTicketStatus(ticket, 'pending')">{{ $t('pending') }}</a></li>
                <li><a class="dropdown-item" href="#" @click="updateTicketStatus(ticket, 'inProgress')">{{ $t('in_progress') }}</a></li>
                <li><a class="dropdown-item" href="#" @click="showResponseModal(ticket)">{{ $t('completed') }}</a></li>
              </ul>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div v-if="selectedTicket" class="modal fade" tabindex="-1" id="responseModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ $t('provide_response') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <textarea v-model="response" class="form-control" rows="3" placeholder="Enter your response"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('close') }}</button>
            <button type="button" class="btn btn-primary" @click="submitResponse">{{ $t('complete_process') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div aria-live="polite" aria-atomic="true" class="position-relative">
      <div class="toast-container position-fixed top-0 end-0 p-3">
        <div v-for="(toast, index) in toasts" :key="index" class="toast show align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">{{ toast.message }}</div>
            <button type="button" class="btn-close me-2 m-auto" @click="removeToast(index)" aria-label="Close"></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { addDoc, collection, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/main";
import { useI18n } from "vue-i18n";

export default {
  setup() {
    const auth = getAuth();
    const user = ref(auth.currentUser);
    const content = ref("");
    const tickets = ref([]);
    const filterBy = ref(null);
    const selectedTicket = ref(null);
    const response = ref("");
    const toasts = ref([]);
    const { t } = useI18n();

    const fetchTickets = async () => {
      const querySnapshot = await getDocs(collection(db, "tickets"));
      tickets.value = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    };

    const handleClick = async () => {
      if (user.value) {
        await addDoc(collection(db, "tickets"), {
          userName: user.value.displayName,
          content: content.value,
          company: "Company Name",
          product: "Product Name",
          date: serverTimestamp(),
          status: "pending",
          response: "",
        });
        fetchTickets();
      }
    };

    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "tickets", id));
      fetchTickets();
    };

    const updateTicketStatus = async (ticket, newStatus) => {
      if (ticket.status !== "completed") {
        await updateDoc(doc(db, "tickets", ticket.id), { status: newStatus });
        fetchTickets();
        showToast(newStatus === "completed" ? t('ticket_completed') : t('ticket_updated'));
      }
    };

    const showToast = (message, type = "success") => {
      toasts.value.push({ message, type });
      setTimeout(() => toasts.value.shift(), 3000);
    };

    const ticketStatusClass = (status) => ({
      "bg-warning": status === "pending",
      "bg-info": status === "inProgress",
      "bg-success": status === "completed",
    });

    const ticketStatusText = (status) => ({
      pending: t('pending'),
      inProgress: t('in_progress'),
      completed: t('completed'),
    })[status];

    const filteredTickets = computed(() => filterBy.value ? tickets.value.filter(ticket => ticket.status === filterBy.value) : tickets.value);

    const filterTickets = (status) => {
      filterBy.value = status;
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
        showToast(t('ticket_completed'));
      }
    };

    const removeToast = (index) => {
      toasts.value.splice(index, 1);
    };

    onMounted(fetchTickets);

    return {
      content,
      handleClick,
      tickets,
      handleDelete,
      updateTicketStatus,
      ticketStatusClass,
      ticketStatusText,
      filteredTickets,
      filterTickets,
      showResponseModal,
      selectedTicket,
      response,
      submitResponse,
      toasts,
      removeToast,
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

.bg-warning { background-color: #ffc107 !important; }
.bg-info { background-color: #56d9ed !important; }
.bg-success { background-color: #14da42 !important; }

.modal-dialog-centered { display: flex; align-items: center; }
.modal-content { max-height: 80vh; overflow-y: auto; }

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
