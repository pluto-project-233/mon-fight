## 📘 `docs/puzzle-engine.md`

### Tujuan

Mendefinisikan **aturan puzzle** yang deterministik dan dapat di-unit-test.

---

### Board Specification

* Grid: **7 x 5** (default)
* Orientation:

  * X = column
  * Y = row (top → bottom)

---

### Orb Types

* RED
* BLUE
* GREEN
* YELLOW
* PURPLE

---

### Match Rules

Match valid jika:

* Minimum **3 orb**
* Bentuk:

  * Linear (horizontal / vertical)
  * L
  * T
  * Cross (+)

---

### Resolve Loop

```
Find Matches
 → Clear matched orbs
 → Apply gravity
 → Refill from top (seeded RNG)
 → Repeat until no match
```

---

### Gravity Rule

* Orbs jatuh **ke bawah**
* Refill hanya datang dari **atas**
* Tidak ada spawn dari samping / bawah

---

### Determinism Rule

* Semua refill menggunakan **seeded RNG**
* Seed disimpan per GameRoom
* Tidak boleh menggunakan `Math.random()`

---