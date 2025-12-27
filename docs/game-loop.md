## 📘 `docs/game-loop.md`

### Tujuan

Mendefinisikan **alur permainan inti** (core gameplay loop) secara deterministik dan server-authoritative.

---

### High-Level Game Flow

```
Client Connect
 → Auto Matchmaking
 → Game Start
 → Turn Loop
 → Game End
```

---

### Turn Loop (Authoritative)

```
TURN START
  ↓
WAIT PLAYER INPUT
  ↓
VALIDATE MOVE
  ↓
PUZZLE RESOLVE LOOP
  ├─ Match Detection
  ├─ Clear Orbs
  ├─ Gravity
  ├─ Refill (seed-based)
  └─ Repeat until no match
  ↓
CHARGE MONSTER
  ↓
DAMAGE RESOLUTION
  ↓
CHECK GAME END
  ↓
SWITCH TURN
```

---

### Rules

* Game bersifat **turn-based**
* 1 turn = **1 move**
* Semua kalkulasi dilakukan di **backend**
* Frontend hanya menerima **snapshot GameState**

---

### Game End Condition

* Salah satu player HP ≤ 0
* Disconnect (optional rule)

---