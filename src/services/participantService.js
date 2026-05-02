import { doc, getDoc, runTransaction, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

let cachedParticipants = null;

export const getAllParticipants = async () => {
  if (cachedParticipants) return cachedParticipants;
  
  try {
    const querySnapshot = await getDocs(collection(db, "participants"));
    const participants = [];
    querySnapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    
    cachedParticipants = participants;
    return participants;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
};

export const searchParticipantsByName = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) return [];
  
  const participants = await getAllParticipants();
  const term = searchTerm.toLowerCase().trim();
  
  const matches = participants.filter(p => p.name && p.name.toLowerCase().includes(term));
  
  matches.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aStarts = aName.startsWith(term);
    const bStarts = bName.startsWith(term);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return aName.localeCompare(bName);
  });

  return matches.slice(0, 5);
};

export const getParticipantDetails = async (code) => {
  if (!code) throw new Error("Invalid QR Code");
  
  const docRef = doc(db, "participants", code);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Invalid QR: Participant not found.");
  }
  
  return docSnap.data();
};

export const processParticipant = async (code, actionType) => {
  if (!code) throw new Error("Invalid QR Code");

  const docRef = doc(db, "participants", code);

  return await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists()) {
      throw new Error("Invalid QR: Participant not found.");
    }

    const data = docSnap.data();

    if (actionType === 'entry') {
      if (data.entry === true) {
        throw new Error("Already entered");
      }
      transaction.update(docRef, {
        entry: true,
        entryTime: Date.now()
      });
      return { success: true, message: `Access Granted: ${data.name}`, data };
    } 
    
    if (actionType === 'food') {
      if (data.foodTaken === true) {
        throw new Error("Already processed: Food taken");
      }
      transaction.update(docRef, {
        foodTaken: true
      });
      return { success: true, message: `Food marked for ${data.name} (${data.foodPreference || 'No preference'})`, data };
    }

    if (actionType === 'goodies') {
      if (data.goodiesCollected === true) {
        throw new Error("Already processed: Goodies collected");
      }
      transaction.update(docRef, {
        goodiesCollected: true
      });
      return { success: true, message: `Goodies marked for ${data.name}`, data };
    }

    throw new Error("Invalid action type");
  });
};
