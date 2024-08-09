import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      async (user) => {
        if (user) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            resolve({ ...user, role: userDoc.data().role });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
        removeListener();
      },
      reject
    );
  });      
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("../views/Home.vue") },
    { path: "/register", component: () => import("../views/Register.vue"), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: "/sign-in", component: () => import("../views/SignIn.vue") }, 
    { path: "/firm", component: () => import("../views/Firm.vue"), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: "/product", component: () => import("../views/Product.vue"), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: "/ticket", component: () => import("../views/Ticket.vue"), meta: { requiresAuth: true } },
    { path: "/profile", component: () => import("../views/Profile.vue"), meta: { requiresAuth: true } },
    { path: "/request", component: () => import("../views/Request.vue"), meta: { requiresAuth: true } },
    { path: "/request", component: () => import("../views/Request.vue"), meta: { requiresAuth: true } },
    { path: "/communication", component: () => import("../views/Communication.vue"), meta: { requiresAuth: true } },
    { path: "/adminticket", component: () => import("../views/AdminTicket.vue"), meta: { requiresAuth: true, requiresAdmin: true} },
    { path: "/feedback", component: () => import("../views/Feedback.vue"), meta: { requiresAuth: true, requiresAdmin: true} },
    { path: "/:pathMatch(.*)*", redirect: '/' }
  ]
});

router.beforeEach(async (to, from, next) => {
  const currentUser = await getCurrentUser();
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!currentUser) {
      alert("Lütfen Giriş Yapınız!");
      next({ path: '/sign-in' });
    } else {
      if (to.matched.some(record => record.meta.requiresAdmin) && currentUser.role !== 'admin') {
        alert("Bu sayfaya erişim yetkiniz yok!");
        next({ path: '/' });
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

export default router;
