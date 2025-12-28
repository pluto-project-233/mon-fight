# 🧠 CORE PRINCIPLE (WAJIB PEGANG)

> **FE TIDAK PERNAH “BERPIKIR” BOARD BERUBAH**
> **FE HANYA “MEMAINKAN PERUBAHAN” YANG SUDAH DIPUTUSKAN BE**

Artinya:

* FE **tidak hitung gravity**
* FE **tidak hitung posisi akhir**
* FE **tidak overlap animasi**
* FE **tidak lompat state**

---

# 🔁 SINGLE SOURCE OF TRUTH FLOW

```
BE: board_t0
  → clear
  → gravity
  → spawn
BE emits events IN ORDER

FE: event queue
  → animate step-by-step
  → apply visual state ONLY after animation ends
```

---

# ❌ ROOT CAUSE BUG YANG SERING TERJADI

| Bug               | Penyebab                                |
| ----------------- | --------------------------------------- |
| Orb “teleport”    | FE update board sebelum animasi selesai |
| Orb double drop   | FE auto gravity + BE gravity            |
| Orb mismatch      | FE spawn sendiri                        |
| Animation overlap | FE tidak queue WS events                |
| Orb hilang        | FE clear + BE clear                     |

---

# ✅ SOLUSI: **FRAME-LOCKED EVENT QUEUE**

---

# 🧩 FE ARCHITECTURE (WAJIB ADA)

## FE STATE LAYER

```
BoardModel        ← logical board (mirror BE)
VisualBoard       ← sprite positions
AnimationQueue    ← WS events
InputLock         ← boolean
```

---

# 🔁 DETAILED TIMELINE (REAL TIME)

## SCENARIO: 1 SWAP → 1 MATCH → GRAVITY → SPAWN

---

## 0️⃣ Initial State

| Layer          | State    |
| -------------- | -------- |
| BE             | board_t0 |
| FE BoardModel  | board_t0 |
| FE VisualBoard | rendered |
| FE Input       | ENABLED  |

---

## 1️⃣ FE SENDS PLAYER_SWAP

| Time | Actor | Action                            |
| ---- | ----- | --------------------------------- |
| t0   | FE    | User swap                         |
| t0   | FE    | **InputLock = true**              |
| t0   | FE    | Send `PLAYER_SWAP`                |
| t0   | FE    | (Optional) animate tentative swap |

⚠️ **IMPORTANT**

* Tentative animation **MUST be reversible**
* Jangan update BoardModel

---

## 2️⃣ BE PROCESSES & RESPONDS

BE:

```
swap → detect match → resolve loop
```

BE sends events IN ORDER:

```
SWAP_ACCEPTED
ORB_CLEARED
GRAVITY_APPLIED
ORB_SPAWNED
TURN_CONTINUE
```

---

# 🎯 FE EVENT HANDLING (THIS IS CRITICAL)

---

## 3️⃣ FE RECEIVES EVENTS → QUEUE

```ts
ws.onMessage(event => {
  animationQueue.push(event)
})
```

🚫 **FE MUST NOT**

* Process immediately
* Merge events
* Skip animation

---

## 4️⃣ FE PROCESS QUEUE (STRICT FIFO)

```ts
if (!isAnimating) {
  processNextEvent()
}
```

---

## 5️⃣ EVENT: ORB_CLEARED

### BE Meaning

> Orb at positions X,Y are now EMPTY

### FE MUST DO

| Step | FE Action                 |
| ---- | ------------------------- |
| 5.1  | Play destroy animation    |
| 5.2  | WAIT animation end        |
| 5.3  | Update BoardModel → EMPTY |
| 5.4  | Update VisualBoard        |

🚫 **BUG IF**

* BoardModel updated before animation ends

---

## 6️⃣ EVENT: GRAVITY_APPLIED

### BE Meaning

> These orbs moved DOWN by N cells

Payload example:

```json
{
  "columns": [
    { "x":2, "fromY":1, "toY":4, "orbId":"a1" }
  ]
}
```

### FE MUST DO

| Step | FE Action                            |
| ---- | ------------------------------------ |
| 6.1  | Animate orb falling from fromY → toY |
| 6.2  | WAIT animation                       |
| 6.3  | Update BoardModel positions          |
| 6.4  | Update VisualBoard                   |

🚫 **BUG IF**

* FE recompute gravity sendiri
* FE assumes all columns drop same distance

---

## 7️⃣ EVENT: ORB_SPAWNED

### BE Meaning

> New orbs spawned at TOP and fall in

Payload:

```json
{
  "orbs": [
    { "id":"n1", "x":2, "spawnY":-1, "finalY":0 }
  ]
}
```

### FE MUST DO

| Step | FE Action                 |
| ---- | ------------------------- |
| 7.1  | Create sprite at spawnY   |
| 7.2  | Animate falling to finalY |
| 7.3  | WAIT animation            |
| 7.4  | Insert into BoardModel    |

🚫 **BUG IF**

* FE spawns instantly at finalY
* FE generates orb type sendiri

---

## 8️⃣ LOOP CONTINUES (IF COMBO)

FE **does not decide** if loop continues
FE **just keeps consuming events**

---

## 9️⃣ EVENT: TURN_CONTINUE / TURN_END

| Event         | FE Action       |
| ------------- | --------------- |
| TURN_CONTINUE | InputLock=false |
| TURN_END      | InputLock=true  |

🚫 **BUG IF**

* Input unlocked earlier
* User can swap mid-animation

---

# 🔐 ABSOLUTE FE RULES (PRINT THIS)

| Rule                                  | Why                 |
| ------------------------------------- | ------------------- |
| One WS event → one animation          | No overlap          |
| Never mutate BoardModel mid-animation | Prevent teleport    |
| BoardModel updated AFTER animation    | Sync visual + logic |
| No FE gravity                         | Deterministic       |
| Input locked until TURN_*             | No race             |

---

# 🧪 OPTIONAL BUT STRONGLY RECOMMENDED

## Board Revision ID

BE sends:

```json
{ "boardRev": 17 }
```

FE:

```ts
assert(event.boardRev === currentRev + 1)
```

➡️ If mismatch → **force resync**

---

# 🧠 WHY THIS SOLVES DESYNC

* FE is a **replay engine**
* BE is the **game engine**
* Animation becomes **purely cosmetic**
* Order is enforced
* State mutation is serialized
