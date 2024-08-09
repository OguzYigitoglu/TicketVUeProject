import { defineStore } from "pinia";
import { db } from "@/main";
import { doc, getDoc } from "firebase/firestore";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    ulist: []
  }),
  actions: {
    async fetchUser(userId) {
      try {
        const userDoc = doc(db, "users", userId);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log("Document data:", userData);

          this.ulist.push({
            firmName: userData.firmName || "",
            name: userData.name || "",
            surname: userData.surname || "",
            role: userData.role || "",
            uid: userId,
            firmId: userData.firmId || "",
          });

          console.log("Updated state:", this.ulist);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
  },
});
