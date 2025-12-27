## 📘 `docs/matchmaking.md`

### Tujuan

Menjelaskan sistem **auto-play matchmaking tanpa lobby**.

---

### Konsep Utama

* Tidak ada lobby manual
* Player langsung masuk game saat membuka web
* Room bersifat **ephemeral (in-memory)**

---

### Matchmaking Flow

```
Player Connect
 → Assign playerId
 → Push to Queue
 → If queue >= 2:
     → Create GameRoom
     → Assign roles
     → Start Game
```

---

### Player Role Assignment

* Player pertama masuk → `PLAYER_1`
* Player kedua masuk → `PLAYER_2`

Game **tidak mengenal identitas lain** (username, rank, dsb).

---

### Room Lifecycle

```
CREATE → PLAYING → END → DESTROY
```

Tidak ada persistence pada MVP.

---

### Scaling Note (Future)

* Multiple room paralel bisa ditambahkan
* Matchmaker tetap stateless (in-memory)

---