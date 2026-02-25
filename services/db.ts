
import { StudySession, Subject, DEFAULT_SUBJECTS, DailyGoal, Task, Exam, ChatMessage, JournalEntry, DailyNote, CustomSound, UserProfile, Friend, FriendStatus, MockTest } from '../types';
import { db, rtdb } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, writeBatch, onSnapshot, Unsubscribe, query, where, updateDoc, increment, limit, orderBy } from 'firebase/firestore';
import { ref, update as rtdbUpdate, set as rtdbSet, serverTimestamp, remove as rtdbRemove } from 'firebase/database';
import { XP_PER_MINUTE, getLevelFromXP, getRankInfo } from '../utils/xp';

const DB_NAME = 'EkagrazoneDB';
const DB_VERSION = 10; 
const STORE_SESSIONS = 'sessions';
const STORE_SUBJECTS = 'subjects';
const STORE_GOALS = 'goals';
const STORE_TASKS = 'tasks';
const STORE_EXAMS = 'exams';
const STORE_CHATS = 'chats';
const STORE_JOURNAL = 'journal';
const STORE_DAILY_NOTES = 'daily_notes';
const STORE_CUSTOM_SOUNDS = 'custom_sounds';
const STORE_MOCK_TESTS = 'mock_tests';

const LOCAL_STORAGE_KEYS = [
  'ekagrazone_targetHours',
  'ekagrazone_wallpaper',
  'ekagrazone_wallpaper_home',
  'ekagrazone_enableZenMode',
  'ekagrazone_space_url',
  'ekagrazone_theme_accent',
  'ekagrazone_timer_durations',
  'ekagrazone_custom_personas',
  'ekagrazone_ai_personality',
  'ekagrazone_habits', 
  'ekagrazone_chat_history'
];

class LocalDB {
  private db: IDBDatabase | null = null;
  private userId: string | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private syncTimeout: any = null;

  setUserId(uid: string | null) {
    this.userId = uid;
    if (!uid) {
        this.stopRealtimeSync();
    } else {
        this.ensureUserProfile();
    }
  }

  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const createStore = (name: string, keyPath: string = 'id', index?: string) => {
            if (!db.objectStoreNames.contains(name)) {
                const store = db.createObjectStore(name, { keyPath });
                if (index) store.createIndex(index, index, { unique: false });
            }
        };
        createStore(STORE_SESSIONS, 'id', 'dateString');
        if (!db.objectStoreNames.contains(STORE_SUBJECTS)) {
          const subjectStore = db.createObjectStore(STORE_SUBJECTS, { keyPath: 'id' });
          DEFAULT_SUBJECTS.forEach(sub => subjectStore.add(sub));
        }
        createStore(STORE_GOALS, 'id', 'dateString');
        createStore(STORE_TASKS, 'id', 'dateString'); 
        createStore(STORE_EXAMS);
        createStore(STORE_CHATS);
        createStore(STORE_JOURNAL, 'id', 'dateString');
        createStore(STORE_DAILY_NOTES, 'id', 'dateString');
        createStore(STORE_CUSTOM_SOUNDS);
        createStore(STORE_MOCK_TESTS, 'id', 'date');
      };
    });
  }

  // --- Real-time Sync ---
  startRealtimeSync() {
      if (!this.userId) return;
      this.stopRealtimeSync(); 
      console.log("Starting real-time sync for user:", this.userId);

      const collections = [STORE_SESSIONS, STORE_SUBJECTS, STORE_GOALS, STORE_TASKS, STORE_EXAMS, STORE_JOURNAL, STORE_CHATS, STORE_DAILY_NOTES, STORE_MOCK_TESTS];

      collections.forEach(colName => {
          const q = collection(db, 'users', this.userId!, colName);
          let isInitialLoad = true;
          const unsub = onSnapshot(q, async (snapshot) => {
              const localDb = await this.connect();
              const tx = localDb.transaction(colName, 'readwrite');
              const store = tx.objectStore(colName);
              if (isInitialLoad) {
                  const cloudIds = new Set(snapshot.docs.map(d => d.id));
                  const getAllKeysReq = store.getAllKeys();
                  getAllKeysReq.onsuccess = () => {
                      const localIds = getAllKeysReq.result as string[];
                      localIds.forEach(localId => {
                          if (!cloudIds.has(localId)) store.delete(localId);
                      });
                  };
                  isInitialLoad = false;
              }
              snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added' || change.type === 'modified') store.put(change.doc.data());
                  if (change.type === 'removed') store.delete(change.doc.id);
              });
              // Debounce sync complete event
              if (this.syncTimeout) clearTimeout(this.syncTimeout);
              this.syncTimeout = setTimeout(() => {
                  window.dispatchEvent(new Event('ekagrazone_sync_complete'));
              }, 500);
          }, (error) => {
              console.warn(`Sync error for ${colName}:`, error.message);
          });
          this.unsubscribers.push(unsub);
      });

      const settingsRef = doc(db, 'users', this.userId, 'settings', 'config');
      const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              Object.keys(data).forEach(key => {
                  if (LOCAL_STORAGE_KEYS.includes(key)) {
                      const currentValue = localStorage.getItem(key);
                      if (currentValue !== data[key]) localStorage.setItem(key, data[key]);
                  }
              });
          } else {
              LOCAL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
          }
          window.dispatchEvent(new Event('ekagrazone_sync_complete'));
          window.dispatchEvent(new Event('storage'));
      }, (error) => {
          console.warn("Settings sync error:", error.message);
      });
      this.unsubscribers.push(unsubSettings);
  }

  stopRealtimeSync() {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
  }

  // --- Social & Leaderboard Features ---

  async ensureUserProfile() {
      if (!this.userId) return;
      const userRef = doc(db, 'user_profiles', this.userId);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            const sessions = await this.getAllSessions();
            const totalTime = sessions.reduce((acc, s) => acc + s.durationMs, 0);
            const totalXP = Math.floor(totalTime / 60000) * XP_PER_MINUTE;
            const level = getLevelFromXP(totalXP);
            
            await setDoc(userRef, {
                uid: this.userId,
                totalFocusMs: totalTime,
                xp: totalXP,
                level: level,
                lastActive: Date.now()
            }, { merge: true });
        }
      } catch (e) {
          console.warn("Could not ensure user profile (likely permission issue):", e);
      }
  }

  async getUserProfile(): Promise<UserProfile | null> {
      if (!this.userId) {
          // Guest Mode Profile - Retrieve from LocalStorage
          const xp = parseInt(localStorage.getItem('ekagrazone_guest_xp') || '0');
          const level = parseInt(localStorage.getItem('ekagrazone_guest_level') || '1');
          const totalFocusMs = parseInt(localStorage.getItem('ekagrazone_guest_totalFocusMs') || '0');
          
          return {
              uid: 'guest',
              displayName: 'Guest',
              email: '',
              totalFocusMs,
              xp,
              level,
              lastActive: Date.now()
          };
      }
      
      try {
        const snap = await getDoc(doc(db, 'user_profiles', this.userId));
        return snap.exists() ? snap.data() as UserProfile : null;
      } catch (e) {
          console.warn("Error getting user profile:", e);
          return null;
      }
  }

  // 1. Check Username Availability
  async isUsernameTaken(username: string): Promise<boolean> {
      const normalized = username.toLowerCase().trim();
      const usernameRef = doc(db, 'usernames', normalized);
      const snap = await getDoc(usernameRef);
      return snap.exists();
  }

  // 2. Claim Username (Atomic Batch)
  async claimUsername(username: string) {
      if(!this.userId) return;
      const normalized = username.toLowerCase().trim();
      const batch = writeBatch(db);

      // Create entries in 'usernames' collection
      const usernameRef = doc(db, 'usernames', normalized);
      batch.set(usernameRef, { uid: this.userId });

      // Update user profile
      const profileRef = doc(db, 'user_profiles', this.userId);
      batch.update(profileRef, { username: normalized });

      await batch.commit();
  }

  // Update cumulative focus time and XP
  async updateUserStats(addedDurationMs: number): Promise<{ levelUp: boolean, newLevel: number }> {
      const xpGained = Math.floor(addedDurationMs / 60000) * XP_PER_MINUTE;

      // Dispatch XP gained event for sound effects
      if (xpGained > 0) {
          window.dispatchEvent(new Event('ekagra_xp_gained'));
      }

      if (!this.userId) {
          // Guest Mode Logic - Update LocalStorage
          const currentXP = parseInt(localStorage.getItem('ekagrazone_guest_xp') || '0');
          const currentLevel = parseInt(localStorage.getItem('ekagrazone_guest_level') || '1');
          const currentTotalMs = parseInt(localStorage.getItem('ekagrazone_guest_totalFocusMs') || '0');

          const newXP = Math.max(0, currentXP + xpGained); // Ensure XP doesn't go below 0
          const newTotalMs = Math.max(0, currentTotalMs + addedDurationMs);
          const newLevel = getLevelFromXP(newXP);
          const levelUp = newLevel > currentLevel;

          localStorage.setItem('ekagrazone_guest_xp', newXP.toString());
          localStorage.setItem('ekagrazone_guest_level', newLevel.toString());
          localStorage.setItem('ekagrazone_guest_totalFocusMs', newTotalMs.toString());

          return { levelUp, newLevel };
      }
      
      // Cloud Logic
      const userRef = doc(db, 'user_profiles', this.userId);

      try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
              const data = snap.data() as UserProfile;
              const currentXP = data.xp || 0;
              const currentLevel = data.level || 1;
              const currentTotalMs = data.totalFocusMs || 0;
              
              const newXP = Math.max(0, currentXP + xpGained);
              const newLevel = getLevelFromXP(newXP);
              const levelUp = newLevel > currentLevel;
              const newTotalMs = currentTotalMs + addedDurationMs;

              await updateDoc(userRef, {
                  totalFocusMs: increment(addedDurationMs),
                  xp: newXP,
                  level: newLevel,
                  lastActive: Date.now()
              });

              // Sync to Realtime Database for Leaderboard
              // Path: users/{uid}/stats
              const statsRef = ref(rtdb, `users/${this.userId}/stats`);
              rtdbUpdate(statsRef, {
                  totalXP: newXP,
                  level: newLevel,
                  totalFocusMs: newTotalMs,
                  displayName: data.displayName || 'Anonymous',
                  photoURL: data.photoURL || null
              }).catch(e => console.warn("RTDB sync warning:", e));

              // --- MILESTONE TRIGGER ---
              if (levelUp) {
                  const milestoneRef = ref(rtdb, `users/${this.userId}/milestones/latest`);
                  const rankInfo = getRankInfo(newLevel);
                  rtdbSet(milestoneRef, {
                      username: data.displayName || 'Friend',
                      message: `reached Level ${newLevel}!`,
                      tier: rankInfo.title,
                      tierColor: rankInfo.color, // Storing color ref for convenience
                      level: newLevel,
                      timestamp: serverTimestamp()
                  }).catch(e => console.error("Milestone broadcast failed", e));
              }

              return { levelUp, newLevel };
          } else {
              await this.ensureUserProfile();
              // Recursive call once profile ensured
              return this.updateUserStats(addedDurationMs);
          }
      } catch (e) {
          console.error("Error updating stats", e);
          return { levelUp: false, newLevel: 1 };
      }
  }

  // Leaderboard Subscription (Live)
  subscribeToLeaderboard(callback: (users: UserProfile[]) => void, limitCount: number = 10): Unsubscribe {
      const q = query(
          collection(db, 'user_profiles'),
          orderBy('xp', 'desc'),
          limit(limitCount)
      );

      return onSnapshot(q, (snapshot) => {
          const users: UserProfile[] = [];
          snapshot.forEach((doc) => {
              users.push(doc.data() as UserProfile);
          });
          callback(users);
      }, (error) => {
          console.warn("Leaderboard subscription error:", error.message);
          callback([]); // Return empty list on error to prevent UI crash
      });
  }

  // 3. Find User via Username Lookup
  async findUserByUsername(queryStr: string): Promise<UserProfile | null> {
      const cleanQuery = queryStr.startsWith('@') ? queryStr.substring(1) : queryStr;
      const normalized = cleanQuery.toLowerCase().trim();

      // Look up UID from usernames collection
      const usernameRef = doc(db, 'usernames', normalized);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
          const uid = usernameSnap.data().uid;
          // Fetch full profile
          const profileSnap = await getDoc(doc(db, 'user_profiles', uid));
          if (profileSnap.exists()) return profileSnap.data() as UserProfile;
      }

      return null;
  }

  async sendFriendRequest(friendUid: string) {
      if (!this.userId || this.userId === friendUid) return;
      const batch = writeBatch(db);
      const myRef = doc(db, 'users', this.userId, 'friends', friendUid);
      batch.set(myRef, { uid: friendUid, status: 'pending_sent', addedAt: Date.now() });
      const theirRef = doc(db, 'users', friendUid, 'friends', this.userId);
      batch.set(theirRef, { uid: this.userId, status: 'pending_received', addedAt: Date.now() });
      await batch.commit();
  }

  async acceptFriendRequest(friendUid: string) {
      if (!this.userId) return;
      const batch = writeBatch(db);
      const myRef = doc(db, 'users', this.userId, 'friends', friendUid);
      batch.update(myRef, { status: 'accepted' });
      const theirRef = doc(db, 'users', friendUid, 'friends', this.userId);
      batch.update(theirRef, { status: 'accepted' });
      await batch.commit();
  }

  subscribeToFriends(callback: (friends: Friend[]) => void): Unsubscribe | null {
      if (!this.userId) return null;
      const q = collection(db, 'users', this.userId, 'friends');
      return onSnapshot(q, async (snapshot) => {
          const friends: Friend[] = [];
          const friendDocs = snapshot.docs.map(d => d.data() as Friend);
          
          // Parallel fetch profiles for efficiency
          const profilePromises = friendDocs.map(async (f) => {
              if (f.status === 'accepted' || f.status === 'pending_received') {
                  const pSnap = await getDoc(doc(db, 'user_profiles', f.uid));
                  if (pSnap.exists()) {
                      f.profile = pSnap.data() as UserProfile;
                  }
              }
              return f;
          });

          const resolvedFriends = await Promise.all(profilePromises);
          callback(resolvedFriends);
      }, (error) => {
          console.warn("Friends subscription error:", error.message);
      });
  }

  // ... (Rest of existing methods remain unchanged)
  async getFriendTasks(friendUid: string, dateString: string): Promise<Task[]> {
      try {
          const q = query(collection(db, 'users', friendUid, 'tasks'), where('dateString', '==', dateString));
          const snap = await getDocs(q);
          return snap.docs.map(d => d.data() as Task);
      } catch (e) {
          console.error("Could not fetch friend tasks.", e);
          return [];
      }
  }

  async getFriendSessions(friendUid: string, dateString: string): Promise<StudySession[]> {
      try {
          const q = query(collection(db, 'users', friendUid, 'sessions'), where('dateString', '==', dateString));
          const snap = await getDocs(q);
          return snap.docs.map(d => d.data() as StudySession);
      } catch (e) {
          console.error("Could not fetch friend sessions.", e);
          return [];
      }
  }

  async getFriendSubjects(friendUid: string): Promise<Subject[]> {
      try {
          const snap = await getDocs(collection(db, 'users', friendUid, 'subjects'));
          return snap.docs.map(d => d.data() as Subject);
      } catch (e) {
          console.error("Could not fetch friend subjects.", e);
          return DEFAULT_SUBJECTS;
      }
  }

  async updateProfileMeta(name: string, email: string, photoURL: string | null) {
      if (!this.userId) return;
      const userRef = doc(db, 'user_profiles', this.userId);
      await setDoc(userRef, {
          displayName: name,
          email: email,
          photoURL: photoURL,
          lastActive: Date.now()
      }, { merge: true });
  }

  async updateUserProfile(data: Partial<UserProfile>) {
      if (!this.userId) return;
      const userRef = doc(db, 'user_profiles', this.userId);
      await setDoc(userRef, data, { merge: true });
  }

  async updateDailyGoal(hours: number) {
      if (!this.userId) {
          localStorage.setItem('ekagrazone_targetHours', hours.toString());
          return;
      }
      const userRef = doc(db, 'user_profiles', this.userId);
      await setDoc(userRef, { dailyGoal: hours }, { merge: true });
  }

  private async syncToFirestore(collectionName: string, data: any) {
    if (!this.userId || collectionName === STORE_CUSTOM_SOUNDS) return;
    try { await setDoc(doc(db, 'users', this.userId, collectionName, data.id), data); } catch (e) { console.error(`Failed to sync ${collectionName}`, e); }
  }

  private async deleteFromFirestore(collectionName: string, id: string) {
    if (!this.userId || collectionName === STORE_CUSTOM_SOUNDS) return;
    try { await deleteDoc(doc(db, 'users', this.userId, collectionName, id)); } catch (e) { console.error(`Failed to delete ${collectionName}`, e); }
  }

  private async deleteCloudDocsByDate(collectionName: string, dateString: string) {
      if (!this.userId) return;
      try {
          const q = query(collection(db, 'users', this.userId, collectionName), where('dateString', '==', dateString));
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          snapshot.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
      } catch (e) { console.error(`Batch delete failed`, e); }
  }

  async syncSettingsToCloud() {
    if (!this.userId) return;
    try {
        const data: Record<string, string> = {};
        LOCAL_STORAGE_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) data[key] = val;
        });
        await setDoc(doc(db, 'users', this.userId, 'settings', 'config'), data, { merge: true });
    } catch (e) { console.error("Failed to sync settings", e); }
  }
  
  async pullFromFirestore() { if (!this.userId) return; }

  async syncLocalToCloud() {
      if (!this.userId) return;
      await this.syncSettingsToCloud();
      const collections = [STORE_SESSIONS, STORE_SUBJECTS, STORE_GOALS, STORE_TASKS, STORE_EXAMS, STORE_JOURNAL, STORE_CHATS, STORE_DAILY_NOTES, STORE_MOCK_TESTS];
      
      // Merge Strategy: Prefer Local (Guest) data if it exists, then sync to cloud
      for (const colName of collections) {
          // 1. Check LocalStorage (Guest Data)
          const localData = localStorage.getItem(colName);
          if (localData) {
              try {
                  const items = JSON.parse(localData);
                  if (Array.isArray(items)) {
                      console.log(`Syncing ${items.length} items from localStorage for ${colName}`);
                      items.forEach(item => this.syncToFirestore(colName, item));
                  }
                  localStorage.removeItem(colName); // Clean up after sync
              } catch (e) {
                  console.error(`Failed to parse localStorage for ${colName}`, e);
              }
          }

          // 2. Check IndexedDB (Local Cache)
          const db = await this.connect();
          const tx = db.transaction(colName, 'readonly');
          const store = tx.objectStore(colName);
          const request = store.getAll();
          request.onsuccess = () => {
              const items = request.result;
              items.forEach(item => this.syncToFirestore(colName, item));
          };
      }
  }

  async saveSession(session: StudySession): Promise<{ levelUp: boolean, newLevel: number }> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = transaction.objectStore(STORE_SESSIONS);
      const request = store.put(session);
      request.onsuccess = async () => {
          this.syncToFirestore(STORE_SESSIONS, session);
          // Update Stats and Check for Level Up
          const statsResult = await this.updateUserStats(session.durationMs);
          resolve(statsResult);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_SESSIONS, 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const getReq = store.get(id);
        getReq.onsuccess = async () => {
            const session = getReq.result as StudySession;
            const request = store.delete(id);
            request.onsuccess = async () => {
                this.deleteFromFirestore(STORE_SESSIONS, id);
                if (session) await this.updateUserStats(-session.durationMs);
                resolve();
            };
            request.onerror = () => reject(request.error);
        };
    });
  }

  async getSessionsByDate(dateString: string): Promise<StudySession[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORE_SESSIONS);
      const index = store.index('dateString');
      const request = index.getAll(dateString);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(): Promise<StudySession[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORE_SESSIONS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSessionsByDate(dateString: string): Promise<void> {
    await this.deleteCloudDocsByDate(STORE_SESSIONS, dateString);
    const db = await this.connect();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const index = store.index('dateString');
        const request = index.getAllKeys(dateString);
        request.onsuccess = () => {
            const keys = request.result;
            keys.forEach(key => store.delete(key));
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }

  // --- Basic CRUD for other stores (Simplified for brevity as they follow pattern) ---
  async getSubjects(): Promise<Subject[]> { 
    if (!this.userId) {
        return this.getAllFromStore(STORE_SUBJECTS, DEFAULT_SUBJECTS);
    }
    
    try {
        // Try to get from user document first (New Schema: Array in Document)
        const userDoc = await getDoc(doc(db, 'users', this.userId));
        if (userDoc.exists() && userDoc.data().subjects) {
            const subjects = userDoc.data().subjects as Subject[];
            
            // Sync to IndexedDB for offline access
            const localDb = await this.connect();
            const tx = localDb.transaction(STORE_SUBJECTS, 'readwrite');
            const store = tx.objectStore(STORE_SUBJECTS);
            store.clear().onsuccess = () => {
                subjects.forEach(s => store.put(s));
            };
            return subjects;
        }
    } catch (e) {
        console.warn("Error fetching subjects from cloud document:", e);
    }

    // Fallback to IndexedDB (Old Schema: Subcollection items might be here)
    return this.getAllFromStore(STORE_SUBJECTS, DEFAULT_SUBJECTS); 
  }

  async saveSubject(item: Subject) { await this.saveToStore(STORE_SUBJECTS, item); }

  async saveSubjects(items: Subject[]) {
      // 1. Guest Mode: Simple LocalStorage overwrite
      if (!this.userId) {
          localStorage.setItem(STORE_SUBJECTS, JSON.stringify(items));
          return;
      }

      // 2. Cloud Mode: Save as array in user document (Atomic & Reliable)
      try {
          const userDocRef = doc(db, 'users', this.userId);
          await setDoc(userDocRef, { subjects: items }, { merge: true });
      } catch (e) {
          console.error("Failed to save subjects to Firestore document:", e);
          throw e;
      }

      // 3. Keep IndexedDB in sync for offline support
      const dbInstance = await this.connect();
      return new Promise<void>((resolve, reject) => {
          const tx = dbInstance.transaction(STORE_SUBJECTS, 'readwrite');
          const store = tx.objectStore(STORE_SUBJECTS);
          
          // Clear and refill to match the array exactly
          store.clear().onsuccess = () => {
              items.forEach(item => store.put(item));
          };

          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }
  async deleteSubject(id: string) { await this.deleteFromStore(STORE_SUBJECTS, id); }
  
  async getGoalsByDate(dateString: string): Promise<DailyGoal[]> { return this.getByDateFromStore(STORE_GOALS, dateString); }
  async getAllGoals(): Promise<DailyGoal[]> { return this.getAllFromStore(STORE_GOALS); }
  async saveGoal(item: DailyGoal) { await this.saveToStore(STORE_GOALS, item); }
  async deleteGoal(id: string) { await this.deleteFromStore(STORE_GOALS, id); }
  async deleteGoalsByDate(date: string) { await this.deleteByDate(STORE_GOALS, date); }

  async getTasks(): Promise<Task[]> { return this.getAllFromStore(STORE_TASKS); }
  async saveTask(item: Task) { await this.saveToStore(STORE_TASKS, item); }
  async deleteTask(id: string) { await this.deleteFromStore(STORE_TASKS, id); }
  async deleteTasksByDate(date: string) { await this.deleteByDate(STORE_TASKS, date); }

  async getExams(): Promise<Exam[]> { return this.getAllFromStore(STORE_EXAMS); }
  async saveExam(item: Exam) { await this.saveToStore(STORE_EXAMS, item); }
  async deleteExam(id: string) { await this.deleteFromStore(STORE_EXAMS, id); }

  async getChatHistory(): Promise<ChatMessage[]> { return this.getAllFromStore(STORE_CHATS); }
  async saveChatMessage(item: ChatMessage) { await this.saveToStore(STORE_CHATS, item); }

  async getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
      const db = await this.connect();
      return new Promise((resolve) => {
          if (!db.objectStoreNames.contains(STORE_JOURNAL)) return resolve(null);
          const tx = db.transaction(STORE_JOURNAL, 'readonly');
          const idx = tx.objectStore(STORE_JOURNAL).index('dateString');
          idx.get(date).onsuccess = (e) => resolve((e.target as IDBRequest).result || null);
      });
  }
  async getAllJournalEntries(): Promise<JournalEntry[]> { return this.getAllFromStore(STORE_JOURNAL); }
  async saveJournalEntry(item: JournalEntry) { await this.saveToStore(STORE_JOURNAL, item); }
  async deleteJournalByDate(date: string) { await this.deleteByDate(STORE_JOURNAL, date); }

  async getDailyNote(dateString: string): Promise<DailyNote | null> {
      const db = await this.connect();
      return new Promise((resolve) => {
          if (!db.objectStoreNames.contains(STORE_DAILY_NOTES)) return resolve(null);
          const tx = db.transaction(STORE_DAILY_NOTES, 'readonly');
          const store = tx.objectStore(STORE_DAILY_NOTES);
          store.get(dateString).onsuccess = (e) => resolve((e.target as IDBRequest).result || null);
      });
  }
  async getAllDailyNotes(): Promise<DailyNote[]> { return this.getAllFromStore(STORE_DAILY_NOTES); }
  async saveDailyNote(item: DailyNote) { await this.saveToStore(STORE_DAILY_NOTES, item); }
  async deleteDailyNote(dateString: string) { await this.deleteFromStore(STORE_DAILY_NOTES, dateString); }

  async getCustomSounds(): Promise<CustomSound[]> { return this.getAllFromStore(STORE_CUSTOM_SOUNDS); }
  async saveCustomSound(item: CustomSound) { await this.saveToStore(STORE_CUSTOM_SOUNDS, item, true); }
  async deleteCustomSound(id: string) { await this.deleteFromStore(STORE_CUSTOM_SOUNDS, id, true); }

  async getMockTests(): Promise<MockTest[]> { return this.getAllFromStore(STORE_MOCK_TESTS); }
  async saveMockTest(item: MockTest) { await this.saveToStore(STORE_MOCK_TESTS, item); }
  async deleteMockTest(id: string) {
    if (!this.userId) {
        let tests = await this.getMockTests();
        // Handle deleting a setup and all its attempts
        const testToDelete = tests.find(t => t.id === id);
        if (testToDelete && !testToDelete.setupId) {
            tests = tests.filter(t => t.id !== id && t.setupId !== id);
        } else {
            // Handle deleting a single attempt
            tests = tests.filter(t => t.id !== id);
        }
        localStorage.setItem(STORE_MOCK_TESTS, JSON.stringify(tests));
        return;
    }

    // 1. Capture ID locally & 2. Fix Path Construction
    const idToDelete = String(id);
    if (!idToDelete || idToDelete === 'undefined' || idToDelete === 'null') {
        console.error("Invalid ID provided for deletion:", id);
        return Promise.reject("Invalid ID");
    }

    const localDb = await this.connect();
    const tx = localDb.transaction(STORE_MOCK_TESTS, 'readwrite');
    const store = tx.objectStore(STORE_MOCK_TESTS);

    // First, delete locally to update UI quickly
    store.delete(idToDelete);

    // Then, handle Firestore deletion
    if (this.userId) {
        const batch = writeBatch(db);
        const mainDocRef = doc(db, 'users', this.userId, STORE_MOCK_TESTS, idToDelete);
        batch.delete(mainDocRef);

        // Also delete associated attempts if this is a setup
        const attemptsQuery = query(collection(db, 'users', this.userId, STORE_MOCK_TESTS), where('setupId', '==', idToDelete));
        try {
            const attemptsSnapshot = await getDocs(attemptsQuery);
            // 3. Correct the Deletion Loop
            attemptsSnapshot.forEach(docSnap => {
                if (docSnap.exists()) {
                    batch.delete(docSnap.ref);
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting mock test and its attempts from Firestore:", error);
            // Note: Local deletion has already happened.
            // A more robust system might re-sync or handle this inconsistency.
            throw error;
        }
    }

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

  // --- Generic Helpers ---
  private async getAllFromStore(storeName: string, defaults: any[] = []): Promise<any[]> {
      if (!this.userId) {
          const localData = localStorage.getItem(storeName);
          return localData ? JSON.parse(localData) : defaults;
      }
      const db = await this.connect();
      return new Promise((resolve, reject) => {
          if (!db.objectStoreNames.contains(storeName)) { resolve(defaults); return; }
          const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
          req.onsuccess = () => resolve(req.result.length ? req.result : defaults);
          req.onerror = () => reject(req.error);
      });
  }
  private async saveToStore(storeName: string, item: any, localOnly = false) {
      if (!this.userId) {
          const items = await this.getAllFromStore(storeName);
          const idx = items.findIndex((i: any) => i.id === item.id);
          if (idx > -1) items[idx] = item;
          else items.push(item);
          localStorage.setItem(storeName, JSON.stringify(items));
          return;
      }
      const db = await this.connect();
      return new Promise<void>((resolve, reject) => {
          const req = db.transaction(storeName, 'readwrite').objectStore(storeName).put(item);
          req.onsuccess = () => { if(!localOnly) this.syncToFirestore(storeName, item); resolve(); };
          req.onerror = () => reject(req.error);
      });
  }
  private async deleteFromStore(storeName: string, id: string, localOnly = false) {
      if (!this.userId) {
          const items = await this.getAllFromStore(storeName);
          const filtered = items.filter((i: any) => i.id !== id);
          localStorage.setItem(storeName, JSON.stringify(filtered));
          return;
      }
      const db = await this.connect();
      return new Promise<void>((resolve, reject) => {
          const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
          req.onsuccess = () => { if(!localOnly) this.deleteFromFirestore(storeName, id); resolve(); };
          req.onerror = () => reject(req.error);
      });
  }
  private async getByDateFromStore(storeName: string, date: string): Promise<any[]> {
      if (!this.userId) {
          const items = await this.getAllFromStore(storeName);
          return items.filter((i: any) => i.dateString === date);
      }
      const db = await this.connect();
      return new Promise((resolve) => {
          if (!db.objectStoreNames.contains(storeName)) return resolve([]);
          const idx = db.transaction(storeName, 'readonly').objectStore(storeName).index('dateString');
          idx.getAll(date).onsuccess = (e) => resolve((e.target as IDBRequest).result);
      });
  }
  private async deleteByDate(storeName: string, date: string) {
      if (!this.userId) {
          const items = await this.getAllFromStore(storeName);
          const filtered = items.filter((i: any) => i.dateString !== date);
          localStorage.setItem(storeName, JSON.stringify(filtered));
          return;
      }
      await this.deleteCloudDocsByDate(storeName, date);
      const db = await this.connect();
      return new Promise<void>((resolve) => {
          const tx = db.transaction([storeName], 'readwrite');
          const idx = tx.objectStore(storeName).index('dateString');
          idx.getAllKeys(date).onsuccess = (e) => {
              (e.target as IDBRequest).result.forEach((k: any) => tx.objectStore(storeName).delete(k));
          };
          tx.oncomplete = () => resolve();
      });
  }

  async factoryReset(): Promise<void> {
      if (this.userId) {
          // 1. Wipe Firestore Collections
          const collections = [STORE_SESSIONS, STORE_SUBJECTS, STORE_GOALS, STORE_TASKS, STORE_EXAMS, STORE_JOURNAL, STORE_CHATS, STORE_DAILY_NOTES, STORE_MOCK_TESTS];
          const batch = writeBatch(db);
          for (const col of collections) {
              const snapshot = await getDocs(collection(db, 'users', this.userId, col));
              snapshot.forEach(doc => batch.delete(doc.ref));
          }
          
          // 2. Reset Profile Metrics (Firestore)
          const profileRef = doc(db, 'user_profiles', this.userId);
          batch.update(profileRef, { 
              totalFocusMs: 0, 
              xp: 0, 
              level: 1,
              lastActive: Date.now() 
          });
          
          // Delete settings
          batch.delete(doc(db, 'users', this.userId, 'settings', 'config'));
          
          await batch.commit();

          // 3. Reset Realtime Database (Leaderboard Wipe)
          // Set stats to 0/1/0 to effectively remove from leaderboard ranking logic
          const rtdbStatsRef = ref(rtdb, `users/${this.userId}/stats`);
          await rtdbUpdate(rtdbStatsRef, {
              totalXP: 0,
              level: 1,
              totalFocusMs: 0
          });

          // Remove milestones
          await rtdbRemove(ref(rtdb, `users/${this.userId}/milestones`));
          await rtdbRemove(ref(rtdb, `users/${this.userId}/lastMilestone`));
      } 
      
      // 4. Wipe Local IndexedDB
      const dbInstance = await this.connect();
      const stores = [STORE_SESSIONS, STORE_SUBJECTS, STORE_GOALS, STORE_TASKS, STORE_EXAMS, STORE_JOURNAL, STORE_CHATS, STORE_DAILY_NOTES, STORE_CUSTOM_SOUNDS, STORE_MOCK_TESTS];
      const existingStores = stores.filter(s => dbInstance.objectStoreNames.contains(s));
      const tx = dbInstance.transaction(existingStores, 'readwrite');
      existingStores.forEach(s => tx.objectStore(s).clear());
      
      // 5. Wipe Local Storage
      LOCAL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('ekagrazone_guest_xp');
      localStorage.removeItem('ekagrazone_guest_level');
      localStorage.removeItem('ekagrazone_guest_totalFocusMs');
      
      window.dispatchEvent(new Event('ekagrazone_sync_complete'));
  }

  async createBackup(): Promise<any> {
    return {
        sessions: await this.getAllSessions(),
        subjects: await this.getSubjects(),
        goals: await this.getAllGoals(),
        tasks: await this.getTasks(),
        exams: await this.getExams(),
        chats: await this.getChatHistory(),
        journal: await this.getAllJournalEntries(),
        dailyNotes: await this.getAllDailyNotes(),
        customSounds: await this.getCustomSounds()
    };
  }
}

export const dbService = new LocalDB();
